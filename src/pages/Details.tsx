import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Calendar, Star, Clock, Tv, ChevronDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import FavoriteButton from '@/components/FavoriteButton';
import SocialShare from '@/components/SocialShare';
import ContentReportButton from '@/components/ContentReportButton';
import { moviesCatalogService, CatalogMovie } from '@/services/moviesCatalogService';
import { seriesCatalogService, CatalogSeries, SeriesEpisode } from '@/services/seriesCatalogService';
import { useAdClick } from '@/components/AdManager';
import { useAuth } from '@/contexts/AuthContext';

const TMDB_API_KEY = '36f12a46be05ce54f2d2f4b501cad2ea';
const TMDB_BASE = 'https://api.themoviedb.org/3';

interface TmdbExtra {
  overview?: string;
  runtime?: number | null;
  backdrop_path?: string | null;
  number_of_seasons?: number;
  number_of_episodes?: number;
}

const fetchTmdbExtra = async (tmdbId: number, type: 'movie' | 'tv'): Promise<TmdbExtra | null> => {
  const endpoint = type === 'tv' ? 'tv' : 'movie';
  const makeUrl = (language: string) =>
    `${TMDB_BASE}/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}&language=${encodeURIComponent(language)}`;

  const withTimeout = (url: string, ms = 6000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
  };

  try {
    const primaryRes = await withTimeout(makeUrl('pt-BR'));
    if (!primaryRes.ok) return null;
    const primary = await primaryRes.json();

    let overview = primary.overview || '';
    if (!overview) {
      try {
        const fallbackRes = await withTimeout(makeUrl('en-US'));
        if (fallbackRes.ok) {
          const fb = await fallbackRes.json();
          overview = fb.overview || '';
        }
      } catch {}
    }

    return {
      overview,
      runtime: primary.runtime || primary.episode_run_time?.[0] || null,
      backdrop_path: primary.backdrop_path || null,
      number_of_seasons: primary.number_of_seasons,
      number_of_episodes: primary.number_of_episodes,
    };
  } catch {
    return null;
  }
};


const Details: React.FC = () => {
  const { id, type } = useParams<{ id?: string; type?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [movie, setMovie] = useState<CatalogMovie | null>(null);
  const [series, setSeries] = useState<CatalogSeries | null>(null);
  const [episodes, setEpisodes] = useState<SeriesEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStream, setHasStream] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(1);
  const [tmdbExtra, setTmdbExtra] = useState<TmdbExtra | null>(null);
  const { triggerAd } = useAdClick();
  const { user } = useAuth();

  const isSeries = type === 'tv';

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setTmdbExtra(null);
        if (!id) throw new Error('ID não fornecido');

        // If the route id is numeric, treat it as a TMDB id and resolve to local row
        const isNumericId = /^\d+$/.test(id);
        let tmdbId: number | null | undefined = null;

        if (isSeries) {
          let data: CatalogSeries | null = null;
          if (isNumericId) {
            data = await seriesCatalogService.getSeriesByTmdbId(Number(id));
            if (!data) throw new Error('Conteúdo não disponível no catálogo');
          } else {
            data = await seriesCatalogService.getSeriesById(id);
          }
          setSeries(data);
          const eps = data ? await seriesCatalogService.getEpisodes(data.id) : [];
          setEpisodes(eps);
          setHasStream(eps.length > 0);
          if (eps.length > 0) setSelectedSeason(eps[0].season_number);
          setExpandedSeason(eps.length > 0 ? eps[0].season_number : null);
          tmdbId = data?.tmdb_id;
        } else {
          let data: CatalogMovie | null = null;
          if (isNumericId) {
            data = await moviesCatalogService.getMovieByTmdbId(Number(id));
            if (!data) throw new Error('Conteúdo não disponível no catálogo');
          } else {
            data = await moviesCatalogService.getMovieWithStreams(id);
          }
          setMovie(data);
          setHasStream(!!(data?.streams && data.streams.length > 0));
          tmdbId = data?.tmdb_id;
        }

        // Render imediato; busca extras do TMDB em background (não bloqueia a UI)
        setIsLoading(false);

        const numericTmdbId = Number(tmdbId);
        if (numericTmdbId && Number.isFinite(numericTmdbId) && numericTmdbId > 0) {
          const contentType = isSeries ? 'tv' : 'movie';
          fetchTmdbExtra(numericTmdbId, contentType)
            .then(extra => { if (extra) setTmdbExtra(extra); })
            .catch(e => console.warn('TMDB overview fetch failed', e));
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Ocorreu um erro';
        console.error('Erro ao buscar detalhes:', error);
        setError(message);
        toast({ title: 'Erro', description: 'Falha ao carregar detalhes do conteúdo', variant: 'destructive' });
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id, type, toast, isSeries]);


  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const content = isSeries ? series : movie;
  if (error || !content) {
    return (
      <Layout>
        <div className="min-h-screen pt-20 flex flex-col items-center justify-center">
          <h1 className="text-2xl text-foreground mb-4">Conteúdo Não Encontrado</h1>
          <p className="text-muted-foreground mb-6">{error || 'Não foi possível carregar os detalhes'}</p>
          <Button onClick={() => navigate('/')}>Voltar para a Página Inicial</Button>
        </div>
      </Layout>
    );
  }

  const title = content.title;
  const releaseDate = isSeries ? (series!.first_air_date) : (movie!.release_date);
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '';
  const dbBackdrop = isSeries ? series!.backdrop_path : movie!.backdrop_path;
  const effectiveBackdrop = dbBackdrop || tmdbExtra?.backdrop_path || null;
  const backdropUrl = effectiveBackdrop
    ? (isSeries
        ? seriesCatalogService.getBackdropUrl(effectiveBackdrop, 'original')
        : moviesCatalogService.getBackdropUrl(effectiveBackdrop, 'original'))
    : null;
  const posterUrl = isSeries
    ? seriesCatalogService.getPosterUrl(series!.poster_path, 'w500')
    : moviesCatalogService.getPosterUrl(movie!.poster_path, 'w500');
  const effectiveRuntime = (!isSeries && (movie!.runtime || tmdbExtra?.runtime)) || 0;
  const effectiveOverview = content.overview || tmdbExtra?.overview || '';

  const handlePlay = () => {
    if (!user) {
      toast({ title: 'Faça login primeiro', description: 'Você precisa estar logado para assistir' });
      navigate('/auth');
      return;
    }
    triggerAd(() => {
      if (isSeries) {
        navigate(`/player/series/${id}`);
      } else {
        navigate(`/player/movie/${id}`);
      }
    });
  };

  const handleEpisodeClick = (episodeId: string) => {
    if (!user) {
      toast({ title: 'Faça login primeiro', description: 'Você precisa estar logado para assistir' });
      navigate('/auth');
      return;
    }
    navigate(`/player/series/${id}/${episodeId}`);
  };

  // Group episodes by season
  const seasons = [...new Set(episodes.map(ep => ep.season_number))].sort((a, b) => a - b);
  const episodesBySeason = (season: number) => episodes.filter(ep => ep.season_number === season);

  return (
    <Layout>
      <div className="relative min-h-[70vh]">
        {backdropUrl && (
          <div className="absolute inset-0 bg-background">
            <img src={backdropUrl} alt={title} className="w-full h-full object-cover object-top opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
        )}

        <div className="container mx-auto px-4 pt-20 sm:pt-32 pb-16 relative z-10">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-8">
            <div className="w-40 sm:w-auto md:w-1/3 lg:w-1/4 flex-shrink-0 mx-auto md:mx-0">
              <img src={posterUrl} alt={title} className="w-full rounded-lg shadow-lg" />
            </div>

            <div className="md:w-2/3 lg:w-3/4">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-2">{title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
                {releaseYear && (
                  <div className="flex items-center"><Calendar size={16} className="mr-1" /><span>{releaseYear}</span></div>
                )}
                {content.vote_average > 0 && (
                  <div className="flex items-center"><Star size={16} className="mr-1 text-yellow-400" /><span>{Math.round(content.vote_average * 10) / 10}</span></div>
                )}
                {!isSeries && effectiveRuntime > 0 && (
                  <div className="flex items-center"><Clock size={16} className="mr-1" /><span>{Math.floor(effectiveRuntime / 60)}h {effectiveRuntime % 60}m</span></div>
                )}
                {isSeries && (series!.number_of_seasons || tmdbExtra?.number_of_seasons) && (
                  <div className="flex items-center"><Tv size={16} className="mr-1" /><span>{series!.number_of_seasons || tmdbExtra?.number_of_seasons} Temporada{(series!.number_of_seasons || tmdbExtra?.number_of_seasons || 0) > 1 ? 's' : ''}</span></div>
                )}
                {isSeries && (series!.number_of_episodes || tmdbExtra?.number_of_episodes) && (
                  <div className="flex items-center"><Play size={16} className="mr-1" /><span>{series!.number_of_episodes || tmdbExtra?.number_of_episodes} Episódios</span></div>
                )}
              </div>

              {content.genres && content.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {content.genres.map((genre, idx) => (
                    <span key={idx} className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">{genre}</span>
                  ))}
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-medium text-foreground mb-2">Sinopse</h3>
                <p className="text-muted-foreground whitespace-pre-line">{effectiveOverview || 'Sinopse não disponível.'}</p>
              </div>

              <div className="flex flex-wrap gap-4 mb-8">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={handlePlay}>
                  <Play size={18} /> Assistir Agora
                </Button>

                <FavoriteButton contentId={content.id} contentType={isSeries ? 'tv' : 'movie'} title={title} posterPath={content.poster_path || undefined} />
                <SocialShare title={title} type={isSeries ? 'tv' : 'movie'} id={content.id} />
                <ContentReportButton contentId={content.id} contentType={isSeries ? 'tv' : 'movie'} contentTitle={title} />
              </div>
            </div>
          </div>

          {/* Episodes & Seasons for Series */}
          {isSeries && seasons.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">Temporadas e Episódios</h2>

              {/* Season pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {seasons.map(s => (
                  <button
                    key={s}
                    onClick={() => setExpandedSeason(expandedSeason === s ? null : s)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      expandedSeason === s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    Temporada {s}
                    <ChevronDown className={`inline-block ml-1 h-4 w-4 transition-transform ${expandedSeason === s ? 'rotate-180' : ''}`} />
                  </button>
                ))}
              </div>

              {/* Episode list */}
              {expandedSeason !== null && (
                <div className="space-y-3">
                  {episodesBySeason(expandedSeason).map(ep => (
                    <div
                      key={ep.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-card/60 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => handleEpisodeClick(ep.id)}
                    >
                      <div className="w-28 h-16 sm:w-36 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={seriesCatalogService.getStillUrl(ep.still_path)}
                          alt={ep.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          E{ep.episode_number} - {ep.title}
                        </p>
                        {ep.overview && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{ep.overview}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          {ep.runtime && <span>{ep.runtime} min</span>}
                          {ep.has_dub && <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-medium">DUB</span>}
                          {ep.has_leg && <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-medium">LEG</span>}
                        </div>
                      </div>
                      <Play className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  ))}
                  {episodesBySeason(expandedSeason).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum episódio disponível para esta temporada</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Details;
