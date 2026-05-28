import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch categories
    const { data: categories, error: catError } = await supabase
      .from('livetv_categories')
      .select('id, name')
      .order('id');

    if (catError) throw catError;

    // Fetch channels - only online ones for users
    const { data: channels, error: chError } = await supabase
      .from('livetv_channels')
      .select('id, name, slug, category, logo, stream_url, format, status')
      .eq('status', 'online')
      .order('name');

    if (chError) throw chError;

    // Build category id map
    const catMap: Record<string, number> = {};
    for (const c of categories || []) {
      catMap[c.name] = c.id;
    }

    // Transform to match frontend expected format
    const formattedChannels = (channels || []).map(ch => ({
      id: ch.slug,
      image: ch.logo || '',
      name: ch.name,
      categories: [catMap[ch.category] || 0],
      url: ch.stream_url,
      status: ch.status,
    }));

    const response = {
      categories: categories || [],
      channels: formattedChannels,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching live TV channels:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to fetch channels', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
