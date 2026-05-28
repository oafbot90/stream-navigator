import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, List, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import VideoPlayer, { SkipSegment } from '@/components/VideoPlayer';
import { seriesCatalogService, CatalogSeries, SeriesEpisode, EpisodeStream } from '@/services/seriesCatalogService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { useUpsertWatchedContent } from '@/services/watchedContentService';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

const SeriesPlayer: React.FC = () => {
  const { seriesId, episodeId } = useParams<{ seriesId: string; episodeId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const upsertWatched = useUpsertWatchedContent();
  const isMobile = useIsMobile();

  const [series, setSeries] = useState<CatalogSeries | null>(null);
  const [episodes, setEpisodes] = useState<SeriesEpisode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<SeriesEpisode | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [streamUrls, setStreamUrls] = useState<string[]>([]);
  const [streamType, setStreamType] = useState<'direct' | 'iframe'>('direct');
  const [streamTypes, setStreamTypes] = useState<('direct' | 'iframe')[]>([]);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [skipSegments, setSkipSegments] = useState<SkipSegment[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  const currentProgressRef = useRef(0);
  const reportedOkRef = useRef(false);
  useEffect(() => { reportedOkRef.current = false; }, [streamUrl]);
  const upsertRef = useRef(upsertWatched);
  useEffect(() => { upsertRef.current = upsertWatched; }, [upsertWatched]);

  // Load series + episodes
  useEffect(() => {
    if (!seriesId) return;
    const load = async () => {
      try {
        const [seriesData, episodesData] = await Promise.all([
          seriesCatalogService.getSeriesById(seriesId),
          seriesCatalogService.getEpisodes(seriesId),
        ]);
        setSeries(seriesData);
        setEpisodes(episodesData);

        // Select episode
        let ep: SeriesEpisode | undefined;
        if (episodeId) {
          ep = episodesData.find(e => e.id === episodeId);
        }
        if (!ep && episodesData.length > 0) {
          ep = episodesData[0];
        }
        if (ep) {
          setSelectedSeason(ep.season_number);
          loadEpisode(ep, seriesData);
        } else {
          setError('Nenhum episódio disponível');
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar série');
      }
    };
    load();
  }, [seriesId]);

  const loadEpisode = async (ep: SeriesEpisode, seriesOverride?: CatalogSeries | null) => {
    setCurrentEpisode(ep);
    setStreamUrl('');
    setError(null);
    setSkipSegments([]);
    const currentSeries = seriesOverride ?? series;

    // Fetch skip segments from TheIntroDB (non-blocking)
    if (currentSeries?.tmdb_id) {
      fetch(`https://api.theintrodb.org/v2/media?tmdb_id=${currentSeries.tmdb_id}&season=${ep.season_number}&episode=${ep.episode_number}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          const segments: SkipSegment[] = [];
          for (const type of ['intro', 'recap', 'credits', 'preview'] as const) {
            const arr = data[type];
            if (Array.isArray(arr)) {
              for (const s of arr) {
                if (s.start_ms != null && s.end_ms != null) {
                  segments.push({ type, start_ms: s.start_ms, end_ms: s.end_ms });
                }
              }
            }
          }
          setSkipSegments(segments);
        })
        .catch(() => {});
    }
    try {
      const { data: streamData, error: fnErr } = await supabase.functions.invoke('get-stream', {
        body: {
          content_id: seriesId,
          content_type: 'tv',
          episode_id: ep.id,
          tmdb_id: currentSeries?.tmdb_id,
          season: ep.season_number,
          episode: ep.episode_number,
        },
      });

      if (fnErr || !streamData || (!streamData.url && !(streamData.urls && streamData.urls.length))) {
        if (ep.source_url) {
          setStreamUrls([ep.source_url]);
          setStreamTypes(['iframe']);
          setCurrentUrlIndex(0);
          setStreamUrl(ep.source_url);
          setStreamType('iframe');
        } else {
          setError('Nenhum stream disponível para este episódio');
        }
        return;
      }

      const urls: string[] = streamData.urls || [streamData.url];
      const inferType = (u: string): 'direct' | 'iframe' => {
        const full = String(u || '').toLowerCase();
        const clean = full.split('?')[0];
        if (/\.(m3u8|mp4|mkv|webm|mov|ts|txt)$/.test(clean)) return 'direct';
        if (full.includes('.txt') || full.includes('.m3u8') || full.includes('/m3u8/')) return 'direct';
        return 'iframe';
      };
      const types: ('direct' | 'iframe')[] = (streamData.types && streamData.types.length === urls.length)
        ? streamData.types
        : urls.map(inferType);
      setStreamUrls(urls);
      setStreamTypes(types);
      setCurrentUrlIndex(0);
      setStreamUrl(urls[0]);
      setStreamType(types[0] || (streamData.type === 'iframe' ? 'iframe' : 'direct'));
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar stream');
    }
  };

  const handleEpisodeClick = (ep: SeriesEpisode) => {
    loadEpisode(ep);
    if (isMobile) setSidebarOpen(false);
    navigate(`/player/series/${seriesId}/${ep.id}`, { replace: true });
  };

  const handleProgress = useCallback((pct: number) => {
    currentProgressRef.current = pct;
    if (!user || !currentProfile || !currentEpisode || !seriesId) return;
    const clamped = Math.min(100, Math.max(0, Math.round(pct)));
    upsertRef.current.mutateAsync({
      content_id: seriesId,
      content_type: 'tv',
      title: `${series?.title || 'Série'} - T${currentEpisode.season_number}E${currentEpisode.episode_number}`,
      poster_path: series?.poster_path || undefined,
      last_position: clamped,
      progress_percent: clamped,
      season: currentEpisode.season_number,
      episode: currentEpisode.episode_number,
    }).catch(() => {});
  }, [user, currentProfile, currentEpisode, seriesId, series]);

  // Auto-play next episode when current one ends
  const handleEnded = useCallback(() => {
    if (!currentEpisode || !episodes.length) return;
    const currentSeasonEps = episodes.filter(e => e.season_number === currentEpisode.season_number);
    const currentIdx = currentSeasonEps.findIndex(e => e.id === currentEpisode.id);
    
    // Try next episode in same season
    if (currentIdx >= 0 && currentIdx < currentSeasonEps.length - 1) {
      const nextEp = currentSeasonEps[currentIdx + 1];
      handleEpisodeClick(nextEp);
      return;
    }
    
    // Try first episode of next season
    const nextSeason = currentEpisode.season_number + 1;
    const nextSeasonEps = episodes.filter(e => e.season_number === nextSeason);
    if (nextSeasonEps.length > 0) {
      setSelectedSeason(nextSeason);
      handleEpisodeClick(nextSeasonEps[0]);
    }
  }, [currentEpisode, episodes]);

  const seasons = useMemo(() => [...new Set(episodes.map(e => e.season_number))].sort((a, b) => a - b), [episodes]);
  const seasonEpisodes = useMemo(() => episodes.filter(e => e.season_number === selectedSeason), [episodes, selectedSeason]);

  const episodeTitle = currentEpisode
    ? `T${currentEpisode.season_number}:E${currentEpisode.episode_number} - ${currentEpisode.title}`
    : '';

  return (
    <Layout hideNav>
      <div className="min-h-screen flex flex-col bg-black">
        {/* Top bar */}
        <div className="p-3 flex items-center gap-3 absolute top-0 left-0 right-0 z-20">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-white/80 hover:text-white hover:bg-white/10">
            <ChevronLeft size={16} /> Voltar
          </Button>
          <span className="text-sm text-white/90 font-medium truncate flex-1">{series?.title} {episodeTitle && `• ${episodeTitle}`}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5"
          >
            {sidebarOpen ? <X size={16} /> : <List size={16} />}
            <span className="hidden sm:inline">Episódios</span>
          </Button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col md:flex-row pt-14">
          {/* Player */}
          <div className={cn("flex-1 flex items-center justify-center transition-all", sidebarOpen && !isMobile ? "md:mr-80" : "")}>
            {error ? (
              <div className="bg-card rounded-lg p-8 text-center max-w-md mx-4">
                <h2 className="text-xl text-foreground mb-3">Erro</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => navigate('/')}>Voltar</Button>
              </div>
            ) : streamUrl ? (
              <div className="w-full h-full max-w-[100vw] relative">
                {streamType === 'iframe' ? (
                  <iframe
                    src={streamUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    title={episodeTitle || 'Video Player'}
                  />
                ) : (
                  <VideoPlayer
                    src={streamUrl}
                    title={episodeTitle}
                    poster={series?.backdrop_path ? seriesCatalogService.getBackdropUrl(series.backdrop_path) || undefined : undefined}
                    onProgress={(p) => {
                      handleProgress(p);
                      if (p > 1 && !reportedOkRef.current && currentEpisode) {
                        reportedOkRef.current = true;
                        supabase.functions.invoke('report-stream-status', {
                          body: { url: streamUrl, status: 'online', content_type: 'series', episode_id: currentEpisode.id },
                        }).catch(() => {});
                      }
                    }}
                    onEnded={handleEnded}
                    autoFullscreen
                    fillContainer
                    skipSegments={skipSegments}
                    onError={() => {
                      if (currentEpisode) {
                        supabase.functions.invoke('report-stream-status', {
                          body: { url: streamUrl, status: 'offline', content_type: 'series', episode_id: currentEpisode.id },
                        }).catch(() => {});
                      }
                      const nextIdx = currentUrlIndex + 1;
                      if (nextIdx < streamUrls.length) {
                        setCurrentUrlIndex(nextIdx);
                        setStreamUrl(streamUrls[nextIdx]);
                        setStreamType(streamTypes[nextIdx] || 'direct');
                      } else {
                        setError('Nenhum stream funcionou para este episódio');
                      }
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
            )}
          </div>

          {/* Episodes sidebar */}
          {sidebarOpen && (
            <>
              {/* Mobile: bottom sheet overlay */}
              {isMobile ? (
                <div className="fixed inset-0 z-30 flex flex-col justify-end">
                  <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
                  <div className="relative bg-card rounded-t-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <h3 className="font-semibold text-foreground">Episódios</h3>
                      <Button size="icon" variant="ghost" onClick={() => setSidebarOpen(false)}><X size={18} /></Button>
                    </div>
                    {/* Season pills */}
                    <div className="flex gap-2 px-4 py-3 overflow-x-auto">
                      {seasons.map(s => (
                        <button key={s} onClick={() => setSelectedSeason(s)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors", selectedSeason === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          T{s}
                        </button>
                      ))}
                    </div>
                    <ScrollArea className="flex-1 px-4 pb-6">
                      <div className="space-y-2">
                        {seasonEpisodes.map(ep => (
                          <button key={ep.id} onClick={() => handleEpisodeClick(ep)} className={cn("w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors", currentEpisode?.id === ep.id ? "bg-primary/15 ring-1 ring-primary/30" : "hover:bg-accent/50")}>
                            <div className="w-24 h-14 rounded-lg bg-muted shrink-0 overflow-hidden relative">
                              <img src={seriesCatalogService.getStillUrl(ep.still_path, 'w300')} alt={ep.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              {currentEpisode?.id === ep.id && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Play size={18} className="text-primary fill-primary" />
                                </div>
                              )}
                              {!ep.still_path && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-bold text-muted-foreground">{ep.episode_number}</span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{ep.title}</p>
                              <p className="text-[11px] text-muted-foreground">Ep {ep.episode_number}{ep.runtime ? ` • ${ep.runtime}min` : ''}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                /* Desktop: right sidebar */
                <div className="fixed right-0 top-14 bottom-0 w-80 bg-card/95 backdrop-blur-md border-l border-border z-20 flex flex-col">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground mb-3">Episódios</h3>
                    <div className="flex gap-2 flex-wrap">
                      {seasons.map(s => (
                        <button key={s} onClick={() => setSelectedSeason(s)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors", selectedSeason === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent")}>
                          Temporada {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-3 space-y-1">
                      {seasonEpisodes.map(ep => (
                        <button key={ep.id} onClick={() => handleEpisodeClick(ep)} className={cn("w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors", currentEpisode?.id === ep.id ? "bg-primary/15 ring-1 ring-primary/30" : "hover:bg-accent/50")}>
                          <div className="w-28 h-16 rounded-lg bg-muted shrink-0 overflow-hidden relative">
                            <img src={seriesCatalogService.getStillUrl(ep.still_path, 'w300')} alt={ep.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            {currentEpisode?.id === ep.id && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Play size={18} className="text-primary fill-primary" />
                              </div>
                            )}
                            {!ep.still_path && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-muted-foreground">{ep.episode_number}</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{ep.title}</p>
                            <p className="text-[11px] text-muted-foreground">Ep {ep.episode_number}{ep.runtime ? ` • ${ep.runtime}min` : ''}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SeriesPlayer;
