import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Check if admin already exists
  const { data: existing } = await supabase.auth.admin.listUsers();
  const adminExists = existing?.users?.some(u => u.email === 'admin@emeraldmedical.com');

  if (adminExists) {
    return new Response(JSON.stringify({ message: 'Admin already exists' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Create admin user
  const { data: user, error } = await supabase.auth.admin.createUser({
    email: 'admin@emeraldmedical.com',
    password: 'admin123',
    email_confirm: true,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Assign admin role
  await supabase.from('user_roles').insert({
    user_id: user.user.id,
    role: 'admin',
  });

  return new Response(JSON.stringify({ message: 'Admin created successfully' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
