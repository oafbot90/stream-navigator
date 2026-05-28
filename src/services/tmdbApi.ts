import { toast } from "@/components/ui/use-toast";

// Base configuration for TMDB API
const API_KEY = "36f12a46be05ce54f2d2f4b501cad2ea";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE_URL = "https://image.tmdb.org/t/p";
const LANGUAGE = "pt-BR"; // Definindo o idioma para português do Brasil

// Image sizes
export const posterSizes = {
  small: `${IMG_BASE_URL}/w185`,
  medium: `${IMG_BASE_URL}/w342`,
  large: `${IMG_BASE_URL}/w500`,
  original: `${IMG_BASE_URL}/original`,
};

export const backdropSizes = {
  small: `${IMG_BASE_URL}/w300`,
  medium: `${IMG_BASE_URL}/w780`,
  large: `${IMG_BASE_URL}/w1280`,
  original: `${IMG_BASE_URL}/original`,
};

// Types for TMDB responses
export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  overview: string;
  vote_average: number;
  genre_ids: number[];
  genres?: Genre[];
  imdb_id?: string;
  runtime?: number;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  overview: string;
  vote_average: number;
  genre_ids: number[];
  genres?: Genre[];
  external_ids?: {
    imdb_id?: string;
  };
  number_of_seasons?: number;
  seasons?: Season[];
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  overview: string;
  air_date: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
  vote_average: number;
  runtime?: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface SearchResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  poster_path: string | null;
  profile_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
}

export interface TMDBResponse<T> {
  results: T[];
  page: number;
  total_pages: number;
  total_results: number;
}

// Helper function to make API requests
async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", API_KEY);
  url.searchParams.append("language", LANGUAGE); // Adicionando o parâmetro de idioma
  
  // Add any additional parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    console.log(`Requisição TMDB: ${url.toString()}`);
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json;charset=utf-8'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na API TMDB: Status ${response.status}, Resposta: ${errorText}`);
      throw new Error(`Erro na API TMDB: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Resposta recebida:", data);
    return data;
  } catch (error) {
    console.error("Erro ao buscar dados da TMDB:", error);
    return null;
  }
}

// API functions
export const tmdbApi = {
  // Get trending movies
  getTrendingMovies: async () => {
    const data = await fetchFromTMDB("/trending/movie/week");
    return data?.results as TMDBMovie[];
  },
  
  // Get popular movies with pagination
  getPopularMovies: async (page: number = 1) => {
    const data = await fetchFromTMDB("/movie/popular", { page: page.toString() });
    return data as TMDBResponse<TMDBMovie>;
  },
  
  // Get popular TV shows with pagination
  getPopularTVShows: async (page: number = 1) => {
    const data = await fetchFromTMDB("/tv/popular", { page: page.toString() });
    return data as TMDBResponse<TMDBTVShow>;
  },
  
  // Get popular anime with pagination
  getPopularAnime: async (page: number = 1) => {
    const data = await fetchFromTMDB("/discover/tv", {
      with_genres: "16", // Animation genre ID
      sort_by: "popularity.desc",
      page: page.toString()
    });
    return data as TMDBResponse<TMDBTVShow>;
  },
  
  // Get movie details
  getMovieDetails: async (id: number) => {
    const data = await fetchFromTMDB(`/movie/${id}`, { append_to_response: "videos,credits,similar" });
    if (!data) return null;
    return { ...data, media_type: 'movie' };
  },
  
  // Get TV show details
  getTVShowDetails: async (id: number) => {
    const data = await fetchFromTMDB(`/tv/${id}`, { append_to_response: "videos,credits,similar,seasons" });
    if (!data) return null;
    return { ...data, media_type: 'tv' };
  },

  // Get season details
  getSeasonDetails: async (tvId: number, seasonNumber: number) => {
    return await fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}`);
  },

  // Get episode details
  getEpisodeDetails: async (tvId: number, seasonNumber: number, episodeNumber: number) => {
    return await fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
  },
  
  // Search for movies, TV shows and people
  searchContent: async (query: string, page = 1) => {
    const data = await fetchFromTMDB("/search/multi", { 
      query: encodeURIComponent(query),
      page: page.toString()
    });
    if (!data || !data.results) return { results: [], total_pages: 0 };
    return {
      results: data.results.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv' || item.media_type === 'person'),
      total_pages: data.total_pages || 0
    };
  },
  
  // Get movies by genre
  getMoviesByGenre: async (genreId: number) => {
    const data = await fetchFromTMDB("/discover/movie", { with_genres: genreId.toString() });
    if (!data || !data.results) return [];
    return data.results.map((movie: any) => ({ ...movie, media_type: 'movie' }));
  },
  
  // Get TV shows by genre
  getTVShowsByGenre: async (genreId: number) => {
    const data = await fetchFromTMDB("/discover/tv", { with_genres: genreId.toString() });
    if (!data || !data.results) return [];
    return data.results.map((show: any) => ({ ...show, media_type: 'tv' }));
  },
  
  // Helper functions for getting titles and dates consistently
  getTitle: (item: TMDBMovie | TMDBTVShow): string => {
    return (item as TMDBMovie).title || (item as TMDBTVShow).name || '';
  },
  
  getReleaseDate: (item: TMDBMovie | TMDBTVShow): string => {
    return (item as TMDBMovie).release_date || (item as TMDBTVShow).first_air_date || '';
  },

  // ✅ Adicionado: Buscar conteúdo pelo IMDb ID (ex: tt1234567)
findByImdbId: async (imdbId: string) => {
  const data = await fetchFromTMDB(`/find/${imdbId}`, {
    external_source: 'imdb_id'
  });
  return data;
}
};
