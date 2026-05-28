import { supabase } from "@/integrations/supabase/client";

export interface CatalogMovie {
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
  release_date?: string | null;
  release_year?: number | null;
  runtime?: number | null;
  content_type?: string;
  source?: string;
  streams?: MovieStream[];
}

export interface MovieStream {
  id: string;
  movie_id: string;
  url: string;
  quality: string;
  stream_type: string;
}

const IMG_BASE = "https://image.tmdb.org/t/p";

export const catalogPosterSizes = {
  small: `${IMG_BASE}/w185`,
  medium: `${IMG_BASE}/w342`,
  large: `${IMG_BASE}/w500`,
  original: `${IMG_BASE}/original`,
};

export const catalogBackdropSizes = {
  small: `${IMG_BASE}/w300`,
  medium: `${IMG_BASE}/w780`,
  large: `${IMG_BASE}/w1280`,
  original: `${IMG_BASE}/original`,
};

export const moviesCatalogService = {
  // Filtro de disponibilidade: itens sem available_at OU já disponíveis
  _availabilityFilter: 'available_at.is.null,available_at.lte.' + new Date().toISOString(),

  // Filtra itens cuja data agendada ainda não chegou (suporta ausência da coluna)
  _isAvailable: (m: any) => {
    const t = m?.available_at;
    if (!t) return true;
    const ts = new Date(t).getTime();
    if (Number.isNaN(ts)) return true;
    return ts <= Date.now();
  },

  // Get movies with pagination (only those with streams)
  getMovies: async (page = 1, limit = 20) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("movies_catalog")
      .select("*", { count: "exact" })
      .order("vote_average", { ascending: false })
      .range(from, to);

    if (error) throw error;
    const movies = (data as CatalogMovie[]).filter(moviesCatalogService._isAvailable);
    return { movies, total: count || 0 };
  },

  // Get hero/featured movies - prefer curated slider, fallback to top rated
  getHeroMovies: async (limit = 5) => {
    // First try curated slider
    const { data: sliderData, error: sliderError } = await supabase
      .from("hero_slider")
      .select("movie_id")
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(limit);

    if (!sliderError && sliderData && sliderData.length > 0) {
      const movieIds = sliderData.map((s: any) => s.movie_id);
      const { data: movies, error: moviesError } = await supabase
        .from("movies_catalog")
        .select("*")
        .in("id", movieIds);

      if (!moviesError && movies && movies.length > 0) {
        const available = (movies as any[]).filter(moviesCatalogService._isAvailable);
        const sorted = movieIds
          .map(id => available.find((m: any) => m.id === id))
          .filter(Boolean) as CatalogMovie[];
        if (sorted.length > 0) return sorted;
      }
    }

    // Fallback to top rated
    const { data, error } = await supabase
      .from("movies_catalog")
      .select("*")
      .not("poster_path", "is", null)
      .order("vote_average", { ascending: false })
      .limit(limit * 2);

    if (error) throw error;
    return (data as CatalogMovie[]).filter(moviesCatalogService._isAvailable).slice(0, limit);
  },

  // Get popular movies
  getPopularMovies: async (page = 1, limit = 20) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("movies_catalog")
      .select("*", { count: "exact" })
      .order("vote_count", { ascending: false })
      .range(from, to);

    if (error) throw error;
    const movies = (data as CatalogMovie[]).filter(moviesCatalogService._isAvailable);
    return { movies, total: count || 0 };
  },

  // Get recently added movies (ordered by updated_at so manually-added items also appear)
  getRecentMovies: async (limit = 20) => {
    const { data, error } = await supabase
      .from("movies_catalog")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit * 2);

    if (error) throw error;
    return (data as CatalogMovie[]).filter(moviesCatalogService._isAvailable).slice(0, limit);
  },

  // Smart search movies by title - accent-insensitive, prioritizes phrase/exact matches
  searchMovies: async (query: string, limit = 40) => {
    const stripAccents = (s: string) =>
      (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const rawQuery = query.trim();
    const normalizedQuery = rawQuery.toLowerCase();
    const asciiQuery = stripAccents(rawQuery);
    const words = asciiQuery.split(/\s+/).filter(w => w.length >= 2);

    let merged: any[] = [];

    // 1) Tenta RPC unaccent (busca sem acentos no servidor)
    const { data: rpcData, error: rpcErr } = await (supabase as any)
      .rpc('search_movies_unaccent', { q: asciiQuery, lim: limit * 2 });

    if (!rpcErr && rpcData) {
      merged = rpcData as any[];
    } else {
      // 2) Fallback: ilike normal (com acento) + word-based
      const phraseConditions = [
        `title.ilike.%${normalizedQuery}%`,
        `original_title.ilike.%${normalizedQuery}%`,
      ];
      const { data: phraseData } = await supabase
        .from("movies_catalog")
        .select("*")
        .or(phraseConditions.join(','))
        .limit(limit);

      let wordData: any[] = [];
      if (words.length > 1) {
        const wordConditions = words.map(w => `title.ilike.%${w}%`);
        const { data } = await supabase
          .from("movies_catalog")
          .select("*")
          .or(wordConditions.join(','))
          .limit(limit * 2);
        wordData = data || [];
      }
      const map = new Map<string, any>();
      [...(phraseData || []), ...wordData].forEach(m => map.set(m.id, m));
      merged = Array.from(map.values());
    }

    const now = Date.now();
    const available = (merged as CatalogMovie[]).filter(
      (m: any) => !m.available_at || new Date(m.available_at).getTime() <= now
    );

    const results = available.map(movie => {
      let score = 0;
      const titleAscii = stripAccents(movie.title || '');
      const origAscii = stripAccents((movie as any).original_title || '');
      if (titleAscii === asciiQuery || origAscii === asciiQuery) score += 1000;
      if (titleAscii.startsWith(asciiQuery)) score += 100;
      if (titleAscii.includes(asciiQuery) || origAscii.includes(asciiQuery)) score += 50;
      words.forEach(word => {
        if (titleAscii.includes(word)) score += 10;
      });
      return { movie, score };
    });

    return results
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.movie);
  },

  // Get movie by ID with streams
  getMovieWithStreams: async (movieId: string) => {
    const [movieRes, streamsRes] = await Promise.all([
      supabase.from("movies_catalog").select("*").eq("id", movieId).single(),
      supabase.from("movie_streams").select("*").eq("movie_id", movieId),
    ]);

    if (movieRes.error) throw movieRes.error;
    const movie = movieRes.data as CatalogMovie;
    movie.streams = (streamsRes.data || []) as MovieStream[];
    return movie;
  },

  // Get movie by TMDB ID with streams
  getMovieByTmdbId: async (tmdbId: number) => {
    const { data, error } = await supabase
      .from("movies_catalog")
      .select("*")
      .eq("tmdb_id", tmdbId)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const { data: streams } = await supabase
      .from("movie_streams")
      .select("*")
      .eq("movie_id", data.id);

    const movie = data as CatalogMovie;
    movie.streams = (streams || []) as MovieStream[];
    return movie;
  },

  // Get poster URL
  getPosterUrl: (posterPath: string | null, size: "w185" | "w342" | "w500" | "original" = "w500") => {
    if (!posterPath) return "/placeholder.svg";
    if (posterPath.startsWith("http")) return posterPath;
    return `${IMG_BASE}/${size}${posterPath}`;
  },

  // Get backdrop URL
  getBackdropUrl: (backdropPath: string | null, size: "w300" | "w780" | "w1280" | "original" = "original") => {
    if (!backdropPath) return null;
    if (backdropPath.startsWith("http")) return backdropPath;
    return `${IMG_BASE}/${size}${backdropPath}`;
  },
};
