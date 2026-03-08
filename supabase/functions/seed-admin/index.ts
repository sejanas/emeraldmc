import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only callable with the service role key to prevent unauthorized super-admin creation
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth = req.headers.get('Authorization');
  if (!auth || auth !== `Bearer ${serviceKey}`) {
    return jsonRes({ error: 'Unauthorized' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Idempotency: skip if a SUPER_ADMIN already exists in user_profiles
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('role', 'super_admin')
    .maybeSingle();

  if (existing) {
    return jsonRes({ message: 'Super admin already exists' });
  }

  // Read credentials from env vars; never hardcode secrets in source
  const adminEmail = Deno.env.get('ADMIN_EMAIL') ?? 'admin@emeraldmedical.com';
  const adminPassword = Deno.env.get('ADMIN_PASSWORD') ?? 'Change-Me-123!';
  const adminName = Deno.env.get('ADMIN_NAME') ?? 'Super Admin';

  // Create auth user — Supabase hashes the password with bcrypt internally
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (authError) {
    return jsonRes({ error: authError.message }, 400);
  }

  const userId = authData.user.id;

  // Insert user_profiles with SUPER_ADMIN role and ACTIVE status
  const { error: profileError } = await supabase.from('user_profiles').insert({
    user_id: userId,
    name: adminName,
    role: 'super_admin',
    status: 'active',
  });

  if (profileError) {
    // Roll back the auth user so the operation stays idempotent
    await supabase.auth.admin.deleteUser(userId);
    return jsonRes({ error: profileError.message }, 500);
  }

  // Insert into user_roles (app_role enum) for RLS policy compatibility
  await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });

  // Record primary email in user_emails
  await supabase.from('user_emails').insert({ user_id: userId, email: adminEmail });

  return jsonRes({ message: 'Super admin created successfully', user_id: userId }, 201);
});
