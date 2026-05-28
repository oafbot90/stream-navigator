import React, { useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Info, Star } from 'lucide-react';
import { CatalogMovie, moviesCatalogService } from '@/services/moviesCatalogService';
import { Button } from './ui/button';

const TMDB_API_KEY = "36f12a46be54f2d2f4b501cad2ea";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

interface TMDBExtra {
  backdrop_path: string | null;
  overview: string | null;
}

interface HeroSliderProps {
  items: CatalogMovie[];
}

const HeroSlider: React.FC<HeroSliderProps> = memo(({ items = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [tmdbData, setTmdbData] = useState<Record<string, TMDBExtra>>({});

  const minSwipeDistance = 50;

  // Fetch TMDB extra data (backdrop + overview) for all hero items
  useEffect(() => {
    if (!items.length) return;
    const fetchTmdbData = async () => {
      const results: Record<string, TMDBExtra> = {};
      await Promise.all(
        items.map(async (item) => {
          if (!item.tmdb_id) return;
          try {
            const res = await fetch(
              `${TMDB_BASE}/movie/${item.tmdb_id}?api_key=36f12a46be05ce54f2d2f4b501cad2ea&language=pt-BR`
            );
            if (res.ok) {
              const data = await res.json();
              results[item.id] = {
                backdrop_path: data.backdrop_path,
                overview: data.overview,
              };
            }
          } catch (e) {
            console.error('TMDB fetch error:', e);
          }
        })
      );
      setTmdbData(results);
    };
    fetchTmdbData();
  }, [items]);

  useEffect(() => {
    if (!items.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [items.length]);

  // Reset loaded state on slide change
  useEffect(() => {
    setIsLoaded(false);
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (!items.length) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const handleNext = useCallback(() => {
    if (!items.length) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) handleNext();
    else if (distance < -minSwipeDistance) handlePrev();
  }, [touchStart, touchEnd, handleNext, handlePrev]);

  if (!items || items.length === 0) {
    return (
      <div className="h-[55vh] sm:h-[65vh] md:h-[75vh] flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const extra = tmdbData[currentItem.id];
  const title = currentItem.title;
  const year = currentItem.release_date ? new Date(currentItem.release_date).getFullYear() : '';
  const backdropPath = extra?.backdrop_path || currentItem.backdrop_path;
  const backdropUrl = backdropPath
    ? `${IMG_BASE}/w1280${backdropPath}`
    : moviesCatalogService.getPosterUrl(currentItem.poster_path, 'original');
  const overview = extra?.overview || currentItem.overview;
  const rating = currentItem.vote_average ? Math.round(currentItem.vote_average * 10) / 10 : null;

  return (
    <div
      className="relative h-[55vh] sm:h-[65vh] md:h-[75vh] overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background image with smooth fade */}
      <div className="absolute inset-0">
        <img
          src={backdropUrl}
          alt={title}
          className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-60' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          loading="eager"
        />
        {/* Multi-layer gradient for cinematic look */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 h-full flex items-end pb-16 sm:pb-20 md:pb-24 relative z-10">
        <div className="max-w-2xl space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight line-clamp-2 drop-shadow-lg">
            {title}
          </h1>

          <div className="flex items-center gap-3 text-muted-foreground text-sm sm:text-base">
            {year && <span className="font-medium">{year}</span>}
            {rating && (
              <span className="flex items-center gap-1 text-yellow-400">
                <Star size={14} fill="currentColor" />
                <span className="font-semibold">{rating}</span>
              </span>
            )}
            {currentItem.genres?.slice(0, 2).map((g, i) => (
              <span key={i} className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-secondary/80 text-xs text-secondary-foreground">
                {g}
              </span>
            ))}
          </div>

          {overview && (
            <p className="text-muted-foreground text-sm sm:text-base line-clamp-2 sm:line-clamp-3 max-w-xl leading-relaxed">
              {overview}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Link to={`/player/movie/${currentItem.id}`}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl shadow-lg shadow-primary/20 h-10 sm:h-11 px-5 sm:px-6 text-sm sm:text-base font-semibold">
                <Play size={18} fill="currentColor" />
                Assistir
              </Button>
            </Link>
            <Link to={`/details/movie/${currentItem.id}`}>
              <Button variant="outline" size="lg" className="border-border/50 text-foreground hover:bg-secondary/50 gap-2 rounded-xl backdrop-blur-sm h-10 sm:h-11 px-5 sm:px-6 text-sm sm:text-base">
                <Info size={18} />
                Detalhes
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/40 hover:bg-background/60 backdrop-blur-sm text-foreground p-2 rounded-full z-20 hidden sm:flex items-center justify-center transition-colors"
        aria-label="Slide anterior"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/40 hover:bg-background/60 backdrop-blur-sm text-foreground p-2 rounded-full z-20 hidden sm:flex items-center justify-center transition-colors"
        aria-label="Próximo slide"
      >
        <ChevronRight size={22} />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-2 z-20">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            style={{ padding: 0 }}
            className={`rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-3 h-[3px] sm:w-6 sm:h-2 bg-primary sm:shadow-md sm:shadow-primary/40'
                : 'w-[6px] h-[3px] sm:w-2 sm:h-2 bg-foreground/30 hover:bg-foreground/50'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
});

HeroSlider.displayName = 'HeroSlider';

export default HeroSlider;
