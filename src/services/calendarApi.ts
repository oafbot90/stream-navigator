// SuperFlixAPI Calendar Service

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

// Raw API response structure
interface CalendarApiItem {
  title: string;
  episode: string;
  season: number;
  number: number;
  air_date: string;
  type: number; // 2 = série, 3 = anime
  tmdb_id: string;
  imdb_id: string;
  poster: string;
  backdrop: string;
  status: 'Atualizado' | 'Hoje' | 'Futuro' | 'Atrasado';
}

// Normalized structure for the app
export interface CalendarItem {
  title: string;
  episode_title: string;
  episode_number: number;
  air_date: string;
  poster_path: string;
  backdrop_path: string;
  season_number: number;
  tmdb_id: number;
  imdb_id: string;
  status: 'Atualizado' | 'Hoje' | 'Futuro' | 'Atrasado';
  content_type: 'tv' | 'anime' | 'movie' | 'event';
}

// Cache for API responses
let cachedData: CalendarItem[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const normalizeItem = (item: CalendarApiItem): CalendarItem => {
  return {
    title: item.title,
    episode_title: item.episode,
    episode_number: item.number,
    air_date: item.air_date,
    poster_path: item.poster ? `${TMDB_IMAGE_BASE}${item.poster}` : '',
    backdrop_path: item.backdrop ? `${TMDB_BACKDROP_BASE}${item.backdrop}` : '',
    season_number: item.season,
    tmdb_id: parseInt(item.tmdb_id) || 0,
    imdb_id: item.imdb_id,
    status: item.status,
    content_type: item.type === 3 ? 'anime' : 'tv',
  };
};

export const calendarApi = {
  getCalendar: async (forceRefresh = false): Promise<CalendarItem[]> => {
    const now = Date.now();
    
    // Return cached data if still valid
    if (!forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedData;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch('https://superflixapi.cv/calendario.php', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }
      
      const data: CalendarApiItem[] = await response.json();
      const normalizedData = Array.isArray(data) 
        ? data.map(normalizeItem)
        : [];
      
      // Update cache
      cachedData = normalizedData;
      cacheTimestamp = now;
      
      return normalizedData;
    } catch (error) {
      console.error('Error fetching calendar:', error);
      // Return cached data if available, even if stale
      if (cachedData) {
        return cachedData;
      }
      return [];
    }
  },

  // Group items by date
  groupByDate: (items: CalendarItem[]): Record<string, CalendarItem[]> => {
    return items.reduce((acc, item) => {
      const date = item.air_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as Record<string, CalendarItem[]>);
  },

  // Group items by status
  groupByStatus: (items: CalendarItem[]): Record<string, CalendarItem[]> => {
    return items.reduce((acc, item) => {
      const status = item.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(item);
      return acc;
    }, {} as Record<string, CalendarItem[]>);
  },

  // Clear cache
  clearCache: () => {
    cachedData = null;
    cacheTimestamp = 0;
  }
};
