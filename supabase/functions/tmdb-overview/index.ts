// Edge function: busca sinopse (overview) e runtime/backdrop a partir do tmdb_id
// Pública (verify_jwt = false). Usa TMDB_API_KEY do ambiente.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TMDB_KEY = Deno.env.get('TMDB_API_KEY') || '36f12a46be05ce54f2d2f4b501cad2ea';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    let tmdbId: string | null = null;
    let type = 'movie'; // 'movie' | 'tv'

    const url = new URL(req.url);
    tmdbId = url.searchParams.get('tmdb_id');
    type = url.searchParams.get('type') || 'movie';

    if (req.method !== 'GET') {
      try {
        const text = await req.text();
        if (text && text.trim().length > 0) {
          const body = JSON.parse(text);
          if (body?.tmdb_id != null) tmdbId = String(body.tmdb_id);
          if (body?.type) type = String(body.type);
        }
      } catch (_) {
        // ignore body parse errors, fall back to query params
      }
    }
    console.log('tmdb-overview request', { method: req.method, tmdbId, type });

    if (!tmdbId || !/^\d+$/.test(tmdbId)) {
      return new Response(JSON.stringify({ error: 'tmdb_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const endpoint = type === 'tv' ? 'tv' : 'movie';
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${TMDB_KEY}&language=pt-BR`,
    );
    if (!tmdbRes.ok) {
      return new Response(JSON.stringify({ error: 'TMDB error', status: tmdbRes.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const data = await tmdbRes.json();
    if (!data.overview) {
      const fallbackRes = await fetch(
        `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${TMDB_KEY}&language=en-US`,
      );
      if (fallbackRes.ok) {
        const fallback = await fallbackRes.json();
        data.overview = fallback.overview || data.overview || '';
        data.backdrop_path = data.backdrop_path || fallback.backdrop_path;
      }
    }
    return new Response(
      JSON.stringify({
        overview: data.overview || '',
        runtime: data.runtime || (data.episode_run_time?.[0] ?? null),
        backdrop_path: data.backdrop_path,
        number_of_seasons: data.number_of_seasons,
        number_of_episodes: data.number_of_episodes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
