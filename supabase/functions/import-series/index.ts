import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TMDB_BASE = "https://api.themoviedb.org/3";

interface EpisodeInput {
  titulo: string;
  temporada: number;
  episodio: number;
  url?: string;
  has_dub?: boolean;
  has_leg?: boolean;
  still_path?: string | null;
  air_date?: string | null;
  streams: { url: string; tipo?: string }[];
}

interface SeriesInput {
  nome: string;
  tmdb_id?: number | null;
  episodios: EpisodeInput[];
}

function extractTmdbIdFromUrl(episodes: EpisodeInput[]): number | null {
  for (const ep of episodes) {
    if (ep.url) {
      const match = ep.url.match(/-(\d{4,})-t\d/);
      if (match) return parseInt(match[1]);
    }
  }
  return null;
}

async function searchTMDBSeries(title: string, apiKey: string): Promise<any | null> {
  const params = new URLSearchParams({ api_key: apiKey, language: "pt-BR", query: title });
  try {
    const res = await fetch(`${TMDB_BASE}/search/tv?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] || null;
  } catch { return null; }
}

async function getTMDBSeriesDetails(tmdbId: number, apiKey: string): Promise<any | null> {
  try {
    const res = await fetch(`${TMDB_BASE}/tv/${tmdbId}?api_key=${apiKey}&language=pt-BR`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.overview) return data;

    const fallbackRes = await fetch(`${TMDB_BASE}/tv/${tmdbId}?api_key=${apiKey}&language=en-US`);
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

async function refreshExistingSeriesMetadata(supabase: any, seriesId: string, series: SeriesInput, apiKey: string): Promise<boolean> {
  let tmdbId = series.tmdb_id || extractTmdbIdFromUrl(series.episodios);
  let tmdbDetails = tmdbId ? await getTMDBSeriesDetails(tmdbId, apiKey) : null;

  if (!tmdbDetails) {
    const searchResult = await searchTMDBSeries(series.nome, apiKey);
    if (searchResult) {
      tmdbId = searchResult.id;
      tmdbDetails = await getTMDBSeriesDetails(searchResult.id, apiKey);
    }
  }
  if (!tmdbDetails) return false;

  const updateFields: Record<string, any> = {
    tmdb_id: tmdbDetails.id || tmdbId || null,
    overview: tmdbDetails.overview || null,
    poster_path: tmdbDetails.poster_path || null,
    backdrop_path: tmdbDetails.backdrop_path || null,
    vote_average: tmdbDetails.vote_average || 0,
    vote_count: tmdbDetails.vote_count || 0,
    first_air_date: tmdbDetails.first_air_date || null,
    last_air_date: tmdbDetails.last_air_date || null,
    release_year: tmdbDetails.first_air_date ? parseInt(tmdbDetails.first_air_date.split("-")[0]) : null,
    genres: tmdbDetails.genres?.map((g: any) => g.name) || [],
    number_of_seasons: tmdbDetails.number_of_seasons || null,
    number_of_episodes: tmdbDetails.number_of_episodes || series.episodios.length,
    status: tmdbDetails.status || "unknown",
  };

  const { error } = await supabase.from("series_catalog").update(updateFields).eq("id", seriesId);
  if (error) throw error;
  return Boolean(tmdbDetails.overview);
}

async function getTMDBSeasonEpisodeCounts(tmdbId: number, numSeasons: number, apiKey: string): Promise<number[]> {
  // Parallel fetch all seasons to avoid timeouts
  const promises = Array.from({ length: numSeasons }, (_, i) => {
    const s = i + 1;
    return fetch(`${TMDB_BASE}/tv/${tmdbId}/season/${s}?api_key=${apiKey}&language=pt-BR`)
      .then(res => res.ok ? res.json() : null)
      .then(data => data?.episodes?.length || 0)
      .catch(() => 0);
  });
  return await Promise.all(promises);
}

function autoSplitSeasons(episodes: EpisodeInput[], seasonCounts: number[]): EpisodeInput[] {
  // All episodes are season 1, remap to correct seasons based on TMDB counts
  const sorted = [...episodes].sort((a, b) => a.episodio - b.episodio);
  const result: EpisodeInput[] = [];
  let idx = 0;
  for (let s = 0; s < seasonCounts.length && idx < sorted.length; s++) {
    const count = seasonCounts[s];
    for (let e = 0; e < count && idx < sorted.length; e++, idx++) {
      result.push({
        ...sorted[idx],
        temporada: s + 1,
        episodio: e + 1,
      });
    }
  }
  // Any remaining episodes go into the last season
  while (idx < sorted.length) {
    const lastSeason = seasonCounts.length;
    const lastEp = result.filter(r => r.temporada === lastSeason).length + 1;
    result.push({ ...sorted[idx], temporada: lastSeason, episodio: lastEp });
    idx++;
  }
  return result;
}

async function processSeriesChunk(
  chunk: SeriesInput[],
  supabase: any,
  apiKey: string
): Promise<{ imported: number; skipped: number; errors: number; episodes_imported: number; urls_added: number; metadata_updated: number; skippedDetails: { title: string; reason: string }[]; errorReasons: { title: string; reason: string }[]; urlsAddedDetails: { title: string; count: number }[]; noNewUrlsDetails: { title: string; reason: string }[] }> {
  let imported = 0, skipped = 0, errors = 0, episodes_imported = 0, urls_added = 0, metadata_updated = 0;
  const skippedDetails: { title: string; reason: string }[] = [];
  const errorReasons: { title: string; reason: string }[] = [];
  const urlsAddedDetails: { title: string; count: number }[] = [];
  const noNewUrlsDetails: { title: string; reason: string }[] = [];

  const titles = chunk.map(s => s.nome);
  // Collect all possible tmdb_ids: from field AND from episode URLs
  const allTmdbIds = new Set<number>();
  for (const s of chunk) {
    if (s.tmdb_id) allTmdbIds.add(s.tmdb_id);
    const extracted = extractTmdbIdFromUrl(s.episodios);
    if (extracted) allTmdbIds.add(extracted);
  }
  const tmdbIds = Array.from(allTmdbIds);

  const [titleExisting, tmdbExisting] = await Promise.all([
    supabase.from("series_catalog").select("id, title, tmdb_id, overview, poster_path").in("title", titles),
    tmdbIds.length > 0
      ? supabase.from("series_catalog").select("id, title, tmdb_id, overview, poster_path").in("tmdb_id", tmdbIds)
      : { data: [] },
  ]);

  const existingTitleMap = new Map((titleExisting.data || []).map((e: any) => [e.title, e.id]));
  const existingTmdbMap = new Map((tmdbExisting.data || []).map((e: any) => [e.tmdb_id, e.id]));
  const hasMetadataMap = new Map<string, boolean>();
  for (const e of (titleExisting.data || [])) hasMetadataMap.set(e.id, Boolean(e.overview && e.poster_path));
  for (const e of (tmdbExisting.data || [])) hasMetadataMap.set(e.id, Boolean(e.overview && e.poster_path));

  for (const series of chunk) {
    let existingId = existingTitleMap.get(series.nome);
    let matchedBy: 'título idêntico' | `tmdb_id ${number}` | null = null;
    if (existingId) matchedBy = 'título idêntico';
    if (!existingId && series.tmdb_id && existingTmdbMap.has(series.tmdb_id)) {
      existingId = existingTmdbMap.get(series.tmdb_id);
      matchedBy = `tmdb_id ${series.tmdb_id}` as any;
    }
    if (!existingId) {
      const extractedId = extractTmdbIdFromUrl(series.episodios);
      if (extractedId && existingTmdbMap.has(extractedId)) {
        existingId = existingTmdbMap.get(extractedId);
        matchedBy = `tmdb_id ${extractedId}` as any;
      }
    }

    if (existingId) {
      // Series exists — add new episode streams only
      try {
        // Skip TMDB refresh if metadata already present (saves time and avoids timeouts)
        if (!hasMetadataMap.get(existingId)) {
          try {
            if (await refreshExistingSeriesMetadata(supabase, existingId, series, apiKey)) metadata_updated++;
          } catch (metadataErr) {
            errors++;
            errorReasons.push({ title: series.nome, reason: `TMDB metadata: ${(metadataErr as Error).message}` });
          }
        }

        let seriesUrlsAdded = 0;
        let seriesTotalIncomingUrls = 0;
        for (const ep of series.episodios) seriesTotalIncomingUrls += (ep.streams?.length || 0);
        let episodesToMatch = series.episodios;

        // Auto-split seasons if needed (all eps in season 1 but DB has multiple seasons)
        const uniqueSeasons = new Set(episodesToMatch.map(e => e.temporada));
        if (uniqueSeasons.size === 1 && uniqueSeasons.has(1) && episodesToMatch.length > 30) {
          // Check if this series has multiple seasons in DB
          const { data: seriesInfo } = await supabase
            .from("series_catalog")
            .select("tmdb_id, number_of_seasons")
            .eq("id", existingId)
            .single();

          if (seriesInfo?.tmdb_id && seriesInfo?.number_of_seasons > 1) {
            const seasonCounts = await getTMDBSeasonEpisodeCounts(seriesInfo.tmdb_id, seriesInfo.number_of_seasons, apiKey);
            if (seasonCounts.some(c => c > 0)) {
              episodesToMatch = autoSplitSeasons(episodesToMatch, seasonCounts);
              console.log(`Auto-split existing series "${series.nome}" for stream matching: ${seasonCounts.map((c, i) => `S${i+1}=${c}`).join(', ')}`);
            }
          }
        }

        // Also insert missing episodes
        for (const ep of episodesToMatch) {
          let { data: existingEp } = await supabase
            .from("series_episodes")
            .select("id")
            .eq("series_id", existingId)
            .eq("season_number", ep.temporada)
            .eq("episode_number", ep.episodio)
            .maybeSingle();

          // If episode doesn't exist, create it
          if (!existingEp) {
            const epPayload: any = {
              series_id: existingId,
              title: ep.titulo,
              season_number: ep.temporada,
              episode_number: ep.episodio,
              has_dub: ep.has_dub || false,
              has_leg: ep.has_leg || false,
              source_url: ep.url || null,
              still_path: ep.still_path || null,
              air_date: ep.air_date || null,
            };
            let { data: newEp, error: epErr } = await supabase
              .from("series_episodes")
              .insert(epPayload)
              .select("id")
              .single();
            if (epErr && /still_path|air_date/i.test(epErr.message || "")) {
              const { still_path, air_date, ...fb } = epPayload;
              const retry = await supabase.from("series_episodes").insert(fb).select("id").single();
              newEp = retry.data; epErr = retry.error;
            }
            if (!epErr && newEp) {
              existingEp = newEp;
              episodes_imported++;
            } else if (epErr) {
              errors++;
              errorReasons.push({ title: series.nome, reason: `Ep ${ep.temporada}x${ep.episodio}: ${epErr.message}` });
            }
          }

          if (existingEp && ep.streams.length > 0) {
            // Check which URLs already exist
            const { data: existingStreams } = await supabase
              .from("episode_streams")
              .select("url")
              .eq("episode_id", existingEp.id);
            const existingUrls = new Set((existingStreams || []).map((s: any) => s.url));

            const newStreams = ep.streams
              .filter(s => !existingUrls.has(s.url))
              .map(s => ({
                episode_id: existingEp.id,
                url: s.url,
                quality: "HD",
                stream_type: s.tipo || "direct",
                status: "active",
              }));

            if (newStreams.length > 0) {
              const { error: insertErr } = await supabase
                .from("episode_streams")
                .insert(newStreams);
              if (!insertErr) {
                seriesUrlsAdded += newStreams.length;
              } else {
                console.error(`Error inserting streams for ep ${ep.temporada}x${ep.episodio}:`, insertErr);
                errors++;
                errorReasons.push({ title: series.nome, reason: `Streams Ep ${ep.temporada}x${ep.episodio}: ${insertErr.message}` });
              }
            }
          }
        }
        urls_added += seriesUrlsAdded;
        if (seriesUrlsAdded > 0) {
          console.log(`Added ${seriesUrlsAdded} new URLs to existing series "${series.nome}"`);
          urlsAddedDetails.push({ title: series.nome, count: seriesUrlsAdded });
        } else if (seriesTotalIncomingUrls > 0) {
          noNewUrlsDetails.push({ title: series.nome, reason: `todas as ${seriesTotalIncomingUrls} URL(s) já existiam` });
        }
      } catch (err) {
        console.error(`Error adding URLs to ${series.nome}:`, err);
        errors++;
        errorReasons.push({ title: series.nome, reason: `Erro ao adicionar URLs: ${(err as Error).message}` });
      }
      skipped++;
      skippedDetails.push({ title: series.nome, reason: matchedBy ? `já existe (${matchedBy})` : 'já existe (série)' });
      continue;
    }

    try {
      let tmdbId = series.tmdb_id || extractTmdbIdFromUrl(series.episodios);
      let tmdbDetails: any = null;

      if (tmdbId) {
        tmdbDetails = await getTMDBSeriesDetails(tmdbId, apiKey);
      }
      if (!tmdbDetails) {
        const searchResult = await searchTMDBSeries(series.nome, apiKey);
        if (searchResult) {
          tmdbId = searchResult.id;
          tmdbDetails = await getTMDBSeriesDetails(searchResult.id, apiKey);
        }
      }

      // Auto-split seasons: if all episodes are in season 1 but TMDB has multiple seasons
      let episodesToProcess = series.episodios;
      const uniqueSeasons = new Set(episodesToProcess.map(e => e.temporada));
      const tmdbNumSeasons = tmdbDetails?.number_of_seasons || 0;

      if (uniqueSeasons.size === 1 && uniqueSeasons.has(1) && tmdbNumSeasons > 1 && tmdbId) {
        console.log(`Auto-splitting ${series.nome}: ${episodesToProcess.length} eps into ${tmdbNumSeasons} seasons`);
        const seasonCounts = await getTMDBSeasonEpisodeCounts(tmdbId, tmdbNumSeasons, apiKey);
        if (seasonCounts.some(c => c > 0)) {
          episodesToProcess = autoSplitSeasons(episodesToProcess, seasonCounts);
          console.log(`Split result: ${seasonCounts.map((c, i) => `S${i+1}=${c}`).join(', ')}`);
        }
      }

      const seasons = new Set(episodesToProcess.map(e => e.temporada));
      const seriesInsert = {
        title: tmdbDetails?.name || series.nome,
        original_title: tmdbDetails?.original_name || series.nome,
        tmdb_id: tmdbDetails?.id || tmdbId || null,
        overview: tmdbDetails?.overview || null,
        poster_path: tmdbDetails?.poster_path || null,
        backdrop_path: tmdbDetails?.backdrop_path || null,
        vote_average: tmdbDetails?.vote_average || 0,
        vote_count: tmdbDetails?.vote_count || 0,
        first_air_date: tmdbDetails?.first_air_date || null,
        last_air_date: tmdbDetails?.last_air_date || null,
        release_year: tmdbDetails?.first_air_date ? parseInt(tmdbDetails.first_air_date.split("-")[0]) : null,
        genres: tmdbDetails?.genres?.map((g: any) => g.name) || [],
        number_of_seasons: tmdbDetails?.number_of_seasons || seasons.size,
        number_of_episodes: tmdbDetails?.number_of_episodes || series.episodios.length,
        status: tmdbDetails?.status || "unknown",
        source: "cineveo",
      };

      const { data: insertedSeries, error: seriesError } = await supabase
        .from("series_catalog")
        .insert(seriesInsert)
        .select("id")
        .single();

      if (seriesError) {
        console.error(`Error inserting series ${series.nome}:`, seriesError);
        errors++;
        errorReasons.push({ title: series.nome, reason: seriesError.message || 'Erro ao inserir série' });
        continue;
      }

      const seriesId = insertedSeries.id;
      const BATCH = 50;
      let newSeriesUrlsAdded = 0;
      let newSeriesTotalIncomingUrls = 0;
      for (const ep of episodesToProcess) newSeriesTotalIncomingUrls += (ep.streams?.length || 0);
      for (let i = 0; i < episodesToProcess.length; i += BATCH) {
        const epSlice = episodesToProcess.slice(i, i + BATCH);
        const epInserts = epSlice.map(ep => ({
          series_id: seriesId,
          title: ep.titulo,
          season_number: ep.temporada,
          episode_number: ep.episodio,
          has_dub: ep.has_dub || false,
          has_leg: ep.has_leg || false,
          source_url: ep.url || null,
          still_path: ep.still_path || null,
          air_date: ep.air_date || null,
        }));

        let { data: insertedEps, error: epError } = await supabase
          .from("series_episodes")
          .insert(epInserts)
          .select("id");

        // Fallback: if columns still_path/air_date don't exist yet, retry without them
        if (epError && /still_path|air_date/i.test(epError.message || "")) {
          const fallback = epInserts.map(({ still_path, air_date, ...rest }) => rest);
          const retry = await supabase.from("series_episodes").insert(fallback).select("id");
          insertedEps = retry.data;
          epError = retry.error;
        }

        if (epError) {
          console.error(`Error inserting episodes for ${series.nome}:`, epError);
          errors++;
          errorReasons.push({ title: series.nome, reason: `Episódios: ${epError.message}` });
          continue;
        }

        if (insertedEps && insertedEps.length > 0) {
          const allStreams: any[] = [];
          for (let j = 0; j < insertedEps.length; j++) {
            const epId = insertedEps[j].id;
            const epStreams = epSlice[j]?.streams || [];
            for (const s of epStreams) {
              allStreams.push({
                episode_id: epId,
                url: s.url,
                quality: "HD",
                stream_type: s.tipo || "direct",
                status: "active",
              });
            }
          }
          if (allStreams.length > 0) {
            const { error: streamInsertErr } = await supabase.from("episode_streams").insert(allStreams);
            if (!streamInsertErr) {
              newSeriesUrlsAdded += allStreams.length;
            } else {
              errors++;
              errorReasons.push({ title: series.nome, reason: `Streams: ${streamInsertErr.message}` });
            }
          }
          episodes_imported += insertedEps.length;
        }
      }
      urls_added += newSeriesUrlsAdded;
      if (newSeriesUrlsAdded > 0) {
        urlsAddedDetails.push({ title: series.nome, count: newSeriesUrlsAdded });
      } else if (newSeriesTotalIncomingUrls > 0) {
        noNewUrlsDetails.push({ title: series.nome, reason: `nenhuma das ${newSeriesTotalIncomingUrls} URL(s) foi inserida` });
      }
      imported++;
    } catch (err) {
      console.error(`Error processing series ${series.nome}:`, err);
      errors++;
      errorReasons.push({ title: series.nome, reason: (err as Error).message || 'Erro desconhecido' });
    }
  }

  return { imported, skipped, errors, episodes_imported, urls_added, metadata_updated, skippedDetails, errorReasons, urlsAddedDetails, noNewUrlsDetails };
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
    const { batch } = body as { batch: SeriesInput[] };

    if (!batch || !Array.isArray(batch) || batch.length === 0) {
      return new Response(JSON.stringify({ error: "batch array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await processSeriesChunk(batch, supabase, tmdbApiKey);

    return new Response(
      JSON.stringify({
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors,
        episodes_imported: result.episodes_imported,
        urls_added: result.urls_added,
        metadata_updated: result.metadata_updated,
        skippedDetails: result.skippedDetails,
        errorReasons: result.errorReasons.slice(0, 100),
        urlsAddedDetails: result.urlsAddedDetails.slice(0, 100),
        noNewUrlsDetails: result.noNewUrlsDetails.slice(0, 100),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Fatal error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
