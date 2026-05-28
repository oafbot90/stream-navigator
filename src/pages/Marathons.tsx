import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Library } from 'lucide-react';
import Layout from '@/components/Layout';
import { getMarathons, getMarathonItems } from '@/services/marathonService';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfiles } from '@/contexts/ProfileContext';
import { supabase } from '@/integrations/supabase/client';

const KIDS_GENRES = ['Família', 'Family', 'Kids', 'Animação', 'Animation'];

async function filterKidsMarathons(marathons: any[]) {
  // Para cada maratona, verifica se TODOS os itens são de gênero infantil.
  const checks = await Promise.all(
    marathons.map(async (m) => {
      const items = await getMarathonItems(m.id);
      if (!items.length) return null;
      const movieIds = items.filter(i => i.content_type === 'movie').map(i => i.content_id);
      const seriesIds = items.filter(i => i.content_type === 'series').map(i => i.content_id);

      const [movieRes, seriesRes] = await Promise.all([
        movieIds.length ? supabase.from('movies_catalog').select('id, genres').in('id', movieIds) : Promise.resolve({ data: [] as any[] }),
        seriesIds.length ? supabase.from('series_catalog').select('id, genres').in('id', seriesIds) : Promise.resolve({ data: [] as any[] }),
      ]);

      const allRows = [...(movieRes.data || []), ...(seriesRes.data || [])];
      if (allRows.length !== items.length) return null;
      const allKids = allRows.every(r =>
        (r.genres || []).some((g: string) => KIDS_GENRES.includes(g))
      );
      return allKids ? m : null;
    })
  );
  return checks.filter(Boolean);
}

export default function Marathons() {
  const { currentProfile } = useProfiles();
  const isKids = !!currentProfile?.is_kids_profile;

  const { data: marathons, isLoading } = useQuery({
    queryKey: ['marathons', isKids ? 'kids' : 'all'],
    queryFn: async () => {
      const all = await getMarathons();
      if (!isKids) return all;
      return await filterKidsMarathons(all);
    },
  });

  return (
    <Layout>
      <div className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
        <div className="flex items-center gap-3 mb-8">
          <Library className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">{isKids ? 'Coleções de Desenhos' : 'Coleções e Maratonas'}</h1>
        </div>
        
        <p className="text-muted-foreground mb-8 text-lg">
          {isKids
            ? 'Coleções de desenhos para maratonar com diversão.'
            : 'Suas sagas e trilogias favoritas agrupadas para você maratonar na ordem certa.'}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {marathons?.map((marathon: any) => (
              <Link 
                key={marathon.id} 
                to={`/marathons/${marathon.id}`}
                className="group relative overflow-hidden rounded-xl aspect-video bg-card border border-border/50 hover:border-primary/50 transition-all duration-300"
              >
                {(marathon.backdrop_path || marathon.poster_path) ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w780${marathon.backdrop_path || marathon.poster_path}`} 
                    alt={marathon.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <Library className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 w-full">
                  <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors line-clamp-1">{marathon.title}</h3>
                  {marathon.description && (
                    <p className="text-sm text-gray-300 line-clamp-2 mt-1">{marathon.description}</p>
                  )}
                </div>
              </Link>
            ))}

            {marathons?.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                {isKids ? 'Nenhuma coleção de desenhos disponível.' : 'Nenhuma maratona disponível no momento.'}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
