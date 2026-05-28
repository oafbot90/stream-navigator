import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { type, items } = await req.json();

    let inserted = 0, skipped = 0;

    if (type === 'movies') {
      // Batch lookup all tmdb_ids at once
      const tmdbIds = items.map((i: any) => i.tmdb_id).filter(Boolean);
      const movieMap = new Map<number, string>();

      for (let i = 0; i < tmdbIds.length; i += 500) {
        const { data } = await db.from('movies_catalog').select('id, tmdb_id').in('tmdb_id', tmdbIds.slice(i, i + 500));
        for (const r of data || []) movieMap.set(r.tmdb_id, r.id);
      }

      // Collect all movie_ids that exist
      const movieIds = [...movieMap.values()];
      const existingUrls = new Map<string, Set<string>>();

      for (let i = 0; i < movieIds.length; i += 500) {
        const { data } = await db.from('movie_streams').select('movie_id, url').in('movie_id', movieIds.slice(i, i + 500));
        for (const r of data || []) {
          if (!existingUrls.has(r.movie_id)) existingUrls.set(r.movie_id, new Set());
          existingUrls.get(r.movie_id)!.add(r.url);
        }
      }

      // Build all new streams
      const newStreams: any[] = [];
      for (const item of items) {
        const movieId = movieMap.get(item.tmdb_id);
        if (!movieId) { skipped++; continue; }
        const existing = existingUrls.get(movieId) || new Set();
        for (const stream of (item.streams || [])) {
          if (existing.has(stream.url)) { skipped++; continue; }
          newStreams.push({ movie_id: movieId, url: stream.url, quality: 'HD' });
          existing.add(stream.url); // prevent duplicates within batch
        }
      }

      // Batch insert
      for (let i = 0; i < newStreams.length; i += 500) {
        const { error } = await db.from('movie_streams').insert(newStreams.slice(i, i + 500));
        if (!error) inserted += Math.min(500, newStreams.length - i);
      }
    }

    if (type === 'series') {
      // Batch lookup all series tmdb_ids
      const tmdbIds = items.map((i: any) => i.tmdb_id).filter(Boolean);
      const seriesMap = new Map<number, string>();

      for (let i = 0; i < tmdbIds.length; i += 500) {
        const { data } = await db.from('series_catalog').select('id, tmdb_id').in('tmdb_id', tmdbIds.slice(i, i + 500));
        for (const r of data || []) seriesMap.set(r.tmdb_id, r.id);
      }

      // Get all series_ids
      const seriesIds = [...seriesMap.values()];
      
      // Batch fetch episodes for all series
      const episodeMap = new Map<string, string>(); // "seriesId-S-E" -> episode.id
      for (let i = 0; i < seriesIds.length; i += 500) {
        const { data } = await db.from('series_episodes')
          .select('id, series_id, season_number, episode_number')
          .in('series_id', seriesIds.slice(i, i + 500));
        for (const r of data || []) {
          episodeMap.set(`${r.series_id}-${r.season_number}-${r.episode_number}`, r.id);
        }
      }

      // Get all episode_ids for existing stream check
      const episodeIds = [...episodeMap.values()];
      const existingEpUrls = new Map<string, Set<string>>();
      for (let i = 0; i < episodeIds.length; i += 500) {
        const { data } = await db.from('episode_streams').select('episode_id, url').in('episode_id', episodeIds.slice(i, i + 500));
        for (const r of data || []) {
          if (!existingEpUrls.has(r.episode_id)) existingEpUrls.set(r.episode_id, new Set());
          existingEpUrls.get(r.episode_id)!.add(r.url);
        }
      }

      // Build new streams
      const newStreams: any[] = [];
      for (const item of items) {
        const seriesId = seriesMap.get(item.tmdb_id);
        if (!seriesId) { skipped++; continue; }

        for (const ep of (item.episodios || [])) {
          const epKey = `${seriesId}-${ep.season}-${ep.episode}`;
          const episodeId = episodeMap.get(epKey);
          if (!episodeId) continue;

          const existing = existingEpUrls.get(episodeId) || new Set();
          for (const stream of (ep.streams || [])) {
            if (existing.has(stream.url)) { skipped++; continue; }
            newStreams.push({ episode_id: episodeId, url: stream.url, quality: 'HD' });
            existing.add(stream.url);
          }
        }
      }

      for (let i = 0; i < newStreams.length; i += 500) {
        const { error } = await db.from('episode_streams').insert(newStreams.slice(i, i + 500));
        if (!error) inserted += Math.min(500, newStreams.length - i);
      }
    }

    return new Response(JSON.stringify({ inserted, skipped }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
