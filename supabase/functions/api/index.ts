import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SB_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const adminDb = () =>
  createClient(SB_URL, SB_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errRes(message: string, status = 400) {
  return json({ error: message }, status);
}

async function getAuthUser(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const client = createClient(SB_URL, SB_ANON, {
    global: { headers: { Authorization: auth } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

async function requireAuth(req: Request) {
  const user = await getAuthUser(req);
  if (!user) throw { message: "Unauthorized", status: 401 };
  return user;
}

async function getUserProfile(userId: string) {
  const db = adminDb();
  const { data: profile } = await db
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile) return profile;

  // Fallback: check user_roles for backward compat
  const { data: roles } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roleList = (roles ?? []).map((r: any) => r.role);
  if (roleList.includes("admin")) {
    return {
      user_id: userId,
      name: "Admin",
      role: "admin",
      status: "active",
    };
  }
  return null;
}

async function requireRole(req: Request, roles: string[]) {
  const user = await requireAuth(req);
  const profile = await getUserProfile(user.id);
  if (
    !profile ||
    profile.status !== "active" ||
    !roles.includes(profile.role)
  ) {
    throw { message: "Forbidden", status: 403 };
  }
  return { user, profile };
}

async function logActivity(params: {
  event_type: string;
  user_id?: string;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  changes?: any;
  ip_address?: string;
}) {
  await adminDb()
    .from("activity_logs")
    .insert({
      ...params,
      request_id: crypto.randomUUID(),
      action_source: "admin",
    });
}

// ── AUTH ──

async function handleLogin(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) return errRes("Email and password required");

  // Rate limiting
  const ago = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await adminDb()
    .from("activity_logs")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "user.login_failed")
    .eq("entity_name", email)
    .gte("created_at", ago);
  if ((count ?? 0) >= 5)
    return errRes("Too many login attempts. Try again later.", 429);

  const client = createClient(SB_URL, SB_ANON);
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    await logActivity({ event_type: "user.login_failed", entity_name: email });
    return errRes("Invalid credentials", 401);
  }

  const profile = await getUserProfile(data.user.id);
  if (!profile) return errRes("No admin account found", 403);
  if (profile.status !== "active")
    return errRes(`Account is ${profile.status}. Contact admin.`, 403);

  await logActivity({
    event_type: "user.login",
    user_id: data.user.id,
    entity_name: email,
  });

  return json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
    profile,
  });
}

async function handleSignup(req: Request) {
  const { name, clinic_role, phones, emails, password } = await req.json();
  if (!name || !password || !emails?.length)
    return errRes("Name, email, and password required");

  const db = adminDb();
  const primaryEmail = emails[0];

  const { data: authData, error: authError } =
    await db.auth.admin.createUser({
      email: primaryEmail,
      password,
      email_confirm: true,
    });
  if (authError) return errRes(authError.message);

  const userId = authData.user.id;

  // Upsert user_profiles so that any row created by a DB trigger (which
  // would otherwise cause a silent UNIQUE violation) is overwritten with
  // the correct name/role/status supplied by this request.
  const { error: profileError } = await db.from("user_profiles").upsert(
    {
      user_id: userId,
      name,
      clinic_role: clinic_role || null,
      role: "admin",
      status: "pending",
    },
    { onConflict: "user_id" }
  );
  if (profileError) {
    // Roll back the auth user so the operation stays atomic.
    await db.auth.admin.deleteUser(userId);
    return errRes(profileError.message);
  }

  // Remove any role rows that a trigger may have inserted for this user,
  // then insert the canonical 'admin' role. This prevents duplicate rows.
  await db.from("user_roles").delete().eq("user_id", userId);
  await db.from("user_roles").insert({ user_id: userId, role: "admin" });

  if (phones?.length) {
    await db
      .from("user_phones")
      .insert(
        phones.map((p: string) => ({ user_id: userId, phone: p }))
      );
  }

  await db
    .from("user_emails")
    .insert(
      emails.map((e: string) => ({ user_id: userId, email: e }))
    );

  await logActivity({
    event_type: "user.signup",
    user_id: userId,
    entity_type: "user",
    entity_id: userId,
    entity_name: name,
  });

  return json({ message: "Account created. Awaiting approval." }, 201);
}

async function handleMe(req: Request) {
  const user = await requireAuth(req);
  const profile = await getUserProfile(user.id);
  const db = adminDb();
  const { data: phones } = await db
    .from("user_phones")
    .select("*")
    .eq("user_id", user.id);
  const { data: emails } = await db
    .from("user_emails")
    .select("*")
    .eq("user_id", user.id);

  return json({
    profile: {
      ...(profile ?? {
        user_id: user.id,
        name: user.email,
        role: "user",
        status: "active",
      }),
      email: user.email,
    },
    phones: phones ?? [],
    emails: emails ?? [],
  });
}

// ── GENERIC CRUD ──

async function crudList(table: string, url: URL, softDelete = true) {
  const db = adminDb();
  let q = db.from(table).select("*");
  if (softDelete) q = q.is("deleted_at", null);

  const orderBy = url.searchParams.get("order") || "display_order";
  q = q.order(orderBy, { ascending: true });

  const limit = url.searchParams.get("limit");
  if (limit) q = q.limit(parseInt(limit));

  if (url.searchParams.get("active") === "true" && table === "tests")
    q = q.eq("is_active", true);

  const { data, error } = await q;
  if (error) throw { message: error.message, status: 500 };
  return json(data);
}

async function crudGet(table: string, id: string) {
  const { data, error } = await adminDb()
    .from(table)
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw { message: "Not found", status: 404 };
  return json(data);
}

async function crudCreate(
  req: Request,
  table: string,
  entityType: string,
  nameField = "name"
) {
  const { user } = await requireRole(req, ["admin", "super_admin"]);
  const body = await req.json();
  const slug =
    body.slug ||
    (body[nameField] || "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const { data, error } = await adminDb()
    .from(table)
    .insert({ ...body, slug, created_by: user.id, updated_by: user.id })
    .select()
    .single();
  if (error) throw { message: error.message, status: 500 };

  await logActivity({
    event_type: `${entityType}.created`,
    user_id: user.id,
    entity_type: entityType,
    entity_id: data.id,
    entity_name: (data as Record<string, any>)[nameField],
  });
  return json(data, 201);
}

async function crudUpdate(
  req: Request,
  table: string,
  id: string,
  entityType: string,
  nameField = "name"
) {
  const { user } = await requireRole(req, ["admin", "super_admin"]);
  const body = await req.json();
  const db = adminDb();

  const { data: old } = await db
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await db
    .from(table)
    .update({
      ...body,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw { message: error.message, status: 500 };

  const changes: Record<string, any> = {};
  if (old) {
    for (const key of Object.keys(body)) {
      if (JSON.stringify(old[key]) !== JSON.stringify(body[key]))
        changes[key] = { from: old[key], to: body[key] };
    }
  }

  await logActivity({
    event_type: `${entityType}.updated`,
    user_id: user.id,
    entity_type: entityType,
    entity_id: id,
    entity_name: (data as Record<string, any>)[nameField],
    changes: Object.keys(changes).length ? changes : undefined,
  });
  return json(data);
}

async function crudDelete(
  req: Request,
  table: string,
  id: string,
  entityType: string,
  soft = true,
  nameField = "name"
) {
  const { user } = await requireRole(req, ["admin", "super_admin"]);
  const db = adminDb();
  const { data: old } = await db
    .from(table)
    .select(nameField)
    .eq("id", id)
    .single();

  if (soft) {
    const { error } = await db
      .from(table)
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", id);
    if (error) throw { message: error.message, status: 500 };
  } else {
    const { error } = await db.from(table).delete().eq("id", id);
    if (error) throw { message: error.message, status: 500 };
  }

  await logActivity({
    event_type: `${entityType}.deleted`,
    user_id: user.id,
    entity_type: entityType,
    entity_id: id,
    entity_name: (old as Record<string, any> | null)?.[nameField],
  });
  return json({ success: true });
}

// ── PACKAGES (special) ──

async function handlePackagesList(url: URL) {
  const db = adminDb();
  const { data: packages, error } = await db
    .from("packages")
    .select("*")
    .is("deleted_at", null)
    .order("display_order");
  if (error) throw { message: error.message, status: 500 };

  const { data: pt } = await db
    .from("package_tests")
    .select("package_id, test_id, tests(name)");
  const testNames: Record<string, string[]> = {};
  (pt ?? []).forEach((r: any) => {
    (testNames[r.package_id] ??= []).push(r.tests?.name ?? "");
  });

  return json({ packages, testNames });
}

async function handlePackageSave(req: Request, id?: string) {
  const { user } = await requireRole(req, ["admin", "super_admin"]);
  const body = await req.json();
  const { test_ids, ...pkgData } = body;
  const slug =
    pkgData.slug ||
    pkgData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const db = adminDb();

  let pkgId = id;
  if (id) {
    const { data: old } = await db
      .from("packages")
      .select("*")
      .eq("id", id)
      .single();
    const { error } = await db
      .from("packages")
      .update({
        ...pkgData,
        slug,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw { message: error.message, status: 500 };

    const changes: Record<string, any> = {};
    if (old) {
      for (const key of Object.keys(pkgData)) {
        if (JSON.stringify(old[key]) !== JSON.stringify(pkgData[key]))
          changes[key] = { from: old[key], to: pkgData[key] };
      }
    }
    await logActivity({
      event_type: "package.updated",
      user_id: user.id,
      entity_type: "package",
      entity_id: id,
      entity_name: pkgData.name,
      changes: Object.keys(changes).length ? changes : undefined,
    });
  } else {
    const { data, error } = await db
      .from("packages")
      .insert({
        ...pkgData,
        slug,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();
    if (error) throw { message: error.message, status: 500 };
    pkgId = data.id;
    await logActivity({
      event_type: "package.created",
      user_id: user.id,
      entity_type: "package",
      entity_id: pkgId,
      entity_name: pkgData.name,
    });
  }

  if (pkgId && test_ids !== undefined) {
    await db.from("package_tests").delete().eq("package_id", pkgId);
    if (test_ids?.length) {
      await db
        .from("package_tests")
        .insert(
          test_ids.map((t: string) => ({ package_id: pkgId, test_id: t }))
        );
    }
  }
  return json({ id: pkgId }, id ? 200 : 201);
}

// ── BOOKINGS ──

async function handleBookingCreate(req: Request) {
  const body = await req.json();
  if (
    !body.patient_name ||
    !body.phone ||
    !body.preferred_date ||
    !body.preferred_time
  )
    return errRes(
      "Required: patient_name, phone, preferred_date, preferred_time"
    );

  const { data, error } = await adminDb()
    .from("bookings")
    .insert(body)
    .select()
    .single();
  if (error) throw { message: error.message, status: 500 };

  await logActivity({
    event_type: "booking.created",
    entity_type: "booking",
    entity_id: data.id,
    entity_name: body.patient_name,
  });
  return json(data, 201);
}

async function handleBookingStatusUpdate(req: Request, id: string) {
  const { user } = await requireRole(req, ["admin", "super_admin"]);
  const { status } = await req.json();
  const valid = [
    "pending",
    "confirmed",
    "sample_collected",
    "completed",
    "cancelled",
  ];
  if (!valid.includes(status)) return errRes("Invalid status");

  const db = adminDb();
  const { data: old } = await db
    .from("bookings")
    .select("status, patient_name")
    .eq("id", id)
    .single();
  const { error } = await db
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw { message: error.message, status: 500 };

  await logActivity({
    event_type: "booking.updated",
    user_id: user.id,
    entity_type: "booking",
    entity_id: id,
    entity_name: old?.patient_name,
    changes: { status: { from: old?.status, to: status } },
  });
  return json({ success: true });
}

// ── ADMIN USER MANAGEMENT ──

async function handleListUsers(req: Request, url: URL) {
  await requireRole(req, ["super_admin"]);
  const db = adminDb();
  const statusFilter = url.searchParams.get("status");

  let q = db.from("user_profiles").select("*");
  if (statusFilter) q = q.eq("status", statusFilter);
  q = q.order("created_at", { ascending: false });

  const { data, error } = await q;
  if (error) throw { message: error.message, status: 500 };

  const userIds = (data ?? []).map((p: any) => p.user_id);
  if (!userIds.length) return json([]);

  const { data: roles } = await db
    .from("user_roles")
    .select("*")
    .in("user_id", userIds);
  const { data: emails } = await db
    .from("user_emails")
    .select("*")
    .in("user_id", userIds);
  const { data: phones } = await db
    .from("user_phones")
    .select("*")
    .in("user_id", userIds);

  const enriched = (data ?? []).map((p: any) => ({
    ...p,
    roles: (roles ?? [])
      .filter((r: any) => r.user_id === p.user_id)
      .map((r: any) => r.role),
    emails: (emails ?? []).filter((e: any) => e.user_id === p.user_id),
    phones: (phones ?? []).filter((ph: any) => ph.user_id === p.user_id),
  }));
  return json(enriched);
}

async function handleApproveUser(req: Request) {
  const { user } = await requireRole(req, ["super_admin"]);
  const { user_id } = await req.json();
  if (!user_id) return errRes("user_id required");

  const db = adminDb();
  const { data: profile } = await db
    .from("user_profiles")
    .select("name")
    .eq("user_id", user_id)
    .single();
  const { error } = await db
    .from("user_profiles")
    .update({
      status: "active",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("user_id", user_id);
  if (error) throw { message: error.message, status: 500 };

  await logActivity({
    event_type: "admin.approved",
    user_id: user.id,
    entity_type: "user",
    entity_id: user_id,
    entity_name: profile?.name,
  });
  return json({ success: true });
}

async function handleDeclineUser(req: Request) {
  const { user } = await requireRole(req, ["super_admin"]);
  const { user_id, decline_reason } = await req.json();
  if (!user_id) return errRes("user_id required");

  const db = adminDb();
  const { data: profile } = await db
    .from("user_profiles")
    .select("name")
    .eq("user_id", user_id)
    .single();

  // Try with audit columns first (requires migration 20260308120000).
  // If columns don't exist yet, fall back to status-only update so the
  // action always succeeds even before the migration is deployed.
  const fullUpdate = await db
    .from("user_profiles")
    .update({ status: "declined", declined_by: user.id, declined_at: new Date().toISOString(), decline_reason: decline_reason ?? null })
    .eq("user_id", user_id);

  if (fullUpdate.error) {
    // 42703 = undefined_column; fall back to bare status update
    if (fullUpdate.error.code === "42703") {
      const { error: fallbackError } = await db
        .from("user_profiles")
        .update({ status: "declined" })
        .eq("user_id", user_id);
      if (fallbackError) throw { message: fallbackError.message, status: 500 };
    } else {
      throw { message: fullUpdate.error.message, status: 500 };
    }
  }

  await logActivity({
    event_type: "admin.declined",
    user_id: user.id,
    entity_type: "user",
    entity_id: user_id,
    entity_name: profile?.name,
  });
  return json({ success: true });
}

async function handleRevokeUser(req: Request) {
  const { user } = await requireRole(req, ["super_admin"]);
  const { user_id } = await req.json();
  if (!user_id) return errRes("user_id required");

  const db = adminDb();
  const { data: profile } = await db
    .from("user_profiles")
    .select("name")
    .eq("user_id", user_id)
    .single();
  const { error } = await db
    .from("user_profiles")
    .update({ status: "revoked" })
    .eq("user_id", user_id);
  if (error) throw { message: error.message, status: 500 };

  await logActivity({
    event_type: "admin.revoked",
    user_id: user.id,
    entity_type: "user",
    entity_id: user_id,
    entity_name: profile?.name,
  });
  return json({ success: true });
}

async function handlePromoteUser(req: Request) {
  const { user } = await requireRole(req, ["super_admin"]);
  const { user_id } = await req.json();
  if (!user_id) return errRes("user_id required");

  const db = adminDb();
  const { data: profile } = await db
    .from("user_profiles")
    .select("name")
    .eq("user_id", user_id)
    .single();

  await db
    .from("user_profiles")
    .update({ role: "super_admin" })
    .eq("user_id", user_id);

  await logActivity({
    event_type: "admin.promoted",
    user_id: user.id,
    entity_type: "user",
    entity_id: user_id,
    entity_name: profile?.name,
  });
  return json({ success: true });
}

// ── ACTIVITY LOGS ──

async function handleActivityLogs(req: Request, url: URL) {
  const { user, profile } = await requireRole(req, [
    "admin",
    "super_admin",
  ]);
  const db = adminDb();
  let q = db
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  // Super admins can filter by a specific user_id; regular admins see only own logs
  const filterUserId = url.searchParams.get("user_id");
  if (profile.role === "super_admin" && filterUserId) {
    q = q.eq("user_id", filterUserId);
  } else if (profile.role !== "super_admin") {
    q = q.eq("user_id", user.id);
  }

  const entityType = url.searchParams.get("entity_type");
  if (entityType) q = q.eq("entity_type", entityType);

  const eventType = url.searchParams.get("event_type");
  if (eventType) q = q.eq("event_type", eventType);

  const { data, error } = await q;
  if (error) throw { message: error.message, status: 500 };
  return json(data);
}

async function handleUpdateProfile(req: Request) {
  const user = await requireAuth(req);
  const { name, clinic_role, phones, emails } = await req.json();

  if (!name?.trim()) return errRes("Name is required");

  const db = adminDb();
  const { error: profileError } = await db
    .from("user_profiles")
    .update({ name: name.trim(), clinic_role: clinic_role?.trim() || null })
    .eq("user_id", user.id);
  if (profileError) throw { message: profileError.message, status: 500 };

  if (Array.isArray(phones)) {
    await db.from("user_phones").delete().eq("user_id", user.id);
    const validPhones = phones.filter((p: string) => p?.trim());
    if (validPhones.length) {
      await db.from("user_phones").insert(validPhones.map((p: string) => ({ user_id: user.id, phone: p.trim() })));
    }
  }

  if (Array.isArray(emails)) {
    const validEmails = emails.filter((e: string) => e?.trim());
    if (!validEmails.length) return errRes("At least one email is required");
    await db.from("user_emails").delete().eq("user_id", user.id);
    await db.from("user_emails").insert(validEmails.map((e: string) => ({ user_id: user.id, email: e.trim() })));
  }

  await logActivity({
    event_type: "user.profile_updated",
    user_id: user.id,
    entity_type: "user",
    entity_id: user.id,
    entity_name: name.trim(),
  });
  return json({ success: true });
}

async function handleResubmit(req: Request) {
  const user = await requireAuth(req);
  const db = adminDb();
  const { data: profile } = await db
    .from("user_profiles")
    .select("status, declined_at")
    .eq("user_id", user.id)
    .single();

  if (!profile) return errRes("Profile not found", 404);
  if (profile.status !== "declined") return errRes("Account is not in declined state");

  // Enforce 5-minute cooling period from declined_at (if column exists)
  if (profile.declined_at) {
    const declinedAt = new Date(profile.declined_at).getTime();
    const cooldownMs = 5 * 60 * 1000;
    if (Date.now() - declinedAt < cooldownMs) {
      const remainingSec = Math.ceil((declinedAt + cooldownMs - Date.now()) / 1000);
      return errRes(`Please wait ${remainingSec} seconds before resubmitting`, 429);
    }
  }

  const { error } = await db
    .from("user_profiles")
    .update({ status: "pending" })
    .eq("user_id", user.id);
  if (error) throw { message: error.message, status: 500 };

  await logActivity({
    event_type: "user.resubmitted",
    user_id: user.id,
    entity_type: "user",
    entity_id: user.id,
  });
  return json({ success: true });
}

// ── DASHBOARD ──

async function handleDashboardCounts(req: Request) {
  await requireRole(req, ["admin", "super_admin"]);
  const db = adminDb();
  const [cats, tests, pkgs, docs, gal, vis, bk] = await Promise.all([
    db.from("test_categories").select("id", { count: "exact", head: true }),
    db
      .from("tests")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    db
      .from("packages")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    db
      .from("doctors")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    db
      .from("gallery")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    db.from("visitors").select("id", { count: "exact", head: true }),
    db.from("bookings").select("id", { count: "exact", head: true }),
  ]);
  return json({
    categories: cats.count ?? 0,
    tests: tests.count ?? 0,
    packages: pkgs.count ?? 0,
    doctors: docs.count ?? 0,
    gallery: gal.count ?? 0,
    visitors: vis.count ?? 0,
    bookings: bk.count ?? 0,
  });
}

// ── MAIN ROUTER ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const pathMatch = url.pathname.match(/\/api(\/.*)/);
    const path = pathMatch ? pathMatch[1] : url.pathname;
    const method = req.method;
    const segments = path.split("/").filter(Boolean);
    const resource = segments[0];
    const id = segments[1];
    const sub = segments[2];

    // Auth
    if (resource === "auth") {
      if (id === "login" && method === "POST") return await handleLogin(req);
      if (id === "signup" && method === "POST") return await handleSignup(req);
      if (id === "me" && method === "GET") return await handleMe(req);
      if (id === "profile" && method === "PUT") return await handleUpdateProfile(req);
      if (id === "resubmit" && method === "POST") return await handleResubmit(req);
    }

    // Dashboard
    if (resource === "dashboard" && id === "counts" && method === "GET")
      return await handleDashboardCounts(req);

    // Activity logs
    if (resource === "activity-logs" && method === "GET")
      return await handleActivityLogs(req, url);

    // Admin user management
    if (resource === "admin") {
      if (id === "users" && method === "GET")
        return await handleListUsers(req, url);
      if (id === "pending-users" && method === "GET") {
        url.searchParams.set("status", "pending");
        return await handleListUsers(req, url);
      }
      if (id === "approve-user" && method === "POST")
        return await handleApproveUser(req);
      if (id === "decline-user" && method === "POST")
        return await handleDeclineUser(req);
      if (id === "revoke-user" && method === "POST")
        return await handleRevokeUser(req);
      if (id === "promote-user" && method === "POST")
        return await handlePromoteUser(req);
    }

    // Packages (special)
    if (resource === "packages") {
      if (method === "GET" && !id) return await handlePackagesList(url);
      if (method === "GET" && id) return await crudGet("packages", id);
      if (method === "POST") return await handlePackageSave(req);
      if (method === "PUT" && id) return await handlePackageSave(req, id);
      if (method === "DELETE" && id)
        return await crudDelete(req, "packages", id, "package");
    }

    // Bookings
    if (resource === "bookings") {
      if (method === "POST" && !id) return await handleBookingCreate(req);
      if (method === "GET" && !id) {
        await requireRole(req, ["admin", "super_admin"]);
        const db = adminDb();
        const { data } = await db
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false });
        return json(data);
      }
      if (method === "GET" && id) {
        await requireRole(req, ["admin", "super_admin"]);
        return await crudGet("bookings", id);
      }
      if (method === "PUT" && id && sub === "status")
        return await handleBookingStatusUpdate(req, id);
    }

    // Generic CRUD
    const crudConfig: Record<
      string,
      {
        table: string;
        entity: string;
        softDelete: boolean;
        nameField: string;
      }
    > = {
      doctors: {
        table: "doctors",
        entity: "doctor",
        softDelete: true,
        nameField: "name",
      },
      tests: {
        table: "tests",
        entity: "test",
        softDelete: true,
        nameField: "name",
      },
      categories: {
        table: "test_categories",
        entity: "category",
        softDelete: false,
        nameField: "name",
      },
      gallery: {
        table: "gallery",
        entity: "gallery",
        softDelete: true,
        nameField: "title",
      },
    };

    if (crudConfig[resource]) {
      const cfg = crudConfig[resource];
      if (method === "GET" && !id)
        return await crudList(cfg.table, url, cfg.softDelete);
      if (method === "GET" && id) return await crudGet(cfg.table, id);
      if (method === "POST")
        return await crudCreate(req, cfg.table, cfg.entity, cfg.nameField);
      if (method === "PUT" && id)
        return await crudUpdate(
          req,
          cfg.table,
          id,
          cfg.entity,
          cfg.nameField
        );
      if (method === "DELETE" && id)
        return await crudDelete(
          req,
          cfg.table,
          id,
          cfg.entity,
          cfg.softDelete,
          cfg.nameField
        );
    }

    return errRes("Not found", 404);
  } catch (e: any) {
    return json({ error: e.message ?? "Internal error" }, e.status ?? 500);
  }
});
