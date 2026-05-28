// API client for PrimeVicio
// Base URL: https://www.primevicio.lat/

export const primeVicioApi = {
  getMoviePlayerUrl: (tmdbId: string): string => {
    return `https://www.primevicio.lat/embed/movie/${tmdbId}`;
  },

  getTVShowPlayerUrl: (tmdbId: string, season: number, episode: number): string => {
    return `https://www.primevicio.lat/embed/tv/${tmdbId}/${season}/${episode}`;
  }
};
