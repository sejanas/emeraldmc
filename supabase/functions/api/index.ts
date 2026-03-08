// API Edge Function — v3
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

const BOOKING_ROLES = ["admin", "super_admin", "booking_manager"];
const ADMIN_ROLES = ["admin", "super_admin"];

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

// Helper to notify users by role
async function notifyByRole(
  roles: string[],
  notification: { title: string; message?: string; type?: string; entity_type?: string; entity_id?: string }
) {
  const db = adminDb();
  // Get all user_ids with matching roles from user_profiles
  const { data: profiles } = await db
    .from("user_profiles")
    .select("user_id")
    .in("role", roles)
    .eq("status", "active");

  if (!profiles?.length) return;

  const rows = profiles.map((p: any) => ({
    user_id: p.user_id,
    title: notification.title,
    message: notification.message || null,
    type: notification.type || "info",
    entity_type: notification.entity_type || null,
    entity_id: notification.entity_id || null,
  }));

  await db.from("notifications").insert(rows);
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
  if (profile.status === "revoked")
    return errRes("Account has been revoked. Contact admin.", 403);

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

  const { error: profileError } = await db.from("user_profiles").upsert(
    {
      user_id: userId,
      name,
      clinic_role: clinic_role || null,
      role: "booking_manager",
      status: "pending",
    },
    { onConflict: "user_id" }
  );
  if (profileError) {
    await db.auth.admin.deleteUser(userId);
    return errRes(profileError.message);
  }

  await db.from("user_roles").delete().eq("user_id", userId);
  await db.from("user_roles").insert({ user_id: userId, role: "booking_manager" });

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

  // Notify super_admins about new signup
  await notifyByRole(["super_admin"], {
    title: "New User Signup",
    message: `${name} (${clinic_role || "No role"}) has signed up and is awaiting approval`,
    type: "user_signup",
    entity_type: "user",
    entity_id: userId,
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

  if (url.searchParams.get("active") === "true" && (table === "tests" || table === "faqs"))
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
  const { user } = await requireRole(req, ADMIN_ROLES);
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
  const { user } = await requireRole(req, ADMIN_ROLES);
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
  const { user } = await requireRole(req, ADMIN_ROLES);
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
  const { user } = await requireRole(req, ADMIN_ROLES);
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

const STATUS_TIMESTAMP_MAP: Record<string, string> = {
  confirmed: "confirmed_at",
  sample_collected: "sample_collected_at",
  completed: "completed_at",
  cancelled: "cancelled_at",
};

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

  const db = adminDb();
  const { data, error } = await db
    .from("bookings")
    .insert(body)
    .select()
    .single();
  if (error) throw { message: error.message, status: 500 };

  // Auto-insert initial timeline entry
  await db.from("booking_updates").insert({
    booking_id: data.id,
    update_type: "status_change",
    new_value: "pending",
    note: "Booking created",
  });

  await logActivity({
    event_type: "booking.created",
    entity_type: "booking",
    entity_id: data.id,
    entity_name: body.patient_name,
  });

  // Notify all staff about new booking
  await notifyByRole(["admin", "super_admin", "booking_manager"], {
    title: "New Booking",
    message: `${body.patient_name} booked for ${body.preferred_date} at ${body.preferred_time}`,
    type: "booking",
    entity_type: "booking",
    entity_id: data.id,
  });

  return json(data, 201);
}

async function handleBookingStatusUpdate(req: Request, id: string) {
  const { user } = await requireRole(req, BOOKING_ROLES);
  const { status, reason } = await req.json();
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

  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };
  const tsCol = STATUS_TIMESTAMP_MAP[status];
  if (tsCol) updateData[tsCol] = new Date().toISOString();

  const { error } = await db
    .from("bookings")
    .update(updateData)
    .eq("id", id);
  if (error) throw { message: error.message, status: 500 };

  // Insert timeline entry
  await db.from("booking_updates").insert({
    booking_id: id,
    update_type: "status_change",
    old_value: old?.status,
    new_value: status,
    note: reason || null,
    created_by: user.id,
  });

  await logActivity({
    event_type: "booking.updated",
    user_id: user.id,
    entity_type: "booking",
    entity_id: id,
    entity_name: old?.patient_name,
    changes: { status: { from: old?.status, to: status }, reason: reason || null },
  });
  return json({ success: true });
}

async function handleBulkStatusUpdate(req: Request) {
  const { user } = await requireRole(req, BOOKING_ROLES);
  const { ids, status } = await req.json();
  if (!Array.isArray(ids) || !ids.length) return errRes("ids array required");
  const valid = ["pending", "confirmed", "sample_collected", "completed", "cancelled"];
  if (!valid.includes(status)) return errRes("Invalid status");

  const db = adminDb();
  let updated = 0;

  for (const id of ids) {
    const { data: old } = await db.from("bookings").select("status, patient_name").eq("id", id).single();
    if (!old || old.status === status) continue;

    const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() };
    const tsCol = STATUS_TIMESTAMP_MAP[status];
    if (tsCol) updateData[tsCol] = new Date().toISOString();

    await db.from("bookings").update(updateData).eq("id", id);
    await db.from("booking_updates").insert({
      booking_id: id,
      update_type: "status_change",
      old_value: old.status,
      new_value: status,
      created_by: user.id,
    });
    updated++;
  }

  await logActivity({
    event_type: "booking.bulk_status_update",
    user_id: user.id,
    entity_type: "booking",
    changes: { ids, status, updated },
  });
  return json({ updated });
}

async function handleBookingUpdates(req: Request, id: string) {
  const method = req.method;

  if (method === "GET") {
    await requireRole(req, BOOKING_ROLES);
    const db = adminDb();
    const { data, error } = await db
      .from("booking_updates")
      .select("*")
      .eq("booking_id", id)
      .order("created_at", { ascending: true });
    if (error) throw { message: error.message, status: 500 };

    // Enrich with actor names
    const userIds = [...new Set((data ?? []).map((u: any) => u.created_by).filter(Boolean))];
    let profileMap: Record<string, string> = {};
    if (userIds.length) {
      const { data: profiles } = await db
        .from("user_profiles")
        .select("user_id, name")
        .in("user_id", userIds);
      (profiles ?? []).forEach((p: any) => { profileMap[p.user_id] = p.name; });
    }

    const enriched = (data ?? []).map((u: any) => ({
      ...u,
      actor_name: u.created_by ? (profileMap[u.created_by] || null) : null,
    }));
    return json(enriched);
  }

  if (method === "POST") {
    const { user } = await requireRole(req, BOOKING_ROLES);
    const body = await req.json();
    const { update_type, note, status, preferred_date, preferred_time, patient_id, extra_phones } = body;

    if (!update_type) return errRes("update_type required");

    const db = adminDb();
    const { data: booking } = await db.from("bookings").select("*").eq("id", id).single();
    if (!booking) return errRes("Booking not found", 404);

    // Handle different update types
    if (update_type === "status_change" && status) {
      const valid = ["pending", "confirmed", "sample_collected", "completed", "cancelled"];
      if (!valid.includes(status)) return errRes("Invalid status");
      const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() };
      const tsCol = STATUS_TIMESTAMP_MAP[status];
      if (tsCol) updateData[tsCol] = new Date().toISOString();
      await db.from("bookings").update(updateData).eq("id", id);
      await db.from("booking_updates").insert({
        booking_id: id, update_type: "status_change",
        old_value: booking.status, new_value: status, note, created_by: user.id,
      });
    } else if (update_type === "date_change" && (preferred_date || preferred_time)) {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      const oldParts: string[] = [];
      const newParts: string[] = [];
      if (preferred_date) {
        oldParts.push(booking.preferred_date);
        newParts.push(preferred_date);
        updateData.preferred_date = preferred_date;
      }
      if (preferred_time) {
        oldParts.push(booking.preferred_time);
        newParts.push(preferred_time);
        updateData.preferred_time = preferred_time;
      }
      await db.from("bookings").update(updateData).eq("id", id);
      await db.from("booking_updates").insert({
        booking_id: id, update_type: "date_change",
        old_value: oldParts.join(" "), new_value: newParts.join(" "),
        note, created_by: user.id,
      });
    } else if (update_type === "info_update") {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      const changes: string[] = [];
      if (patient_id !== undefined) {
        updateData.patient_id = patient_id;
        changes.push(`patient_id: ${patient_id}`);
      }
      if (extra_phones !== undefined) {
        updateData.extra_phones = extra_phones;
        changes.push(`extra_phones: ${JSON.stringify(extra_phones)}`);
      }
      if (body.notes !== undefined) {
        updateData.notes = body.notes;
        changes.push(`notes updated`);
      }
      await db.from("bookings").update(updateData).eq("id", id);
      await db.from("booking_updates").insert({
        booking_id: id, update_type: "info_update",
        new_value: changes.join("; "), note, created_by: user.id,
      });
    } else if (update_type === "follow_up_call" || update_type === "note") {
      await db.from("booking_updates").insert({
        booking_id: id, update_type, note, created_by: user.id,
      });
      // Touch updated_at so overdue detection works
      await db.from("bookings").update({ updated_at: new Date().toISOString() }).eq("id", id);
    } else {
      const customTitle = body.custom_title || null;
      await db.from("booking_updates").insert({
        booking_id: id, update_type: update_type || "other", note,
        new_value: customTitle, created_by: user.id,
      });
      await db.from("bookings").update({ updated_at: new Date().toISOString() }).eq("id", id);
    }

    await logActivity({
      event_type: "booking.timeline_update",
      user_id: user.id,
      entity_type: "booking",
      entity_id: id,
      entity_name: booking.patient_name,
      changes: { update_type, note },
    });
    return json({ success: true });
  }

  return errRes("Method not allowed", 405);
}

async function handleBookingReschedule(req: Request, id: string) {
  const { user } = await requireRole(req, BOOKING_ROLES);
  const { preferred_date, preferred_time, reason } = await req.json();
  if (!preferred_date && !preferred_time) return errRes("preferred_date or preferred_time required");

  const db = adminDb();
  const { data: booking } = await db.from("bookings").select("preferred_date, preferred_time, patient_name").eq("id", id).single();
  if (!booking) return errRes("Booking not found", 404);

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  if (preferred_date) updateData.preferred_date = preferred_date;
  if (preferred_time) updateData.preferred_time = preferred_time;

  await db.from("bookings").update(updateData).eq("id", id);
  await db.from("booking_updates").insert({
    booking_id: id,
    update_type: "date_change",
    old_value: `${booking.preferred_date} ${booking.preferred_time}`,
    new_value: `${preferred_date || booking.preferred_date} ${preferred_time || booking.preferred_time}`,
    note: reason || null,
    created_by: user.id,
  });

  await logActivity({
    event_type: "booking.rescheduled",
    user_id: user.id,
    entity_type: "booking",
    entity_id: id,
    entity_name: booking.patient_name,
    changes: { reason: reason || null },
  });
  return json({ success: true });
}

async function handleBookingInfoUpdate(req: Request, id: string) {
  const { user } = await requireRole(req, BOOKING_ROLES);
  const { patient_id, extra_phones, notes } = await req.json();

  const db = adminDb();
  const { data: booking } = await db.from("bookings").select("patient_name").eq("id", id).single();
  if (!booking) return errRes("Booking not found", 404);

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  const changes: string[] = [];
  if (patient_id !== undefined) { updateData.patient_id = patient_id; changes.push(`patient_id: ${patient_id}`); }
  if (extra_phones !== undefined) { updateData.extra_phones = extra_phones; changes.push(`extra_phones updated`); }
  if (notes !== undefined) { updateData.notes = notes; changes.push(`notes updated`); }

  await db.from("bookings").update(updateData).eq("id", id);
  await db.from("booking_updates").insert({
    booking_id: id,
    update_type: "info_update",
    new_value: changes.join("; "),
    created_by: user.id,
  });

  await logActivity({
    event_type: "booking.info_updated",
    user_id: user.id,
    entity_type: "booking",
    entity_id: id,
    entity_name: booking.patient_name,
  });
  return json({ success: true });
}

async function handlePatientHistory(req: Request, url: URL) {
  await requireRole(req, BOOKING_ROLES);
  const phone = url.searchParams.get("phone");
  const name = url.searchParams.get("name");
  const patientId = url.searchParams.get("patient_id");

  if (!phone && !patientId) return errRes("phone or patient_id required");

  const db = adminDb();
  let q = db.from("bookings").select("*").order("created_at", { ascending: false }).limit(50);

  if (patientId) {
    q = q.eq("patient_id", patientId);
  } else if (phone) {
    // Search by primary phone or in extra_phones
    q = q.or(`phone.eq.${phone},extra_phones.cs.{${phone}}`);
    if (name) q = q.ilike("patient_name", `%${name}%`);
  }

  const { data, error } = await q;
  if (error) throw { message: error.message, status: 500 };
  return json(data);
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

  const fullUpdate = await db
    .from("user_profiles")
    .update({ status: "declined", declined_by: user.id, declined_at: new Date().toISOString(), decline_reason: decline_reason ?? null })
    .eq("user_id", user_id);

  if (fullUpdate.error) {
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
  const { user_id, target_role } = await req.json();
  if (!user_id) return errRes("user_id required");

  const validRoles = ["booking_manager", "admin", "super_admin"];
  const role = target_role || "super_admin";
  if (!validRoles.includes(role)) return errRes("Invalid target_role");

  const db = adminDb();
  const { data: profile } = await db
    .from("user_profiles")
    .select("name, role")
    .eq("user_id", user_id)
    .single();

  await db
    .from("user_profiles")
    .update({ role })
    .eq("user_id", user_id);

  // Update user_roles table too
  await db.from("user_roles").delete().eq("user_id", user_id);
  // Map to app_role enum: booking_manager, admin (super_admin maps to admin in enum)
  const enumRole = role === "super_admin" ? "admin" : role;
  await db.from("user_roles").insert({ user_id, role: enumRole });

  await logActivity({
    event_type: "admin.role_changed",
    user_id: user.id,
    entity_type: "user",
    entity_id: user_id,
    entity_name: profile?.name,
    changes: { role: { from: profile?.role, to: role } },
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

  const userIds = [...new Set((data ?? []).map((l: any) => l.user_id).filter(Boolean))];
  let profileMap: Record<string, string> = {};
  if (userIds.length) {
    const { data: profiles } = await db
      .from("user_profiles")
      .select("user_id, name")
      .in("user_id", userIds);
    (profiles ?? []).forEach((p: any) => { profileMap[p.user_id] = p.name; });
  }

  const enriched = (data ?? []).map((log: any) => ({
    ...log,
    actor_name: log.user_id ? (profileMap[log.user_id] || null) : null,
  }));
  return json(enriched);
}

async function handleUpdateProfile(req: Request) {
  const user = await requireAuth(req);
  const { name, clinic_role, phones, emails, avatar_url } = await req.json();

  if (!name?.trim()) return errRes("Name is required");

  const db = adminDb();
  const updateData: Record<string, unknown> = {
    name: name.trim(),
    clinic_role: clinic_role?.trim() || null,
  };
  if (typeof avatar_url === "string") {
    updateData.avatar_url = avatar_url || null;
  }

  const { error: profileError } = await db
    .from("user_profiles")
    .update(updateData)
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
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const validEmails = emails.filter((e: string) => e?.trim());
    const invalidEmail = validEmails.find((e: string) => !emailRegex.test(e.trim()));
    if (invalidEmail) return errRes(`Invalid email: ${invalidEmail}`);

    const primaryEmail = user.email?.toLowerCase();
    const allEmails = new Set(validEmails.map((e: string) => e.trim().toLowerCase()));
    if (primaryEmail) allEmails.add(primaryEmail);

    await db.from("user_emails").delete().eq("user_id", user.id);
    await db.from("user_emails").insert(
      Array.from(allEmails).map((e: string) => ({ user_id: user.id, email: e }))
    );
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
  await requireRole(req, BOOKING_ROLES);
  const db = adminDb();
  const todayStart = new Date().toISOString().slice(0, 10) + "T00:00:00Z";
  const [cats, tests, pkgs, docs, gal, vis, bk, fq, visToday] = await Promise.all([
    db.from("test_categories").select("id", { count: "exact", head: true }),
    db.from("tests").select("id", { count: "exact", head: true }).is("deleted_at", null),
    db.from("packages").select("id", { count: "exact", head: true }).is("deleted_at", null),
    db.from("doctors").select("id", { count: "exact", head: true }).is("deleted_at", null),
    db.from("gallery").select("id", { count: "exact", head: true }).is("deleted_at", null),
    db.from("visitors").select("id", { count: "exact", head: true }),
    db.from("bookings").select("id", { count: "exact", head: true }),
    db.from("faqs").select("id", { count: "exact", head: true }).is("deleted_at", null),
    db.from("visitors").select("id", { count: "exact", head: true }).gte("visited_at", todayStart),
  ]);

  const { data: locData } = await db.from("visitors").select("country, region, city").not("country", "is", null).limit(1000);
  const locAgg: Record<string, number> = {};
  (locData ?? []).forEach((r: any) => {
    const key = `${r.country || "Unknown"}||${r.region || ""}||${r.city || ""}`;
    locAgg[key] = (locAgg[key] || 0) + 1;
  });
  const topLocations = Object.entries(locAgg)
    .map(([key, count]) => {
      const [country, region, city] = key.split("||");
      return { country, region, city, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return json({
    categories: cats.count ?? 0,
    tests: tests.count ?? 0,
    packages: pkgs.count ?? 0,
    doctors: docs.count ?? 0,
    gallery: gal.count ?? 0,
    visitors: vis.count ?? 0,
    bookings: bk.count ?? 0,
    faqs: fq.count ?? 0,
    visitors_today: visToday.count ?? 0,
    top_locations: topLocations,
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
      // Patient history
      if (method === "GET" && id === "patient-history")
        return await handlePatientHistory(req, url);
      // Bulk status update (before individual ID routes)
      if (method === "PUT" && id === "bulk-status")
        return await handleBulkStatusUpdate(req);
      if (method === "GET" && !id) {
        await requireRole(req, BOOKING_ROLES);
        const db = adminDb();
        const { data } = await db
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false });
        return json(data);
      }
      if (method === "GET" && id && sub === "updates")
        return await handleBookingUpdates(req, id);
      if (method === "GET" && id) {
        await requireRole(req, BOOKING_ROLES);
        return await crudGet("bookings", id);
      }
      if (method === "PUT" && id && sub === "status")
        return await handleBookingStatusUpdate(req, id);
      if (method === "PUT" && id && sub === "reschedule")
        return await handleBookingReschedule(req, id);
      if (method === "PUT" && id && sub === "info")
        return await handleBookingInfoUpdate(req, id);
      if (method === "POST" && id && sub === "updates")
        return await handleBookingUpdates(req, id);
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
      faqs: {
        table: "faqs",
        entity: "faq",
        softDelete: true,
        nameField: "question",
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

    // Visitors
    if (resource === "visitors") {
      if (method === "POST" && id === "track") {
        const body = await req.json().catch(() => ({}));
        const page = body.page || "/";
        const ua = body.user_agent || "unknown";

        const encoder = new TextEncoder();
        const dateStr = new Date().toISOString().slice(0, 10);
        const raw = `${ua}|${page}|${dateStr}`;
        const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(raw));
        const ipHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);

        const db = adminDb();
        const todayStart = `${dateStr}T00:00:00Z`;
        const { count: existing } = await db
          .from("visitors")
          .select("id", { count: "exact", head: true })
          .eq("ip_hash", ipHash)
          .gte("visited_at", todayStart);

        if ((existing ?? 0) === 0) {
          let city: string | null = null;
          let region: string | null = null;
          let country: string | null = null;
          try {
            const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "";
            const ip = forwarded.split(",")[0].trim();
            if (ip && ip !== "127.0.0.1" && ip !== "::1") {
              const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(3000) });
              if (geoRes.ok) {
                const geo = await geoRes.json();
                city = geo.city || null;
                region = geo.region || null;
                country = geo.country_name || null;
              }
            }
          } catch { /* ignore geo failures */ }

          await db.from("visitors").insert({
            page,
            referrer: body.referrer || null,
            user_agent: ua,
            ip_hash: ipHash,
            city,
            region,
            country,
          });
        }
        return json({ success: true });
      }
      if (method === "GET" && id === "count") {
        const { count } = await adminDb()
          .from("visitors")
          .select("id", { count: "exact", head: true });
        return json({ count: count ?? 0 });
      }

      if (method === "GET" && id === "analytics") {
        await requireRole(req, ADMIN_ROLES);
        const db = adminDb();
        let q = db.from("visitors").select("*").order("visited_at", { ascending: false });
        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");
        if (from) q = q.gte("visited_at", from);
        if (to) q = q.lte("visited_at", to);
        const pageFilter = url.searchParams.get("page");
        if (pageFilter) q = q.eq("page", pageFilter);
        const countryFilter = url.searchParams.get("country");
        if (countryFilter) q = q.eq("country", countryFilter);
        const regionFilter = url.searchParams.get("region");
        if (regionFilter) q = q.eq("region", regionFilter);
        const cityFilter = url.searchParams.get("city");
        if (cityFilter) q = q.eq("city", cityFilter);
        const limit = parseInt(url.searchParams.get("limit") || "100");
        const offset = parseInt(url.searchParams.get("offset") || "0");
        q = q.range(offset, offset + limit - 1);
        const { data, error, count } = await q;
        if (error) throw { message: error.message, status: 500 };
        return json({ data: data ?? [], total: count });
      }

      if (method === "GET" && id === "locations") {
        await requireRole(req, ADMIN_ROLES);
        const db = adminDb();
        let q = db.from("visitors").select("country, region, city, visited_at");
        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");
        if (from) q = q.gte("visited_at", from);
        if (to) q = q.lte("visited_at", to);
        const countryFilter = url.searchParams.get("country");
        if (countryFilter) q = q.eq("country", countryFilter);
        const { data, error } = await q;
        if (error) throw { message: error.message, status: 500 };

        const agg: Record<string, number> = {};
        (data ?? []).forEach((r: any) => {
          const key = `${r.country || "Unknown"}||${r.region || "Unknown"}||${r.city || "Unknown"}`;
          agg[key] = (agg[key] || 0) + 1;
        });
        const locations = Object.entries(agg)
          .map(([key, count]) => {
            const [country, region, city] = key.split("||");
            return { country, region, city, count };
          })
          .sort((a, b) => b.count - a.count);
        return json(locations);
      }

      if (method === "GET" && id === "daily") {
        await requireRole(req, ADMIN_ROLES);
        const db = adminDb();
        let q = db.from("visitors").select("visited_at, country, page");
        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");
        if (from) q = q.gte("visited_at", from);
        if (to) q = q.lte("visited_at", to);
        const countryFilter = url.searchParams.get("country");
        if (countryFilter) q = q.eq("country", countryFilter);
        const pageFilter = url.searchParams.get("page");
        if (pageFilter) q = q.eq("page", pageFilter);
        const { data, error } = await q;
        if (error) throw { message: error.message, status: 500 };

        const daily: Record<string, number> = {};
        (data ?? []).forEach((r: any) => {
          const day = (r.visited_at || "").slice(0, 10);
          if (day) daily[day] = (daily[day] || 0) + 1;
        });
        const result = Object.entries(daily)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));
        return json(result);
      }

      if (method === "GET" && id === "filters") {
        await requireRole(req, ADMIN_ROLES);
        const db = adminDb();
        const { data } = await db.from("visitors").select("country, region, city, page");
        const countries = new Set<string>();
        const regions = new Set<string>();
        const cities = new Set<string>();
        const pages = new Set<string>();
        (data ?? []).forEach((r: any) => {
          if (r.country) countries.add(r.country);
          if (r.region) regions.add(r.region);
          if (r.city) cities.add(r.city);
          if (r.page) pages.add(r.page);
        });
        return json({
          countries: [...countries].sort(),
          regions: [...regions].sort(),
          cities: [...cities].sort(),
          pages: [...pages].sort(),
        });
      }
    }

    // Upload (image)
    if (resource === "upload" && method === "POST") {
      const user = await requireAuth(req);
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const folder = (formData.get("folder") as string) || "uploads";
      if (!file) return errRes("No file provided");

      const ext = file.name?.split(".").pop() || "webp";
      const name = `${folder}/${Date.now()}.${ext}`;
      const db = adminDb();
      const { error } = await db.storage.from("images").upload(name, file, {
        contentType: file.type || "image/webp",
      });
      if (error) throw { message: error.message, status: 500 };
      const { data } = db.storage.from("images").getPublicUrl(name);
      return json({ url: data.publicUrl });
    }

    return errRes("Not found", 404);
  } catch (e: any) {
    return json({ error: e.message ?? "Internal error" }, e.status ?? 500);
  }
});
