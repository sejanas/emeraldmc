#!/usr/bin/env node
/**
 * migrate.mjs — Supabase → Supabase Data Migration
 * Requires Node.js 18+ (native fetch, no npm install needed)
 *
 * Commands:
 *   node migrate.mjs                     — Part A: REST migration (15 tables)
 *   node migrate.mjs --dry-run           — simulate without writing anything
 *   node migrate.mjs --sql-guide         — print SQL to run in Lovable SQL Editor
 *   node migrate.mjs --generate-auth-sql — read auth_users.csv → write insert_auth_users.sql
 *   node migrate.mjs --import-csvs       — Part C: import user tables from CSV exports
 *   node migrate.mjs --import-csvs --dry-run  — simulate CSV import
 *
 * ─── TWO-PHASE WORKFLOW ──────────────────────────────────────────────────────
 *
 * PHASE 1 — REST (run immediately):
 *   node migrate.mjs
 *   → migrates: test_categories, packages, doctors, gallery, faqs, blogs,
 *               certifications, site_settings, visitors, tests, bookings,
 *               sub_tests, test_category_map, package_tests, booking_updates
 *
 * PHASE 2 — Manual CSV export + import (see --sql-guide):
 *   1. node migrate.mjs --sql-guide            → get SQL queries to run in Lovable
 *   2. Export 7 CSVs from Lovable SQL Editor
 *   3. node migrate.mjs --generate-auth-sql    → creates insert_auth_users.sql
 *   4. Paste insert_auth_users.sql into DESTINATION SQL Editor and run
 *   5. node migrate.mjs --import-csvs          → migrates user_roles, user_profiles,
 *                                                user_phones, user_emails,
 *                                                activity_logs, notifications
 *
 * ⚠ SOURCE_ADMIN_JWT expires every hour.
 *   Refresh: login to source app → DevTools → Application → Local Storage
 *   → sb-kswypwqxxhsbnrhnqrzm-auth-token → access_token
 *   Then either paste it in CONFIG.source.adminJwt below, or:
 *   SOURCE_ADMIN_JWT=<token> node migrate.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname }                        from 'node:path';
import { fileURLToPath }                           from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  source: {
    url:     process.env.SOURCE_SUPABASE_URL,
    anonKey: process.env.SOURCE_SUPABASE_ANON_KEY,
    adminJwt: process.env.SOURCE_ADMIN_JWT || '',
  },
  dest: {
    url:        process.env.VITE_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  pageSize:    1000,  // rows per source fetch
  batchSize:   500,   // rows per destination upsert call
  maxRetries:  3,
  retryBaseMs: 1000,
  timeoutMs:   30_000,
};

// ─────────────────────────────────────────────────────────────────────────────
// TABLE CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

// Tables on source that have an admin-only SELECT policy (need admin JWT)
const ADMIN_JWT_TABLES = new Set(['bookings', 'booking_updates']);

// Tables where the unique key for upsert conflict resolution is NOT the primary key (id).
// PostgREST merge-duplicates uses the primary key by default; override per-table here.
// Value is the column name to pass as ?on_conflict= query param.
const UPSERT_ON_CONFLICT = {
  site_settings: 'key',
  blogs:         'slug',
};

// FK-safe REST migration order.
// user_roles is excluded here because it has a hard FK → auth.users(id).
// It must be imported AFTER auth.users are inserted (--import-csvs phase).
const REST_TABLES = [
  // Tier 1 — no FK dependencies
  'test_categories',
  'packages',
  'doctors',
  'gallery',
  'faqs',
  'blogs',
  'certifications',
  'site_settings',
  'visitors',
  // Tier 2 — depends on Tier 1
  'tests',
  'bookings',         // ← requires admin JWT
  // Tier 3 — depends on Tier 2
  'sub_tests',
  'test_category_map',
  'package_tests',
  'booking_updates',  // ← requires admin JWT
];

// CSV import order — all have FK → auth.users, so run AFTER auth SQL is applied.
const CSV_TABLES = [
  { table: 'user_roles',    file: 'user_roles.csv' },
  { table: 'user_profiles', file: 'user_profiles.csv' },
  { table: 'user_phones',   file: 'user_phones.csv' },
  { table: 'user_emails',   file: 'user_emails.csv' },
  { table: 'activity_logs', file: 'activity_logs.csv' },
  { table: 'notifications', file: 'notifications.csv' },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOGGING
// ─────────────────────────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m',
  cyan: '\x1b[36m', magenta: '\x1b[35m', gray: '\x1b[90m',
};

const log = {
  info:    (...a) => console.log(`${c.cyan}ℹ${c.reset} `, ...a),
  success: (...a) => console.log(`${c.green}✓${c.reset} `, ...a),
  warn:    (...a) => console.log(`${c.yellow}⚠${c.reset} `, ...a),
  error:   (...a) => console.log(`${c.red}✗${c.reset} `, ...a),
  section: (msg)  => console.log(
    `\n${c.bold}${c.magenta}── ${msg} ${'─'.repeat(Math.max(0, 52 - msg.length))}${c.reset}`,
  ),
  dim:     (msg)  => console.log(`   ${c.dim}${msg}${c.reset}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Exponential-backoff retry wrapper.
 *  @param {Function} fn        async function to call
 *  @param {string}   label     log prefix
 *  @param {Function} [canRetry] (err) => bool — false means fail immediately (default: always retry)
 */
async function withRetry(fn, label, canRetry = () => true) {
  let lastErr;
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!canRetry(err) || attempt >= CONFIG.maxRetries) break;
      const delay = CONFIG.retryBaseMs * 2 ** (attempt - 1);
      log.warn(`${label} — attempt ${attempt}/${CONFIG.maxRetries} failed, retrying in ${delay}ms…`);
      log.dim(err.message.slice(0, 150));
      await sleep(delay);
    }
  }
  throw lastErr;
}

/** fetch() with a hard timeout (AbortController) */
async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV PARSER  (RFC 4180, zero dependencies)
// Distinguishes NULL (unquoted empty) from ''  (quoted empty).
// ─────────────────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Auto-detect delimiter from first line (semicolon or comma)
  const firstLine = src.slice(0, src.indexOf('\n'));
  const delim     = firstLine.includes(';') ? ';' : ',';

  const rows      = [];
  let headers     = null;
  let field       = '';
  let wasQuoted   = false;
  let inQuotes    = false;
  let fields      = [];
  let quotedFlags = [];

  const commitField = () => {
    fields.push(field);
    quotedFlags.push(wasQuoted);
    field     = '';
    wasQuoted = false;
  };

  const commitRow = () => {
    commitField();
    if (headers === null) {
      headers = [...fields];
    } else {
      const row = {};
      headers.forEach((h, i) => {
        const v = fields[i] ?? '';
        row[h] = !quotedFlags[i] && v === '' ? null : v;
      });
      rows.push(row);
    }
    fields      = [];
    quotedFlags = [];
  };

  for (let i = 0; i < src.length; i++) {
    const ch   = src[i];
    const next = src[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"')             inQuotes = false;
      else                             field   += ch;
    } else if (ch === '"') {
      inQuotes  = true;
      wasQuoted = true;
    } else if (ch === delim) {
      commitField();
    } else if (ch === '\n') {
      commitRow();
    } else {
      field += ch;
    }
  }

  // Last line without trailing newline
  if (headers !== null && (field !== '' || fields.length > 0)) commitRow();

  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP HEADERS
// ─────────────────────────────────────────────────────────────────────────────

function sourceHeaders(useAdmin = false) {
  const token = useAdmin ? CONFIG.source.adminJwt : CONFIG.source.anonKey;
  return {
    apikey:        CONFIG.source.anonKey,
    Authorization: `Bearer ${token}`,
    Accept:        'application/json',
  };
}

function destHeaders() {
  return {
    apikey:          CONFIG.dest.serviceKey,
    Authorization:   `Bearer ${CONFIG.dest.serviceKey}`,
    'Content-Type':  'application/json',
    Prefer:          'resolution=merge-duplicates,return=minimal',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE — FETCH
// ─────────────────────────────────────────────────────────────────────────────

// Sentinel thrown when the table simply doesn't exist on the source schema
class TableNotFoundError extends Error {
  constructor(table) { super(`Table '${table}' not found on source (not yet deployed there)`); this.table = table; }
}

async function fetchPage(table, offset, useAdmin) {
  const params = new URLSearchParams({ select: '*', limit: String(CONFIG.pageSize), offset: String(offset) });
  const url    = `${CONFIG.source.url}/rest/v1/${table}?${params}`;
  const res    = await fetchWithTimeout(url, { headers: sourceHeaders(useAdmin) });

  if (!res.ok) {
    const body = await res.text();
    // PGRST205 = relation not found in schema cache
    if (res.status === 404 && body.includes('PGRST205')) throw new TableNotFoundError(table);
    throw new Error(`Source HTTP ${res.status} [${table} offset=${offset}]: ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function fetchAllRows(table) {
  const useAdmin = ADMIN_JWT_TABLES.has(table);
  const all      = [];
  let offset     = 0;

  while (true) {
    // Let TableNotFoundError propagate without retrying
    let page;
    try {
      page = await withRetry(
        () => fetchPage(table, offset, useAdmin),
        `fetch ${table}[${offset}]`,
        (e) => !(e instanceof TableNotFoundError), // don't retry 404-not-found
      );
    } catch (err) {
      throw err; // re-throw as-is (caller distinguishes TableNotFoundError)
    }
    all.push(...page);
    if (page.length < CONFIG.pageSize) break;
    offset += CONFIG.pageSize;
  }
  return all;
}

// ─────────────────────────────────────────────────────────────────────────────
// DESTINATION — UPSERT
// ─────────────────────────────────────────────────────────────────────────────

async function upsertChunk(table, rows) {
  const onConflict = UPSERT_ON_CONFLICT[table];
  const url = `${CONFIG.dest.url}/rest/v1/${table}${onConflict ? `?on_conflict=${onConflict}` : ''}`;
  const res = await fetchWithTimeout(url, {
    method:  'POST',
    headers: destHeaders(),
    body:    JSON.stringify(rows),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dest HTTP ${res.status} [${table}]: ${body.slice(0, 400)}`);
  }
}

async function migrateRows(table, rows, dryRun) {
  if (rows.length === 0) return { inserted: 0, failed: 0, errors: [] };

  const chunks  = [];
  for (let i = 0; i < rows.length; i += CONFIG.batchSize) chunks.push(rows.slice(i, i + CONFIG.batchSize));

  let inserted = 0;
  let failed   = 0;
  const errors = [];

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    try {
      if (!dryRun) await withRetry(() => upsertChunk(table, chunk), `upsert ${table} chunk ${ci + 1}/${chunks.length}`);
      inserted += chunk.length;
    } catch (err) {
      failed += chunk.length;
      errors.push(err.message.slice(0, 300));
    }
  }
  return { inserted, failed, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// PART A — REST MIGRATION
// ─────────────────────────────────────────────────────────────────────────────

async function runRestMigration(dryRun) {
  const results       = [];
  const jwtMissing    = CONFIG.source.adminJwt === 'PASTE_FRESH_ADMIN_JWT_HERE';
  const adminTables   = REST_TABLES.filter((t) => ADMIN_JWT_TABLES.has(t));

  if (jwtMissing && adminTables.length > 0) {
    log.warn(`SOURCE_ADMIN_JWT not set — these tables will be skipped: ${adminTables.join(', ')}`);
    log.dim('Set it with: SOURCE_ADMIN_JWT=<token> node migrate.mjs');
    log.dim('Get token: login to source app → DevTools → Application → Local Storage → sb-...-auth-token → access_token');
    console.log();
  }

  for (const table of REST_TABLES) {
    if (ADMIN_JWT_TABLES.has(table) && jwtMissing) {
      process.stdout.write(`  ${c.yellow}⚠${c.reset} ${table.padEnd(20)} skipped (no admin JWT)\n`);
      results.push({ table, fetched: 0, inserted: 0, failed: 0, status: 'SKIPPED_NO_JWT' });
      continue;
    }

    process.stdout.write(`  ${c.cyan}→${c.reset} ${table.padEnd(20)} fetching… `);

    let rows;
    try {
      rows = await fetchAllRows(table);
    } catch (err) {
      if (err instanceof TableNotFoundError) {
        process.stdout.write(`\r  ${c.yellow}⚠${c.reset} ${table.padEnd(20)} not on source — skipping\n`);
        results.push({ table, fetched: 0, inserted: 0, failed: 0, status: 'NOT_ON_SOURCE' });
      } else {
        process.stdout.write(`\r  ${c.red}✗${c.reset} ${table.padEnd(20)} fetch failed\n`);
        log.dim(err.message.slice(0, 200));
        results.push({ table, fetched: 0, inserted: 0, failed: 0, status: 'FETCH_ERROR', errors: [err.message] });
      }
      continue;
    }

    process.stdout.write(
      `\r  ${c.cyan}→${c.reset} ${table.padEnd(20)} ${String(rows.length).padStart(5)} rows → upserting${dryRun ? ' (dry run)' : ''}… `,
    );

    const { inserted, failed, errors } = await migrateRows(table, rows, dryRun);
    const status = failed === 0 ? 'OK' : inserted === 0 ? 'ERROR' : 'PARTIAL';
    const icon   = status === 'OK' ? `${c.green}✓${c.reset}` : status === 'PARTIAL' ? `${c.yellow}⚠${c.reset}` : `${c.red}✗${c.reset}`;

    process.stdout.write(
      `\r  ${icon} ${table.padEnd(20)} ${String(rows.length).padStart(5)} rows` +
      (dryRun ? `  ${c.dim}(dry run — not written)${c.reset}` : `  inserted=${inserted}${failed > 0 ? `  ${c.red}failed=${failed}${c.reset}` : ''}`) +
      '\n',
    );

    if (errors.length > 0) errors.forEach((e) => log.dim(`  └─ ${e}`));
    results.push({ table, fetched: rows.length, inserted, failed, status, errors });
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// PART C — CSV IMPORT
// ─────────────────────────────────────────────────────────────────────────────

async function runCsvImport(dryRun) {
  const results = [];

  for (const { table, file } of CSV_TABLES) {
    const filePath = resolve(__dirname, file);

    if (!existsSync(filePath)) {
      process.stdout.write(`  ${c.yellow}⚠${c.reset} ${table.padEnd(20)} ${file} not found — skipping\n`);
      results.push({ table, fetched: 0, inserted: 0, failed: 0, status: 'SKIPPED_NO_FILE' });
      continue;
    }

    let rows;
    try {
      rows = parseCSV(readFileSync(filePath, 'utf8'));
    } catch (err) {
      log.error(`Failed to parse ${file}: ${err.message}`);
      results.push({ table, fetched: 0, inserted: 0, failed: 0, status: 'PARSE_ERROR', errors: [err.message] });
      continue;
    }

    process.stdout.write(
      `  ${c.cyan}→${c.reset} ${table.padEnd(20)} ${String(rows.length).padStart(5)} rows from ${file} → upserting${dryRun ? ' (dry run)' : ''}… `,
    );

    const { inserted, failed, errors } = await migrateRows(table, rows, dryRun);
    const status = failed === 0 ? 'OK' : inserted === 0 ? 'ERROR' : 'PARTIAL';
    const icon   = status === 'OK' ? `${c.green}✓${c.reset}` : status === 'PARTIAL' ? `${c.yellow}⚠${c.reset}` : `${c.red}✗${c.reset}`;

    process.stdout.write(
      `\r  ${icon} ${table.padEnd(20)} ${String(rows.length).padStart(5)} rows  ` +
      (dryRun ? `${c.dim}(dry run — not written)${c.reset}` : `inserted=${inserted}${failed > 0 ? `  ${c.red}failed=${failed}${c.reset}` : ''}`) +
      '\n',
    );

    if (errors.length > 0) errors.forEach((e) => log.dim(`  └─ ${e}`));
    results.push({ table, fetched: rows.length, inserted, failed, status, errors });
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL HELPERS — used by --generate-auth-sql
// ─────────────────────────────────────────────────────────────────────────────

const sqlStr  = (v) => (v == null || v === '') ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const sqlTs   = (v) => (v == null || v === '') ? 'NULL' : `'${v}'`;
const sqlBool = (v) => { if (v == null) return 'NULL'; const s = String(v).toLowerCase(); return (s === 'true' || s === 't' || s === '1') ? 'true' : (s === 'false' || s === 'f' || s === '0') ? 'false' : 'NULL'; };
const sqlJsonb = (v) => {
  if (v == null || v === '') return 'NULL';
  try { JSON.parse(v); return `'${String(v).replace(/'/g, "''")}'::jsonb`; } catch { return 'NULL'; }
};
const sqlInt = (v) => { const n = parseInt(v ?? '0', 10); return isNaN(n) ? '0' : String(n); };

// ─────────────────────────────────────────────────────────────────────────────
// --generate-auth-sql  (Part C helper)
// ─────────────────────────────────────────────────────────────────────────────

function generateAuthUsersSQL() {
  const csvPath = resolve(__dirname, 'auth_users.csv');
  if (!existsSync(csvPath)) {
    throw new Error(
      'auth_users.csv not found in the script directory.\n' +
      'Run: node migrate.mjs --sql-guide  to see the SQL query to export it.',
    );
  }

  const rows = parseCSV(readFileSync(csvPath, 'utf8'));
  if (rows.length === 0) throw new Error('auth_users.csv contains no data rows.');

  // Skip rows with no id — can appear if the export includes system/anonymous rows
  const validRows = rows.filter((r) => r.id && r.id.trim() !== '');
  log.info(`Building SQL for ${validRows.length} auth user${validRows.length !== 1 ? 's' : ''} (${rows.length - validRows.length} skipped — no id)…`);

  const valueLines = validRows.map(
    (r) => `  (${[
      sqlStr(r.id),
      sqlStr(r.aud   ?? 'authenticated'),
      sqlStr(r.role  ?? 'authenticated'),
      sqlStr(r.email),
      sqlStr(r.encrypted_password),
      sqlTs(r.email_confirmed_at),
      sqlTs(r.invited_at),
      sqlStr(r.confirmation_token),
      sqlTs(r.confirmation_sent_at),
      sqlStr(r.recovery_token),
      sqlTs(r.recovery_sent_at),
      sqlStr(r.email_change_token_new),
      sqlStr(r.email_change),
      sqlTs(r.email_change_sent_at),
      sqlTs(r.last_sign_in_at),
      sqlJsonb(r.raw_app_meta_data),
      sqlJsonb(r.raw_user_meta_data),
      sqlBool(r.is_super_admin),
      sqlTs(r.created_at),
      sqlTs(r.updated_at),
      sqlStr(r.phone),
      sqlTs(r.phone_confirmed_at),
      sqlStr(r.phone_change),
      sqlStr(r.phone_change_token),
      sqlTs(r.phone_change_sent_at),
      sqlStr(r.email_change_token_current),
      sqlInt(r.email_change_confirm_status),
      sqlTs(r.banned_until),
      sqlStr(r.reauthentication_token),
      sqlTs(r.reauthentication_sent_at),
      sqlBool(r.is_sso_user    ?? 'false'),
      sqlTs(r.deleted_at),
      sqlBool(r.is_anonymous   ?? 'false'),
    ].join(', ')})`,
  );

  return `-- ================================================================
-- auth.users INSERT — generated by migrate.mjs
-- Run this in your DESTINATION Supabase SQL Editor.
-- Do this BEFORE running: node migrate.mjs --import-csvs
-- Generated: ${new Date().toISOString()}
-- ${rows.length} user(s)
-- ================================================================
INSERT INTO auth.users (
  id, aud, role, email, encrypted_password,
  email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at,
  recovery_token, recovery_sent_at, email_change_token_new, email_change,
  email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
  phone_change, phone_change_token, phone_change_sent_at,
  email_change_token_current, email_change_confirm_status, banned_until,
  reauthentication_token, reauthentication_sent_at, is_sso_user,
  deleted_at, is_anonymous
)
VALUES
${valueLines.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  email                       = EXCLUDED.email,
  encrypted_password          = EXCLUDED.encrypted_password,
  email_confirmed_at          = EXCLUDED.email_confirmed_at,
  last_sign_in_at             = EXCLUDED.last_sign_in_at,
  raw_app_meta_data           = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data          = EXCLUDED.raw_user_meta_data,
  updated_at                  = EXCLUDED.updated_at,
  is_anonymous                = EXCLUDED.is_anonymous;
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// --sql-guide  (prints SQL for Lovable SQL Editor)
// ─────────────────────────────────────────────────────────────────────────────

function printSqlGuide() {
  log.section('SQL queries to run in Lovable Cloud SQL Editor');
  console.log(`${c.dim}For each query: paste into Lovable SQL Editor → Run → Export CSV.
Save each file in the SAME folder as migrate.mjs with the exact filename shown.${c.reset}
`);

  const queries = [
    {
      filename: 'auth_users.csv',
      note: 'Required for --generate-auth-sql',
      sql: `SELECT id, aud, role, email, encrypted_password,
       email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at,
       recovery_token, recovery_sent_at, email_change_token_new, email_change,
       email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
       is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
       phone_change, phone_change_token, phone_change_sent_at,
       email_change_token_current, email_change_confirm_status, banned_until,
       reauthentication_token, reauthentication_sent_at, is_sso_user,
       deleted_at, is_anonymous
FROM   auth.users;`,
    },
    { filename: 'user_roles.csv',    note: 'FK → auth.users',          sql: 'SELECT * FROM public.user_roles;' },
    { filename: 'user_profiles.csv', note: 'FK → auth.users',          sql: 'SELECT * FROM public.user_profiles;' },
    { filename: 'user_phones.csv',   note: 'FK → auth.users',          sql: 'SELECT * FROM public.user_phones;' },
    { filename: 'user_emails.csv',   note: 'FK → auth.users',          sql: 'SELECT * FROM public.user_emails;' },
    { filename: 'activity_logs.csv', note: 'Optional — historical',    sql: 'SELECT * FROM public.activity_logs;' },
    { filename: 'notifications.csv', note: 'Optional — historical',    sql: 'SELECT * FROM public.notifications;' },
  ];

  queries.forEach(({ filename, note, sql }, i) => {
    console.log(`${c.bold}${i + 1}. Save as: ${c.cyan}${filename}${c.reset}  ${c.dim}(${note})${c.reset}`);
    console.log(`${sql}\n`);
  });

  console.log(`${c.bold}After exporting all CSVs, run in order:${c.reset}`);
  console.log(`  ${c.cyan}node migrate.mjs --generate-auth-sql${c.reset}   → creates insert_auth_users.sql`);
  console.log(`  ${c.dim}Paste insert_auth_users.sql in DESTINATION SQL Editor and run${c.reset}`);
  console.log(`  ${c.cyan}node migrate.mjs --import-csvs${c.reset}         → migrates user tables\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY TABLE
// ─────────────────────────────────────────────────────────────────────────────

function printSummary(results, label) {
  log.section(`${label} — Summary`);

  const W = { t: 22, r: 7 };
  const hdr = `${'Table'.padEnd(W.t)} ${'Rows'.padStart(W.r)}  Status`;
  console.log(`\n   ${c.bold}${hdr}${c.reset}`);
  console.log(`   ${'─'.repeat(hdr.length)}`);

  let totalRows = 0, ok = 0, warn = 0, err = 0;

  for (const r of results) {
    const rows = r.fetched ?? 0;
    totalRows += rows;

    let icon, label;
    switch (r.status) {
      case 'OK':              icon = c.green;  label = '✓ OK';          ok++;   break;
      case 'PARTIAL':         icon = c.yellow; label = '⚠ PARTIAL';     warn++; break;
      case 'SKIPPED_NO_JWT':  icon = c.yellow; label = '⚠ NO JWT';         warn++; break;
      case 'SKIPPED_NO_FILE': icon = c.yellow; label = '⚠ NO CSV FILE';    warn++; break;
      case 'NOT_ON_SOURCE':   icon = c.yellow; label = '⚠ NOT ON SOURCE';  warn++; break;
      case 'FETCH_ERROR':     icon = c.red;    label = '✗ FETCH ERR';      err++;  break;
      case 'PARSE_ERROR':     icon = c.red;    label = '✗ PARSE ERR';   err++;  break;
      default:                icon = c.red;    label = '✗ ERROR';       err++;
    }

    console.log(`   ${r.table.padEnd(W.t)} ${String(rows).padStart(W.r)}  ${icon}${label}${c.reset}`);
    if (r.errors?.length) r.errors.forEach((e) => console.log(`   ${c.dim}  └─ ${e}${c.reset}`));
  }

  console.log(`   ${'─'.repeat(hdr.length)}`);
  console.log(
    `   ${c.bold}${'TOTAL'.padEnd(W.t)} ${String(totalRows).padStart(W.r)}  ` +
    `${c.green}${ok} ok${c.reset}` +
    (warn > 0 ? `  ${c.yellow}${warn} skipped${c.reset}` : '') +
    (err  > 0 ? `  ${c.red}${err} failed${c.reset}` : '') +
    `${c.reset}\n`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // Node version check
  const [major] = process.versions.node.split('.').map(Number);
  if (major < 18) {
    console.error(`Node.js 18+ is required (you have ${process.versions.node}). Upgrade and retry.`);
    process.exit(1);
  }

  const args          = process.argv.slice(2);
  const dryRun        = args.includes('--dry-run');
  const generateSql   = args.includes('--generate-auth-sql');
  const importCsvs    = args.includes('--import-csvs');
  const sqlGuide      = args.includes('--sql-guide');

  console.log(
    `\n${c.bold}${c.magenta}╔══════════════════════════════════════════╗\n` +
    `║   migrate.mjs — Supabase Data Migration  ║\n` +
    `╚══════════════════════════════════════════╝${c.reset}`,
  );
  console.log(`  Source  ${c.cyan}kswypwqxxhsbnrhnqrzm${c.reset}  (Lovable Cloud)`);
  console.log(`  Dest    ${c.green}mqriorwezhlkihjxnpdj${c.reset}  (your Supabase)`);
  if (dryRun) console.log(`  ${c.yellow}${c.bold}MODE: DRY RUN — nothing will be written${c.reset}`);

  // ── --sql-guide ─────────────────────────────────────────────────────────────
  if (sqlGuide) {
    printSqlGuide();
    return;
  }

  // ── --generate-auth-sql ─────────────────────────────────────────────────────
  if (generateSql) {
    log.section('Generating insert_auth_users.sql');
    try {
      const sql     = generateAuthUsersSQL();
      const outPath = resolve(__dirname, 'insert_auth_users.sql');
      writeFileSync(outPath, sql, 'utf8');
      log.success(`Written → insert_auth_users.sql`);
      console.log(`\n${c.bold}Next:${c.reset}`);
      console.log(`  1. Open destination Supabase project → SQL Editor`);
      console.log(`  2. Paste ${c.cyan}insert_auth_users.sql${c.reset} and click Run`);
      console.log(`  3. Then run: ${c.cyan}node migrate.mjs --import-csvs${c.reset}\n`);
    } catch (err) {
      log.error(err.message);
      process.exit(1);
    }
    return;
  }

  // ── --import-csvs (Part C) ──────────────────────────────────────────────────
  if (importCsvs) {
    log.section('Part C — CSV Import (user tables)');
    log.dim('Prerequisite: insert_auth_users.sql must have been run in destination SQL Editor first.');
    console.log();
    const results = await runCsvImport(dryRun);
    printSummary(results, 'CSV Import');
    return;
  }

  // ── Default: Part A — REST migration ────────────────────────────────────────
  log.section('Part A — REST Migration');
  console.log();
  const results = await runRestMigration(dryRun);
  printSummary(results, 'REST Migration');

  // Post-run guidance
  console.log(`${c.bold}Next steps (Part B + C):${c.reset}`);
  console.log(`  ${c.cyan}node migrate.mjs --sql-guide${c.reset}           → see SQL to export from Lovable`);
  console.log(`  ${c.cyan}node migrate.mjs --generate-auth-sql${c.reset}   → generate insert_auth_users.sql`);
  console.log(`  Run insert_auth_users.sql in destination SQL Editor`);
  console.log(`  ${c.cyan}node migrate.mjs --import-csvs${c.reset}         → import user tables\n`);
}

main().catch((err) => {
  log.error(`Fatal: ${err.message}`);
  process.exit(1);
});
