import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import ContentCard from '@/components/ContentCard';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { moviesCatalogService, CatalogMovie } from '@/services/moviesCatalogService';
import { useProfiles } from '@/contexts/ProfileContext';
import { supabase } from '@/integrations/supabase/client';

const KIDS_GENRE_FILTER = 'genres.cs.{Família},genres.cs.{Family},genres.cs.{Animação},genres.cs.{Animation},genres.cs.{Kids}';

const MoviesList: React.FC = () => {
  const { currentProfile } = useProfiles();
  const { toast } = useToast();
  const [movies, setMovies] = useState<CatalogMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const limit = 24;
  
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const isKids = currentProfile?.is_kids_profile;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        if (isKids) {
          // Query directly with genre filter for kids — server-side filtering
          const { data, error: dbError, count } = await supabase
            .from('movies_catalog')
            .select('*', { count: 'exact' })
            .or(KIDS_GENRE_FILTER)
            .order('vote_average', { ascending: false })
            .range(from, to);

          if (dbError) throw dbError;
          setMovies((data || []) as CatalogMovie[]);
          setTotalPages(Math.max(1, Math.ceil((count || 0) / limit)));
        } else {
          const response = await moviesCatalogService.getMovies(page, limit);
          setMovies(response.movies);
          setTotalPages(Math.max(1, Math.ceil((response.total || response.movies.length) / limit)));
        }
      } catch (error) {
        console.error('Erro ao buscar filmes:', error);
        setError("Falha ao carregar filmes.");
        toast({
          title: 'Erro',
          description: 'Falha ao carregar filmes. Tente novamente mais tarde.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMovies();
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
          <h1 className="text-3xl font-bold text-foreground mb-8">Filmes</h1>
          <div className="text-center max-w-lg mx-auto">
            <p className="text-muted-foreground mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
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
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {currentProfile?.is_kids_profile ? '🧸 Filmes Infantis' : '🎬 Filmes'}
          </h1>
          <span className="text-xs sm:text-sm text-muted-foreground">{movies.length > 0 ? `Página ${page}` : ''}</span>
        </div>
        
        {!isLoading && movies.length === 0 && (
          <div className="text-center my-16">
            <p className="text-muted-foreground text-lg">
              {currentProfile?.is_kids_profile
                ? 'Nenhum filme infantil encontrado no momento.'
                : 'Nenhum filme encontrado no catálogo.'}
            </p>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {movies.map(movie => (
                <ContentCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  posterPath={movie.poster_path}
                  releaseDate={movie.release_date}
                  voteAverage={movie.vote_average}
                  type="movie"
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
                  <div className="text-muted-foreground px-4">
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

export default MoviesList;
