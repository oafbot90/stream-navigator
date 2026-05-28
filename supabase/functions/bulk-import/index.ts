import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY')!;

function extractTmdbIdFromStreamUrl(url?: string): number | null {
  if (!url) return null;
  const match = url.match(/\/movie\/(\d+)\./);
  return match ? parseInt(match[1]) : null;
}

async function getTmdbMovie(tmdbId: number): Promise<any | null> {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`);
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

async function searchTMDB(title: string): Promise<any | null> {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=pt-BR&page=1`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] || null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { filmes } = await req.json();

    if (!filmes || !Array.isArray(filmes)) {
      return new Response(JSON.stringify({ error: 'filmes array required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let imported = 0, skipped = 0, errors = 0, streamsInserted = 0;

    // 1. Pre-extract all tmdb_ids and titles for batch lookup
    const allTmdbIds: number[] = [];
    const allTitles: string[] = [];
    const items = filmes.map(item => {
      const nome = item.nome?.trim() || '';
      const streamUrl = item.streams?.[0]?.url || '';
      const tmdbId = extractTmdbIdFromStreamUrl(streamUrl);
      if (tmdbId) allTmdbIds.push(tmdbId);
      if (nome) allTitles.push(nome);
      return { nome, streamUrl, tmdbId };
    }).filter(i => i.nome);

    // 2. Batch fetch existing movies by tmdb_id and title (chunks of 500 for Supabase limit)
    const existingByTmdb = new Map<number, string>();
    const existingByTitle = new Map<string, string>();

    const tmdbChunks = [];
    for (let i = 0; i < allTmdbIds.length; i += 500) tmdbChunks.push(allTmdbIds.slice(i, i + 500));
    const titleChunks = [];
    for (let i = 0; i < allTitles.length; i += 500) titleChunks.push(allTitles.slice(i, i + 500));

    await Promise.all([
      ...tmdbChunks.map(async chunk => {
        const { data } = await db.from('movies_catalog').select('id, tmdb_id').in('tmdb_id', chunk);
        for (const r of data || []) existingByTmdb.set(r.tmdb_id, r.id);
      }),
      ...titleChunks.map(async chunk => {
        const { data } = await db.from('movies_catalog').select('id, title').in('title', chunk);
        for (const r of data || []) existingByTitle.set(r.title.toLowerCase(), r.id);
      }),
    ]);

    // 3. Separate existing vs new
    const toAddStreams: { movieId: string; url: string }[] = [];
    const toFetchTmdb: typeof items = [];

    for (const item of items) {
      let existingId = item.tmdbId ? existingByTmdb.get(item.tmdbId) : undefined;
      if (!existingId) existingId = existingByTitle.get(item.nome.toLowerCase());

      if (existingId) {
        if (item.streamUrl) toAddStreams.push({ movieId: existingId, url: item.streamUrl });
        skipped++;
      } else {
        toFetchTmdb.push(item);
      }
    }

    // 4. Batch check existing streams and insert only new ones
    if (toAddStreams.length > 0) {
      const movieIds = [...new Set(toAddStreams.map(s => s.movieId))];
      const existingStreams = new Map<string, Set<string>>();
      
      for (let i = 0; i < movieIds.length; i += 500) {
        const chunk = movieIds.slice(i, i + 500);
        const { data } = await db.from('movie_streams').select('movie_id, url').in('movie_id', chunk);
        for (const r of data || []) {
          if (!existingStreams.has(r.movie_id)) existingStreams.set(r.movie_id, new Set());
          existingStreams.get(r.movie_id)!.add(r.url);
        }
      }

      const newStreams = toAddStreams
        .filter(s => !existingStreams.get(s.movieId)?.has(s.url))
        .map(s => ({ movie_id: s.movieId, url: s.url, quality: 'HD', stream_type: 'direct', status: 'active' }));

      if (newStreams.length > 0) {
        for (let i = 0; i < newStreams.length; i += 500) {
          const { error } = await db.from('movie_streams').insert(newStreams.slice(i, i + 500));
          if (!error) streamsInserted += Math.min(500, newStreams.length - i);
        }
      }
    }

    // 5. Process new movies in parallel batches of 10
    const PARALLEL = 10;
    for (let i = 0; i < toFetchTmdb.length; i += PARALLEL) {
      const slice = toFetchTmdb.slice(i, i + PARALLEL);

      const tmdbResults = await Promise.allSettled(slice.map(async item => {
        if (item.tmdbId) {
          const d = await getTmdbMovie(item.tmdbId);
          if (d) return d;
        }
        return await searchTMDB(item.nome);
      }));

      const inserts: any[] = [];
      const streamUrls: (string | null)[] = [];

      for (let j = 0; j < slice.length; j++) {
        const item = slice[j];
        const tmdbData = tmdbResults[j].status === 'fulfilled' ? tmdbResults[j].value : null;
        const resolvedTmdbId = tmdbData?.id || item.tmdbId;

        // Skip if tmdb_id was found in DB during TMDB fetch
        if (resolvedTmdbId && existingByTmdb.has(resolvedTmdbId)) {
          if (item.streamUrl) toAddStreams.push({ movieId: existingByTmdb.get(resolvedTmdbId)!, url: item.streamUrl });
          skipped++;
          continue;
        }

        inserts.push({
          title: tmdbData?.title || item.nome,
          original_title: tmdbData?.original_title || item.nome,
          tmdb_id: resolvedTmdbId || null,
          overview: tmdbData?.overview || null,
          poster_path: tmdbData?.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : null,
          release_date: tmdbData?.release_date || null,
          release_year: tmdbData?.release_date ? parseInt(tmdbData.release_date.substring(0, 4)) : null,
          vote_average: tmdbData?.vote_average || 0,
          vote_count: tmdbData?.vote_count || 0,
          runtime: tmdbData?.runtime || null,
          genres: tmdbData?.genres ? tmdbData.genres.map((g: any) => g.name) : [],
          content_type: 'movie',
          source: 'cineveo',
        });
        streamUrls.push(item.streamUrl || null);
      }

      if (inserts.length > 0) {
        const { data: inserted, error: insertErr } = await db.from('movies_catalog').insert(inserts).select('id');
        if (insertErr || !inserted) {
          errors += inserts.length;
          continue;
        }

        const streams = inserted
          .map((m, k) => streamUrls[k] ? { movie_id: m.id, url: streamUrls[k]!, quality: 'HD', stream_type: 'direct', status: 'active' } : null)
          .filter(Boolean);

        if (streams.length > 0) {
          await db.from('movie_streams').insert(streams);
          streamsInserted += streams.length;
        }

        imported += inserted.length;
        // Track new tmdb_ids
        for (let k = 0; k < inserted.length; k++) {
          if (inserts[k].tmdb_id) existingByTmdb.set(inserts[k].tmdb_id, inserted[k].id);
        }
      }
    }

    return new Response(JSON.stringify({ imported, skipped, errors, streamsInserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
