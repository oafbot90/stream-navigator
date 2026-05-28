import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Download } from 'lucide-react';
import Layout from '@/components/Layout';
import HeroSlider from '@/components/HeroSlider';
import ContentRow from '@/components/ContentRow';

import SurpriseBanner from '@/components/SurpriseBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { moviesCatalogService, CatalogMovie } from '@/services/moviesCatalogService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  if (hour >= 18 && hour < 24) return 'Boa noite';
  return 'Boa madrugada';
}

const KIDS_GENRES = ['Família', 'Family', 'Kids', 'Animação', 'Animation'];
const isKidsContent = (genres: string[] | null) => {
  if (!genres) return false;
  return genres.some(g => KIDS_GENRES.includes(g));
};

const Home: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const navigate = useNavigate();
  const [heroMovies, setHeroMovies] = useState<CatalogMovie[]>([]);
  const [popularMovies, setPopularMovies] = useState<CatalogMovie[]>([]);
  const [popularSeries, setPopularSeries] = useState<CatalogMovie[]>([]);
  const [recentItems, setRecentItems] = useState<CatalogMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const isKids = currentProfile?.is_kids_profile;
        const kidsGenreFilter = 'genres.cs.{Família},genres.cs.{Family},genres.cs.{Animação},genres.cs.{Animation},genres.cs.{Kids}';

        const [hero, popularRes, recentMoviesData, recentSeriesData, popularSeriesRes] = await Promise.all([
          moviesCatalogService.getHeroMovies(5),
          isKids
            ? supabase.from('movies_catalog').select('*', { count: 'exact' }).or(kidsGenreFilter).order('vote_count', { ascending: false }).limit(20)
            : moviesCatalogService.getPopularMovies(1, 20).then(r => ({ data: r.movies, count: r.total, error: null })),
          isKids
            ? supabase.from('movies_catalog').select('*').or(kidsGenreFilter).order('created_at', { ascending: false }).limit(20).then(r => r.data || [])
            : moviesCatalogService.getRecentMovies(20),
          isKids
            ? supabase.from('series_catalog').select('*').or(kidsGenreFilter).order('updated_at', { ascending: false }).limit(20)
            : supabase.from('series_catalog').select('*').order('updated_at', { ascending: false }).limit(20),
          isKids
            ? supabase.from('series_catalog').select('*').or(kidsGenreFilter).order('vote_count', { ascending: false }).limit(20)
            : supabase.from('series_catalog').select('*').order('vote_count', { ascending: false }).limit(20),
        ]);

        let heroList = hero;
        const popularList = (Array.isArray(popularRes) ? popularRes : (popularRes as any).data || []) as CatalogMovie[];
        const recentMovies = (Array.isArray(recentMoviesData) ? recentMoviesData : []) as CatalogMovie[];

        const mapSeriesToCatalog = (seriesData: any[]): CatalogMovie[] =>
          seriesData.map((s: any) => ({
            ...s,
            release_date: s.first_air_date,
            runtime: null,
            content_type: 'tv',
            vote_average: s.vote_average || 0,
            vote_count: s.vote_count || 0,
            genres: s.genres || [],
          }));

        const seriesAsCatalog = mapSeriesToCatalog(recentSeriesData.data || []);
        const popularSeriesList = mapSeriesToCatalog(popularSeriesRes.data || []);

        let merged = [...recentMovies, ...seriesAsCatalog]
          .sort((a: any, b: any) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())
          .slice(0, 20);

        if (isKids) {
          heroList = heroList.filter(m => isKidsContent(m.genres));
          merged = merged.filter(m => isKidsContent(m.genres));
        }

        setHeroMovies(heroList);
        setPopularMovies(popularList);
        setPopularSeries(popularSeriesList);
        setRecentItems(merged);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast({ title: 'Erro', description: 'Falha ao carregar conteúdo.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast, currentProfile?.is_kids_profile]);

  return (
    <Layout>
      {/* Hero section with search overlay */}
      <div className="relative">
        {isLoading ? (
          <div className="h-[55vh] sm:h-[65vh] md:h-[75vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          heroMovies.length > 0 && <HeroSlider items={heroMovies} />
        )}

        {/* Search bar floating on top of hero */}
        <div className="absolute top-3 sm:top-4 left-0 right-0 z-30 px-4 sm:px-6 md:ml-16">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex-1" />
            <button
              onClick={() => navigate('/search')}
              className="flex items-center gap-2 bg-background/30 hover:bg-background/50 backdrop-blur-md border border-white/10 rounded-full h-9 sm:h-10 px-3 sm:px-5 text-white/80 hover:text-white transition-all shadow-lg"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="text-sm hidden sm:inline">Pesquisar filmes, séries...</span>
            </button>
          </div>
        </div>
      </div>

      <SurpriseBanner />

      <div className="container mx-auto px-4 sm:px-6 mt-4">
        <Link
          to="/download"
          className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-purple-500/10 to-transparent p-4 hover:border-primary/60 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-foreground">Baixe o app FlixHub</p>
              <p className="text-xs text-muted-foreground">App Android oficial — mais rápido e direto</p>
            </div>
          </div>
          <span className="text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">Baixar →</span>
        </Link>
      </div>

      <div className="container mx-auto px-4 sm:px-6">

        <div className="mt-4 md:mt-8">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="mb-8">
                  <Skeleton className="h-8 w-48 mb-4 bg-secondary" />
                  <div className="flex gap-4 overflow-hidden">
                    {[...Array(6)].map((_, index) => (
                      <Skeleton key={index} className="w-[180px] h-[270px] rounded-md bg-secondary" />
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <ContentRow title="Filmes Populares" items={popularMovies} viewAllLink="/movies" />
              <ContentRow title="Séries Populares" items={popularSeries} viewAllLink="/tvshows" />
              <ContentRow
                title={currentProfile?.is_kids_profile ? 'Desenhos Adicionados Recentemente' : 'Adicionados Recentemente'}
                items={recentItems}
                viewAllLink={currentProfile?.is_kids_profile ? '/kids' : '/movies'}
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
