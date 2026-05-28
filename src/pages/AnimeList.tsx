import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import ContentCard from '@/components/ContentCard';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';
import { CatalogMovie } from '@/services/moviesCatalogService';
import { CatalogSeries } from '@/services/seriesCatalogService';

interface AnimeItem {
  id: string;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string | null;
  type: 'movie' | 'tv';
}

const LIMIT = 24;

const AnimeList: React.FC = () => {
  const { toast } = useToast();
  const [animes, setAnimes] = useState<AnimeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        setIsLoading(true);

        // Fetch anime movies and anime series in parallel
        // Fetch anime content (Animação) but exclude kids/family content
        const [moviesRes, seriesRes] = await Promise.all([
          supabase
            .from('movies_catalog')
            .select('*', { count: 'exact' })
            .contains('genres', ['Animação'])
            .order('vote_average', { ascending: false }),
          supabase
            .from('series_catalog')
            .select('*', { count: 'exact' })
            .contains('genres', ['Animação'])
            .order('vote_average', { ascending: false }),
        ]);

        // Filter out kids/family content from anime results
        const isNotKids = (genres: string[] | null) => {
          if (!genres) return true;
          return !genres.includes('Família') && !genres.includes('Kids');
        };

        const movies: AnimeItem[] = ((moviesRes.data || []) as CatalogMovie[])
          .filter(m => isNotKids(m.genres))
          .map(m => ({
            id: m.id,
            title: m.title,
            poster_path: m.poster_path,
            vote_average: m.vote_average,
            release_date: m.release_date,
            type: 'movie' as const,
          }));

        const series: AnimeItem[] = ((seriesRes.data || []) as CatalogSeries[])
          .filter(s => isNotKids(s.genres))
          .map(s => ({
            id: s.id,
          title: s.title,
          poster_path: s.poster_path,
          vote_average: s.vote_average,
          release_date: s.first_air_date,
          type: 'tv' as const,
        }));

        // Merge and sort by vote_average
        const all = [...movies, ...series].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        setTotalItems(all.length);

        // Paginate
        const from = (page - 1) * LIMIT;
        setAnimes(all.slice(from, from + LIMIT));
      } catch (error) {
        console.error('Erro ao buscar animes:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar animes. Tente novamente mais tarde.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnimes();
  }, [toast, page]);

  const totalPages = Math.max(1, Math.ceil(totalItems / LIMIT));

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(p => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-20 sm:pt-32 pb-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8">Animes</h1>

        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-superflix-primary"></div>
          </div>
        ) : animes.length === 0 ? (
          <div className="text-center my-16">
            <p className="text-superflix-text-muted">Nenhum anime encontrado no catálogo.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {animes.map(anime => (
                <ContentCard
                  key={anime.id}
                  id={anime.id}
                  title={anime.title}
                  posterPath={anime.poster_path}
                  releaseDate={anime.release_date}
                  voteAverage={anime.vote_average}
                  type={anime.type}
                />
              ))}
            </div>

            <Pagination className="mt-8">
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious onClick={handlePreviousPage}>Anterior</PaginationPrevious>
                  </PaginationItem>
                )}
                <PaginationItem>
                  <div className="text-superflix-text-muted px-4">
                    Página {page} de {totalPages}
                  </div>
                </PaginationItem>
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext onClick={handleNextPage}>Próximo</PaginationNext>
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </>
        )}
      </div>
    </Layout>
  );
};

export default AnimeList;
