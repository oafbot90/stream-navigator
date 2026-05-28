// API client for EmbedMovies.org
// Base URL: https://playerflixapi.com/

export const embedMoviesApi = {
    /**
     * Get a movie player URL by IMDB ID
     * @param imdbId The IMDB ID of the movie (e.g., tt0111161)
     * @returns The full URL for the movie player iframe
     */
    getMoviePlayerUrl: (imdbId: string): string => {
      return `https://playerflixapi.com/filme/${imdbId}`;
    },
  
    /**
     * Get a TV show player URL by TMDB ID, season number, and episode number
     * @param tmdbId The TMDB ID of the TV show (e.g., 1399)
     * @param season The season number
     * @param episode The episode number
     * @returns The full URL for the TV show player iframe
     */
    getTVShowPlayerUrl: (tmdbId: string, season: number, episode: number): string => {
      return `https://playerflixapi.com/serie/${tmdbId}/${season}/${episode}`;
    }
  };
