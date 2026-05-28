import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content_id, content_type, episode_id } = await req.json();
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    
    

    let rawStreams: any[] = [];
    if (content_type === 'movie') {
      const { data } = await db
        .from('movie_streams')
        .select('url, status, stream_type')
        .eq('movie_id', content_id)
        .order('status', { ascending: true }); // 'active' first
      rawStreams = data || [];
    } else if (content_type === 'tv' || content_type === 'series') {
      if (episode_id) {
        const { data } = await db
          .from('episode_streams')
          .select('url, status, stream_type')
          .eq('episode_id', episode_id)
          .order('status', { ascending: true });
        rawStreams = data || [];
      }
    }

    if (!rawStreams.length) {
      return new Response(JSON.stringify({ error: 'No stream available' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auto-detect type: explicit stream_type wins; otherwise infer from URL extension.
    const detectType = (s: any): 'direct' | 'iframe' => {
      const t = (s.stream_type || '').toLowerCase();
      if (t === 'iframe' || t === 'embed') return 'iframe';
      if (t === 'direct' || t === 'mp4' || t === 'hls' || t === 'm3u8') return 'direct';
      const full = String(s.url || '').toLowerCase();
      const clean = full.split('?')[0];
      if (/\.(m3u8|mp4|mkv|webm|mov|ts|txt)$/.test(clean)) return 'direct';
      if (full.includes('.txt') || full.includes('.m3u8') || full.includes('/m3u8/')) return 'direct';
      return 'iframe';
    };

    const urls = rawStreams.map(s => s.url);
    const types = rawStreams.map(detectType);

    return new Response(JSON.stringify({
      url: urls[0],
      urls,
      type: types[0],
      types,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
