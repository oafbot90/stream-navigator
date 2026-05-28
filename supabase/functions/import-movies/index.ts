import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TMDB_BASE = "https://api.themoviedb.org/3";

interface MovieInput {
  title: string;
  year?: number | null;
  tmdb_id?: number | null;
  links: { url: string; quality?: string }[];
  source?: string;
}

async function searchTMDB(title: string, year: string | undefined, apiKey: string): Promise<any | null> {
  const params = new URLSearchParams({ api_key: apiKey, language: "pt-BR", query: title });
  if (year) params.append("year", year);
  try {
    const res = await fetch(`${TMDB_BASE}/search/movie?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] || null;
  } catch { return null; }
}

async function getTMDBDetails(tmdbId: number, apiKey: string): Promise<any | null> {
  try {
    const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${apiKey}&language=pt-BR`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.overview) return data;

    const fallbackRes = await fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${apiKey}&language=en-US`);
    if (!fallbackRes.ok) return data;
    const fallback = await fallbackRes.json();
    return {
      ...data,
      overview: data.overview || fallback.overview || null,
      poster_path: data.poster_path || fallback.poster_path || null,
      backdrop_path: data.backdrop_path || fallback.backdrop_path || null,
    };
  } catch { return null; }
}

async function processTMDB(movie: MovieInput, apiKey: string): Promise<any | null> {
  if (movie.tmdb_id) {
    const details = await getTMDBDetails(movie.tmdb_id, apiKey);
    if (details) return details;
  }
  const yearStr = movie.year ? String(movie.year) : undefined;
  const searchResult = await searchTMDB(movie.title, yearStr, apiKey);
  if (!searchResult) return null;
  return await getTMDBDetails(searchResult.id, apiKey);
}

async function refreshExistingMovieMetadata(supabase: any, movieId: string, movie: MovieInput, apiKey: string): Promise<boolean> {
  const tmdbDetails = await processTMDB(movie, apiKey);
  if (!tmdbDetails) return false;

  const updateFields: Record<string, any> = {
    tmdb_id: tmdbDetails.id || movie.tmdb_id || null,
    overview: tmdbDetails.overview || null,
    poster_path: tmdbDetails.poster_path || null,
    vote_average: tmdbDetails.vote_average || 0,
    vote_count: tmdbDetails.vote_count || 0,
    genres: tmdbDetails.genres?.map((g: any) => g.name) || [],
    runtime: tmdbDetails.runtime || null,
    release_date: tmdbDetails.release_date || null,
    release_year: tmdbDetails.release_date ? parseInt(tmdbDetails.release_date.split("-")[0]) : movie.year || null,
  };

  const { error } = await supabase.from("movies_catalog").update(updateFields).eq("id", movieId);
  if (error) throw error;
  return Boolean(tmdbDetails.overview);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const tmdbApiKey = Deno.env.get("TMDB_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { batch } = body as { batch: MovieInput[] };

    if (!batch || !Array.isArray(batch) || batch.length === 0) {
      return new Response(JSON.stringify({ error: "batch array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let imported = 0, skipped = 0, errors = 0, urls_added = 0, metadata_updated = 0;
    // Detailed breakdown
    const skippedDetails: { title: string; reason: string }[] = [];
    const errorReasons: { title: string; reason: string }[] = [];
    const urlsAddedDetails: { title: string; count: number }[] = [];
    const noNewUrlsDetails: { title: string; reason: string }[] = [];

    // 1. Batch lookup existing by tmdb_id and title
    const tmdbIds = batch.map(m => m.tmdb_id).filter(Boolean) as number[];
    const titles = batch.map(m => m.title);

    const existingTmdbMap = new Map<number, string>();
    const existingTitleMap = new Map<string, string>();

    const lookups: Promise<void>[] = [];
    for (let i = 0; i < tmdbIds.length; i += 500) {
      lookups.push((async () => {
        const { data } = await supabase.from("movies_catalog").select("id, tmdb_id").in("tmdb_id", tmdbIds.slice(i, i + 500));
        for (const r of data || []) existingTmdbMap.set(r.tmdb_id, r.id);
      })());
    }
    for (let i = 0; i < titles.length; i += 500) {
      lookups.push((async () => {
        const { data } = await supabase.from("movies_catalog").select("id, title").in("title", titles.slice(i, i + 500));
        for (const r of data || []) existingTitleMap.set(r.title?.toLowerCase(), r.id);
      })());
    }
    await Promise.all(lookups);

    // 2. Separate existing vs new — track WHY each was skipped
    const toProcess: MovieInput[] = [];
    const toAddUrls: { movieId: string; title: string; links: { url: string; quality?: string }[] }[] = [];
    const toRefreshMetadata: { movieId: string; movie: MovieInput }[] = [];

    for (const m of batch) {
      const tmdbHit = m.tmdb_id ? existingTmdbMap.get(m.tmdb_id) : undefined;
      const titleHit = existingTitleMap.get(m.title.toLowerCase());
      const existingId = tmdbHit || titleHit;
      if (existingId) {
        const reason = tmdbHit
          ? `já existe (tmdb_id ${m.tmdb_id})`
          : `já existe (título idêntico)`;
        skippedDetails.push({ title: m.title, reason });
        if (m.links.length > 0) toAddUrls.push({ movieId: existingId, title: m.title, links: m.links });
        toRefreshMetadata.push({ movieId: existingId, movie: m });
        skipped++;
      } else {
        toProcess.push(m);
      }
    }

    // 3. Batch add URLs to existing movies
    if (toAddUrls.length > 0) {
      const movieIds = [...new Set(toAddUrls.map(i => i.movieId))];
      const existingStreams = new Map<string, Set<string>>();

      for (let i = 0; i < movieIds.length; i += 500) {
        const { data } = await supabase.from("movie_streams").select("movie_id, url").in("movie_id", movieIds.slice(i, i + 500));
        for (const r of data || []) {
          if (!existingStreams.has(r.movie_id)) existingStreams.set(r.movie_id, new Set());
          existingStreams.get(r.movie_id)!.add(r.url);
        }
      }

      const newStreams: any[] = [];
      for (const item of toAddUrls) {
        const existing = existingStreams.get(item.movieId) || new Set();
        let added = 0;
        for (const l of item.links) {
          if (!existing.has(l.url)) {
            newStreams.push({ movie_id: item.movieId, url: l.url, quality: l.quality || "HD", stream_type: "direct", status: "active" });
            existing.add(l.url);
            added++;
          }
        }
        if (added > 0) urlsAddedDetails.push({ title: item.title, count: added });
        else noNewUrlsDetails.push({ title: item.title, reason: `todas as ${item.links.length} URL(s) já existiam` });
      }

      for (let i = 0; i < newStreams.length; i += 500) {
        const { error } = await supabase.from("movie_streams").insert(newStreams.slice(i, i + 500));
        if (!error) urls_added += Math.min(500, newStreams.length - i);
      }
    }

    // 4. Refresh TMDB metadata for existing movies too, so skipped items get synopsis/poster/runtime
    for (let i = 0; i < toRefreshMetadata.length; i += 5) {
      const slice = toRefreshMetadata.slice(i, i + 5);
      const results = await Promise.allSettled(
        slice.map(item => refreshExistingMovieMetadata(supabase, item.movieId, item.movie, tmdbApiKey))
      );
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === 'fulfilled') {
          if (result.value) metadata_updated++;
        } else {
          errors++;
          errorReasons.push({ title: slice[j].movie.title, reason: `TMDB metadata: ${result.reason?.message || String(result.reason)}` });
        }
      }
    }

    // 5. Process new movies in parallel batches of 10
    const PARALLEL = 10;
    for (let i = 0; i < toProcess.length; i += PARALLEL) {
      const slice = toProcess.slice(i, i + PARALLEL);
      const tmdbResults = await Promise.allSettled(
        slice.map(movie => processTMDB(movie, tmdbApiKey))
      );

      const inserts: any[] = [];
      const streamInserts: { url: string; quality?: string }[][] = [];

      for (let j = 0; j < slice.length; j++) {
        const movie = slice[j];
        const tmdbDetails = tmdbResults[j].status === 'fulfilled' ? tmdbResults[j].value : null;

        // Skip if tmdb_id resolved to one already in DB
        const resolvedId = tmdbDetails?.id || movie.tmdb_id;
        if (resolvedId && existingTmdbMap.has(resolvedId)) {
          skippedDetails.push({ title: movie.title, reason: `já existe (tmdb_id ${resolvedId} resolvido via TMDB)` });
          if (movie.links.length > 0) toAddUrls.push({ movieId: existingTmdbMap.get(resolvedId)!, title: movie.title, links: movie.links });
          skipped++;
          continue;
        }

        inserts.push({
          title: tmdbDetails?.title || movie.title,
          original_title: tmdbDetails?.original_title || movie.title,
          tmdb_id: resolvedId || null,
          imdb_id: tmdbDetails?.imdb_id || null,
          overview: tmdbDetails?.overview || null,
          poster_path: tmdbDetails?.poster_path || null,
          // backdrop_path intencionalmente omitido — buscado em runtime via TMDB API
          vote_average: tmdbDetails?.vote_average || 0,
          vote_count: tmdbDetails?.vote_count || 0,
          release_date: tmdbDetails?.release_date || null,
          release_year: tmdbDetails?.release_date ? parseInt(tmdbDetails.release_date.split("-")[0]) : movie.year || null,
          genres: tmdbDetails?.genres?.map((g: any) => g.name) || [],
          runtime: tmdbDetails?.runtime || null,
          content_type: "movie",
          source: movie.source || "custom",
        });
        streamInserts.push(movie.links);
      }

      if (inserts.length > 0) {
        const { data: insertedMovies, error: insertError } = await supabase
          .from("movies_catalog").insert(inserts).select("id");

        if (insertError) {
          console.error("Bulk insert failed, retrying one-by-one:", insertError.message);
          // Fallback: insert one-by-one to identify which rows fail and why
          for (let k = 0; k < inserts.length; k++) {
            const { data: oneIns, error: oneErr } = await supabase
              .from("movies_catalog").insert(inserts[k]).select("id").single();
            if (oneErr || !oneIns) {
              const reason = oneErr?.message || "unknown";
              // Detect duplicate-key as skipped instead of error
              if (/duplicate key|unique constraint/i.test(reason)) {
                skipped++;
                skippedDetails.push({ title: inserts[k].title, reason: `duplicado no banco (${reason.slice(0, 80)})` });
              } else {
                errors++;
                errorReasons.push({ title: inserts[k].title, reason });
                console.error(`Row error [${inserts[k].title}] tmdb=${inserts[k].tmdb_id}: ${reason}`);
              }
            } else {
              imported++;
              if (inserts[k].tmdb_id) existingTmdbMap.set(inserts[k].tmdb_id, oneIns.id);
              const links = streamInserts[k] || [];
              if (links.length > 0) {
                const streams = links.map(l => ({ movie_id: oneIns.id, url: l.url, quality: l.quality || "HD", stream_type: "direct", status: "active" }));
                await supabase.from("movie_streams").insert(streams);
              }
            }
          }
          continue;
        }

        if (insertedMovies && insertedMovies.length > 0) {
          const allStreams: any[] = [];
          for (let k = 0; k < insertedMovies.length; k++) {
            const movieId = insertedMovies[k].id;
            for (const l of streamInserts[k] || []) {
              allStreams.push({ movie_id: movieId, url: l.url, quality: l.quality || "HD", stream_type: "direct", status: "active" });
            }
            if (inserts[k].tmdb_id) existingTmdbMap.set(inserts[k].tmdb_id, movieId);
          }
          if (allStreams.length > 0) {
            await supabase.from("movie_streams").insert(allStreams);
          }
          imported += insertedMovies.length;
        }
      }
    }

    return new Response(JSON.stringify({
      imported,
      skipped,
      errors,
      urls_added,
      metadata_updated,
      skippedDetails: skippedDetails.slice(0, 100),
      errorReasons: errorReasons.slice(0, 100),
      urlsAddedDetails: urlsAddedDetails.slice(0, 100),
      noNewUrlsDetails: noNewUrlsDetails.slice(0, 100),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Fatal error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
