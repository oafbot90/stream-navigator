import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X, Loader2, Film, Tv } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import ContentCard from '@/components/ContentCard';
import { moviesCatalogService } from '@/services/moviesCatalogService';
import { seriesCatalogService } from '@/services/seriesCatalogService';

type Tab = 'movies' | 'series';

interface SearchResult {
  id: string;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string | null;
  type: 'movie' | 'tv';
}

const DEBOUNCE_MS = 350;

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'movies');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (searchQuery: string, t: Tab) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsLoading(true);
      if (t === 'movies') {
        const movies = await moviesCatalogService.searchMovies(searchQuery);
        setResults(movies.map(m => ({
          id: m.id,
          title: m.title,
          poster_path: m.poster_path,
          vote_average: m.vote_average,
          release_date: m.release_date,
          type: 'movie' as const,
        })));
      } else {
        const series = await seriesCatalogService.searchSeries(searchQuery);
        setResults(series.map(s => ({
          id: s.id,
          title: s.title,
          poster_path: s.poster_path,
          vote_average: s.vote_average,
          release_date: s.first_air_date,
          type: 'tv' as const,
        })));
      }
    } catch (error) {
      console.error('Erro ao realizar pesquisa:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao realizar pesquisa. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Debounced search as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length >= 1) {
      debounceRef.current = setTimeout(() => {
        setSearchParams(query.trim() ? { q: query.trim(), tab } : {}, { replace: true });
        performSearch(query.trim(), tab);
      }, DEBOUNCE_MS);
    } else {
      setResults([]);
      setSearchParams({}, { replace: true });
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, tab]);

  const switchTab = (newTab: Tab) => {
    if (newTab === tab) return;
    setTab(newTab);
    setResults([]);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearchParams({});
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-20 sm:pt-28 pb-24">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Buscar conteúdo</h1>
        <p className="text-muted-foreground text-sm mb-6">Encontre filmes e séries no catálogo</p>

        {/* Search Input */}
        <div className="mb-4 max-w-2xl mx-auto">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 pointer-events-none" />
            <input
              type="text"
              placeholder={tab === 'movies' ? 'Buscar filmes...' : 'Buscar séries...'}
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              className="w-full bg-card border border-border focus:border-primary text-foreground h-12 pl-12 pr-12 rounded-2xl outline-none focus:ring-2 focus:ring-primary/30 transition-all text-base"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLoading
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <X className="h-5 w-5" />
                }
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 max-w-2xl mx-auto mb-8">
          <button
            onClick={() => switchTab('movies')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
              tab === 'movies'
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Film className="h-4 w-4" /> Filmes
          </button>
          <button
            onClick={() => switchTab('series')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
              tab === 'series'
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Tv className="h-4 w-4" /> Séries
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center my-16 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Buscando...</p>
          </div>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <>
            <p className="text-muted-foreground text-sm mb-4">
              {results.length} resultado{results.length !== 1 ? 's' : ''} para{' '}
              <span className="text-foreground font-medium">"{query}"</span>
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
              {results.map(item => (
                <ContentCard
                  key={`${item.type}-${item.id}`}
                  id={item.id}
                  title={item.title}
                  posterPath={item.poster_path}
                  releaseDate={item.release_date}
                  voteAverage={item.vote_average}
                  type={item.type}
                />
              ))}
            </div>
          </>
        )}

        {/* No Results */}
        {!isLoading && query.trim().length >= 1 && results.length === 0 && (
          <div className="text-center my-16">
            <div className="text-5xl mb-4">😕</div>
            <h3 className="text-xl text-foreground font-semibold mb-2">Nenhum resultado</h3>
            <p className="text-muted-foreground text-sm">
              Nada encontrado para <span className="text-foreground">"{query}"</span>
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && query.trim().length === 0 && (
          <div className="text-center my-16">
            <div className="text-5xl mb-4 opacity-60">🔍</div>
            <h3 className="text-xl text-foreground font-semibold mb-1">O que você quer assistir?</h3>
            <p className="text-muted-foreground text-sm">Digite o nome do filme ou série</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search;
