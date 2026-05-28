import React, { useCallback, memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { moviesCatalogService } from '@/services/moviesCatalogService';
import { useAdClick } from '@/components/AdManager';
import { tmdbApi } from '@/services/tmdbApi';

interface ContentCardProps {
  id: string | number;
  title: string;
  posterPath?: string | null;
  rating?: number;
  voteAverage?: number;
  releaseDate?: string | null;
  type: 'movie' | 'tv';
  overview?: string;
  onClick?: () => void;
}

// Cache de anos buscados do TMDB (memória + sessionStorage)
const yearMemoryCache = new Map<string, string>();
const getCachedYear = (key: string): string | undefined => {
  if (yearMemoryCache.has(key)) return yearMemoryCache.get(key);
  try {
    const v = sessionStorage.getItem(`tmdb_year_${key}`);
    if (v) { yearMemoryCache.set(key, v); return v; }
  } catch {}
  return undefined;
};
const setCachedYear = (key: string, value: string) => {
  yearMemoryCache.set(key, value);
  try { sessionStorage.setItem(`tmdb_year_${key}`, value); } catch {}
};

const ContentCard: React.FC<ContentCardProps> = memo(({
  id,
  title,
  posterPath,
  rating,
  voteAverage,
  releaseDate,
  type,
  overview,
  onClick
}) => {
  const navigate = useNavigate();
  const { triggerAd } = useAdClick();
  
  const handleClick = useCallback(() => {
    if (onClick) {
      triggerAd(onClick);
    } else {
      triggerAd(() => navigate(`/details/${type}/${id}`));
    }
  }, [onClick, navigate, type, id, triggerAd]);
  
  
  
  const posterUrl = moviesCatalogService.getPosterUrl(posterPath || null, 'w342');
  
  const initialYear = releaseDate ? String(new Date(releaseDate).getFullYear()) : (getCachedYear(`${type}-${id}`) || '');
  const [releaseYear, setReleaseYear] = useState<string>(initialYear);
  const displayRating = voteAverage || rating;

  // Fallback: busca o ano no TMDB quando não temos releaseDate
  useEffect(() => {
    if (releaseYear) return;
    const numericId = Number(id);
    if (!numericId || Number.isNaN(numericId)) return;
    let cancelled = false;
    (async () => {
      try {
        const data = type === 'movie'
          ? await tmdbApi.getMovieDetails(numericId)
          : await tmdbApi.getTVShowDetails(numericId);
        const date = data?.release_date || data?.first_air_date;
        if (date && !cancelled) {
          const y = String(new Date(date).getFullYear());
          setCachedYear(`${type}-${id}`, y);
          setReleaseYear(y);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [id, type, releaseYear]);

  
  return (
    <div 
      className="group relative bg-card rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl flex-shrink-0 w-[110px] sm:w-[140px] md:w-[180px]"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Ver detalhes de ${title}`}
    >
      <div className="aspect-[2/3] relative">
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity duration-300" />
        
        
        
        {displayRating && displayRating > 0 && (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-black/70 rounded px-1.5 py-0.5 sm:px-2 sm:py-1 flex items-center gap-0.5 sm:gap-1">
            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-400 fill-current" />
            <span className="text-white text-[10px] sm:text-xs font-medium">
              {Math.round(displayRating * 10) / 10}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-1.5 sm:p-2 md:p-3">
        <h3 className="text-foreground font-medium text-[11px] sm:text-xs md:text-sm line-clamp-2">
          {title}
        </h3>
      </div>
    </div>
  );
});

ContentCard.displayName = 'ContentCard';

export default ContentCard;
