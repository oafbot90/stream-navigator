import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import ContentCard from '@/components/ContentCard';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { seriesCatalogService, CatalogSeries } from '@/services/seriesCatalogService';
import { useProfiles } from '@/contexts/ProfileContext';
import { supabase } from '@/integrations/supabase/client';

const KIDS_GENRE_FILTER = 'genres.cs.{Família},genres.cs.{Family},genres.cs.{Animação},genres.cs.{Animation},genres.cs.{Kids}';

const TVShowsList: React.FC = () => {
  const { currentProfile } = useProfiles();
  const { toast } = useToast();
  const [series, setSeries] = useState<CatalogSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const limit = 24;

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const isKids = currentProfile?.is_kids_profile;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        if (isKids) {
          const { data, error: dbError, count } = await supabase
            .from('series_catalog')
            .select('*', { count: 'exact' })
            .or(KIDS_GENRE_FILTER)
            .order('vote_average', { ascending: false })
            .range(from, to);

          if (dbError) throw dbError;
          setSeries((data || []) as CatalogSeries[]);
          setTotalPages(Math.max(1, Math.ceil((count || 0) / limit)));
        } else {
          const response = await seriesCatalogService.getSeries(page, limit);
          setSeries(response.series);
          setTotalPages(Math.max(1, Math.ceil((response.total || response.series.length) / limit)));
        }
      } catch (err) {
        console.error('Erro ao buscar séries:', err);
        setError("Falha ao carregar séries.");
        toast({ title: 'Erro', description: 'Falha ao carregar séries.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSeries();
  }, [toast, page, currentProfile?.is_kids_profile]);

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (error && !isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 pt-20 sm:pt-32 pb-16 flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8">Séries</h1>
          <div className="text-center max-w-lg mx-auto">
            <p className="text-muted-foreground mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Tentar novamente
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-20 sm:pt-32 pb-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8">
          {currentProfile?.is_kids_profile ? '🧸 Séries Infantis' : 'Séries'}
        </h1>
        {!isLoading && series.length === 0 && (
          <div className="text-center my-16">
            <p className="text-muted-foreground text-lg">
              {currentProfile?.is_kids_profile
                ? 'Nenhuma série infantil encontrada no momento.'
                : 'Nenhuma série encontrada no catálogo.'}
            </p>
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : series.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {series.map(show => (
                <ContentCard
                  key={show.id}
                  id={show.id}
                  title={show.title}
                  posterPath={show.poster_path}
                  releaseDate={show.first_air_date}
                  voteAverage={show.vote_average}
                  type="tv"
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
                  <div className="text-muted-foreground px-4">Página {page} de {totalPages}</div>
                </PaginationItem>
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext onClick={handleNextPage}>Próximo</PaginationNext>
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default TVShowsList;
