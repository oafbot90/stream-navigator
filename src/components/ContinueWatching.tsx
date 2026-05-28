import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContinueWatching } from '@/services/watchedContentService';
import { posterSizes } from '@/services/tmdbApi';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { Skeleton } from '@/components/ui/skeleton';

const ContinueWatching = memo(function ContinueWatching() {
  const { data: continueWatchingItems, isLoading } = useContinueWatching();
  const { user } = useAuth();
  const { currentProfile } = useProfiles();

  if (!user || !currentProfile) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-6 sm:mt-8 mb-8 sm:mb-12">
        <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Continuar Assistindo</h2>
        </div>
        <div className="flex overflow-x-auto gap-2.5 sm:gap-3 md:gap-4 pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[110px] sm:w-[140px] md:w-[180px]">
              <Skeleton className="w-full aspect-[2/3] rounded-md bg-muted" />
              <Skeleton className="h-3 w-3/4 mt-2 bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter out completed items (95%+ is considered complete)
  const activeItems = continueWatchingItems?.filter(item => 
    (item.progress_percent || 0) < 95
  ) || [];

  if (activeItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 sm:mt-8 mb-8 sm:mb-12">
      <div className="flex justify-between items-center mb-3 sm:mb-4 px-1">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Continuar Assistindo</h2>
        <Link to="/profile?tab=history">
          <Button variant="link" size="sm" className="text-superflix-text-muted hover:text-white text-xs sm:text-sm p-0 h-auto">
            Ver histórico
            <ChevronRight className="ml-0.5 sm:ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </Link>
      </div>

      {/* Scrollable content row - same style as ContentRow */}
      <div className="flex overflow-x-auto gap-2.5 sm:gap-3 md:gap-4 pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {activeItems.map((item) => {
          // Process poster path
          const imageUrl = item.poster_path
            ? item.poster_path.startsWith('http')
              ? item.poster_path
              : `${posterSizes.medium}${item.poster_path}`
            : '/placeholder.svg';

          // Determine display title
          let displayTitle = item.title || 'Título desconhecido';
          if (/^(Filme|Série)\s+tt\d+$/.test(displayTitle)) {
            displayTitle = 'Título desconhecido';
          }
          
          // Build player URL based on content type
          let playerUrl = '';
          if (item.content_type === 'movie') {
            playerUrl = `/player/movie/${item.content_id}`;
          } else {
            playerUrl = `/player/series/${item.content_id}`;
          }

          const progressPercent = item.progress_percent || 0;

          return (
            <div key={item.id} className="flex-shrink-0 w-[110px] sm:w-[140px] md:w-[180px] group">
              <Link to={playerUrl} className="block">
                <div className="relative overflow-hidden rounded-md aspect-[2/3] bg-superflix-dark">
                  <img
                    src={imageUrl}
                    alt={displayTitle}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800/80">
                    <div 
                      className="h-full bg-superflix-primary transition-all duration-300" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  
                  {/* Play button overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button size="sm" className="bg-superflix-primary hover:bg-superflix-primary/90 text-white gap-1.5">
                      <Play className="h-4 w-4" />
                      Continuar
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2 px-0.5">
                  <h3 className="text-white font-medium text-sm truncate">{displayTitle}</h3>
                  <div className="flex items-center text-xs text-superflix-text-muted mt-0.5">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>{progressPercent}% concluído</span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
});

ContinueWatching.displayName = 'ContinueWatching';

export default ContinueWatching;
