import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = getEnv('SUPABASE_URL');
    const SERVICE_ROLE = getEnv('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: `Bearer ${SERVICE_ROLE}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Keys we want to expose publicly (read-only)
    const keys = [
      'module_crm',
      'module_planner',
      'module_content',
      'module_social',
      'module_email',
      'module_messages',
      'module_analytics',
      'module_social_twitter',
      'module_social_linkedin',
      'module_social_meta',
      'module_social_scheduler',
    ];

    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value, created_at')
      .in('key', keys)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const defaults: Record<string, any> = {
      module_crm: { enabled: true },
      module_planner: { enabled: true },
      module_content: { enabled: true },
      module_social: { enabled: true },
      module_email: { enabled: true },
      module_messages: { enabled: true },
      module_analytics: { enabled: true },
      module_social_twitter: { enabled: true },
      module_social_linkedin: { enabled: true },
      module_social_meta: { enabled: true },
      module_social_scheduler: { enabled: true },
    };

    const latestByKey: Record<string, any> = {};
    for (const k of keys) latestByKey[k] = defaults[k];

    for (const row of data ?? []) {
      if (!(row.key in latestByKey)) continue;
      if (!latestByKey[row.key]) latestByKey[row.key] = row.value ?? { enabled: true };
      // Only set if not set yet (first occurrence due to DESC order)
      if (latestByKey[row.key] === defaults[row.key]) {
        latestByKey[row.key] = (row as any).value ?? defaults[row.key];
      }
    }

    return new Response(JSON.stringify({ flags: latestByKey }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e: any) {
    console.error('get-module-flags error', e);
    return new Response(JSON.stringify({ error: e?.message ?? 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
