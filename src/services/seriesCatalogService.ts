import { supabase } from "@/integrations/supabase/client";
import { tmdbApi } from "@/services/tmdbApi";

export interface CatalogSeries {
  id: string;
  title: string;
  tmdb_id: number | null;
  poster_path: string | null;
  vote_average: number | null;
  vote_count: number | null;
  genres: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  // Extended fields (may not exist in DB, used for compatibility)
  original_title?: string | null;
  imdb_id?: string | null;
  overview?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string | null;
  last_air_date?: string | null;
  release_year?: number | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  status?: string | null;
  source?: string;
}

export interface SeriesEpisode {
  id: string;
  series_id: string;
  season_number: number;
  episode_number: number;
  title: string;
  created_at?: string | null;
  updated_at?: string | null;
  overview?: string | null;
  still_path?: string | null;
  air_date?: string | null;
  runtime?: number | null;
  has_dub?: boolean;
  has_leg?: boolean;
  source_url?: string | null;
  streams?: EpisodeStream[];
}

export interface EpisodeStream {
  id: string;
  episode_id: string;
  url: string;
  quality: string;
  stream_type: string;
}

const IMG_BASE = "https://image.tmdb.org/t/p";

export const seriesCatalogService = {
  // Filtra séries cuja data agendada ainda não chegou (suporta ausência da coluna)
  _isAvailable: (s: any) => {
    const t = s?.available_at;
    if (!t) return true;
    const ts = new Date(t).getTime();
    if (Number.isNaN(ts)) return true;
    return ts <= Date.now();
  },

  getSeries: async (page = 1, limit = 24) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from("series_catalog")
      .select("*", { count: "exact" })
      .order("vote_average", { ascending: false })
      .range(from, to);
    if (error) throw error;
    const series = (data as CatalogSeries[]).filter(seriesCatalogService._isAvailable);
    return { series, total: count || 0 };
  },

  // Smart search series - accent-insensitive, prioritizes phrase/exact matches
  searchSeries: async (query: string, limit = 40) => {
    const stripAccents = (s: string) =>
      (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const rawQuery = query.trim();
    const normalizedQuery = rawQuery.toLowerCase();
    const asciiQuery = stripAccents(rawQuery);
    const words = asciiQuery.split(/\s+/).filter(w => w.length >= 2);

    let merged: any[] = [];

    const { data: rpcData, error: rpcErr } = await (supabase as any)
      .rpc('search_series_unaccent', { q: asciiQuery, lim: limit * 2 });

    if (!rpcErr && rpcData) {
      merged = rpcData as any[];
    } else {
      const phraseConditions = [
        `title.ilike.%${normalizedQuery}%`,
        `original_name.ilike.%${normalizedQuery}%`,
      ];
      const { data: phraseData } = await supabase
        .from("series_catalog")
        .select("*")
        .or(phraseConditions.join(','))
        .limit(limit);

      let wordData: any[] = [];
      if (words.length > 1) {
        const wordConditions = words.map(w => `title.ilike.%${w}%`);
        const { data } = await supabase
          .from("series_catalog")
          .select("*")
          .or(wordConditions.join(','))
          .limit(limit * 2);
        wordData = data || [];
      }
      const map = new Map<string, any>();
      [...(phraseData || []), ...wordData].forEach(s => map.set(s.id, s));
      merged = Array.from(map.values());
    }

    const now = Date.now();
    const available = (merged as CatalogSeries[]).filter(
      (s: any) => !s.available_at || new Date(s.available_at).getTime() <= now
    );

    const results = available.map(series => {
      let score = 0;
      const titleAscii = stripAccents(series.title || '');
      const origAscii = stripAccents((series as any).original_name || '');
      if (titleAscii === asciiQuery || origAscii === asciiQuery) score += 1000;
      if (titleAscii.startsWith(asciiQuery)) score += 100;
      if (titleAscii.includes(asciiQuery) || origAscii.includes(asciiQuery)) score += 50;
      words.forEach(word => {
        if (titleAscii.includes(word)) score += 10;
      });
      return { series, score };
    });

    return results
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.series);
  },

  getSeriesById: async (seriesId: string) => {
    const { data, error } = await supabase
      .from("series_catalog")
      .select("*")
      .eq("id", seriesId)
      .single();
    if (error) throw error;
    return data as CatalogSeries;
  },

  getSeriesByTmdbId: async (tmdbId: number) => {
    const { data, error } = await supabase
      .from("series_catalog")
      .select("*")
      .eq("tmdb_id", tmdbId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as CatalogSeries) || null;
  },

  getEpisodes: async (seriesId: string) => {
    // Fetch episodes and series in parallel
    const [episodesRes, seriesRes] = await Promise.all([
      supabase
        .from("series_episodes")
        .select("*")
        .eq("series_id", seriesId)
        .order("season_number", { ascending: true })
        .order("episode_number", { ascending: true }),
      supabase
        .from("series_catalog")
        .select("tmdb_id")
        .eq("id", seriesId)
        .single(),
    ]);
    if (episodesRes.error) throw episodesRes.error;
    const episodes = episodesRes.data as SeriesEpisode[];
    const tmdbId = seriesRes.data?.tmdb_id;

    // Enrich episodes without still_path using TMDB
    if (tmdbId) {
      const missingStills = episodes.filter(ep => !ep.still_path);
      if (missingStills.length > 0) {
        // Group by season to minimize API calls
        const seasonNumbers = [...new Set(missingStills.map(ep => ep.season_number))];
        const seasonDataMap = new Map<number, any[]>();

        await Promise.all(
          seasonNumbers.map(async (season) => {
            try {
              const seasonData = await tmdbApi.getSeasonDetails(tmdbId, season);
              if (seasonData?.episodes) {
                seasonDataMap.set(season, seasonData.episodes);
              }
            } catch {
              // Ignore TMDB errors silently
            }
          })
        );

        // Apply still_path from TMDB data
        for (const ep of episodes) {
          if (!ep.still_path) {
            const tmdbEpisodes = seasonDataMap.get(ep.season_number);
            if (tmdbEpisodes) {
              const tmdbEp = tmdbEpisodes.find((te: any) => te.episode_number === ep.episode_number);
              if (tmdbEp?.still_path) {
                ep.still_path = tmdbEp.still_path;
              }
            }
          }
        }
      }
    }

    return episodes;
  },

  getEpisodeWithStreams: async (episodeId: string) => {
    const [epRes, streamsRes] = await Promise.all([
      supabase.from("series_episodes").select("*").eq("id", episodeId).single(),
      supabase.from("episode_streams").select("*").eq("episode_id", episodeId),
    ]);
    if (epRes.error) throw epRes.error;
    const episode = epRes.data as SeriesEpisode;
    episode.streams = (streamsRes.data || []) as EpisodeStream[];
    return episode;
  },

  getPosterUrl: (path: string | null, size = "w500") => {
    if (!path) return "/placeholder.svg";
    if (path.startsWith("http")) return path;
    return `${IMG_BASE}/${size}${path}`;
  },

  getBackdropUrl: (path: string | null, size = "original") => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${IMG_BASE}/${size}${path}`;
  },

  getStillUrl: (path: string | null, size = "w300") => {
    if (!path) return "/placeholder.svg";
    if (path.startsWith("http")) return path;
    return `${IMG_BASE}/${size}${path}`;
  },
};
