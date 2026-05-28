import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Play, Film } from 'lucide-react';
import Layout from '@/components/Layout';
import { getMarathonDetails, getMarathonItems } from '@/services/marathonService';
import { Skeleton } from '@/components/ui/skeleton';

export default function MarathonDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: marathon, isLoading: loadingMarathon } = useQuery({
    queryKey: ['marathon', id],
    queryFn: () => getMarathonDetails(id!),
    enabled: !!id,
  });

  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: ['marathon_items', id],
    queryFn: () => getMarathonItems(id!),
    enabled: !!id,
  });

  const isLoading = loadingMarathon || loadingItems;

  if (isLoading) {
    return (
      <Layout>
        <div className="pt-24 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
          <Skeleton className="w-full h-[40vh] rounded-2xl mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full rounded-xl" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!marathon) {
    return (
      <Layout>
        <div className="pt-24 px-4 text-center min-h-screen">
          <h1 className="text-2xl font-semibold mb-4">Maratona não encontrada.</h1>
          <Link to="/marathons" className="text-primary hover:underline inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Maratonas
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Banner Hero */}
      <div className="relative w-full h-[50vh] md:h-[60vh] flex items-end pb-12 pt-24 px-4 md:px-8">
        {marathon.backdrop_path ? (
          <>
            <div className="absolute inset-0">
              <img 
                src={`https://image.tmdb.org/t/p/original${marathon.backdrop_path}`}
                alt={marathon.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-muted/30" />
        )}
        
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <Link to="/marathons" className="inline-flex items-center text-muted-foreground hover:text-white mb-6 transition-colors bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para coleções
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-md">{marathon.title}</h1>
          {marathon.description && (
            <p className="text-lg text-gray-200 max-w-2xl mb-6 drop-shadow">{marathon.description}</p>
          )}
        </div>
      </div>

      {/* Items Grid */}
      <div className="px-4 md:px-8 max-w-7xl mx-auto pb-20 mt-8 relative z-20 min-h-[40vh]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Film className="w-6 h-6 text-primary" /> Conteúdos da Coleção ({items?.length || 0})
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {items?.map((item, index) => (
            <Link 
              key={item.id}
              to={`/details/${item.content_type}/${item.content_id}`}
              className="group relative flex flex-col gap-3"
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-border/50 group-hover:border-primary/50 transition-all shadow-md group-hover:shadow-primary/20 group-hover:-translate-y-1">
                {/* Badge com número da ordem */}
                <div className="absolute top-2 left-2 z-20 bg-primary text-primary-foreground font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg">
                  {index + 1}
                </div>
                
                {item.poster_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">Sem Poster</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg scale-75 group-hover:scale-100 duration-300" fill="currentColor" />
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1 block">
                  {item.content_type === 'movie' ? 'Filme' : 'Série'}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {items?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-2xl border border-border/50">
            <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum título foi adicionado a esta coleção ainda.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
