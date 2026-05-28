import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import VideoPlayer from '@/components/VideoPlayer';
import { moviesCatalogService } from '@/services/moviesCatalogService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { useUpsertWatchedContent, useWatchedContentItem } from '@/services/watchedContentService';

const Player: React.FC = () => {
  const { imdbId } = useParams<{ imdbId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [streamUrls, setStreamUrls] = useState<string[]>([]);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [streamType, setStreamType] = useState<'direct' | 'iframe'>('direct');
  const [streamTypes, setStreamTypes] = useState<('direct' | 'iframe')[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [posterPath, setPosterPath] = useState<string | null>(null);
  const lastSavedProgressRef = useRef<number>(0);
  const reportedOkRef = useRef<boolean>(false);
  const currentProgressRef = useRef<number>(0);
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const upsertWatchedContent = useUpsertWatchedContent();

  // Store mutable refs to avoid re-renders from callback dependencies
  const upsertRef = useRef(upsertWatchedContent);
  const titleRef = useRef(title);
  const posterRef = useRef(posterPath);
  const userRef = useRef(user);
  const profileRef = useRef(currentProfile);

  useEffect(() => { upsertRef.current = upsertWatchedContent; }, [upsertWatchedContent]);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { posterRef.current = posterPath; }, [posterPath]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { profileRef.current = currentProfile; }, [currentProfile]);

  // Watching is allowed without login

  const { data: watchedContent } = useWatchedContentItem(imdbId || '', 'movie');

  useEffect(() => {
    if (watchedContent?.progress_percent) {
      lastSavedProgressRef.current = watchedContent.progress_percent;
    }
  }, [watchedContent]);

  // Stable callback that never changes - uses refs
  const updateWatchedProgress = useCallback((progressPercent: number) => {
    currentProgressRef.current = progressPercent;
    
    if (!userRef.current || !imdbId || !profileRef.current) return;
    const clampedProgress = Math.min(100, Math.max(0, Math.round(progressPercent)));
    if (Math.abs(clampedProgress - lastSavedProgressRef.current) < 2) return;
    lastSavedProgressRef.current = clampedProgress;

    upsertRef.current.mutateAsync({
      content_id: imdbId,
      content_type: 'movie',
      title: titleRef.current || `Filme ${imdbId}`,
      poster_path: posterRef.current || undefined,
      last_position: clampedProgress,
      progress_percent: clampedProgress,
    }).catch((err) => console.error('Error updating watched progress:', err));
  }, [imdbId]);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      const progress = currentProgressRef.current;
      if (progress > 0 && userRef.current && imdbId && profileRef.current) {
        const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
        upsertRef.current.mutateAsync({
          content_id: imdbId,
          content_type: 'movie',
          title: titleRef.current || `Filme ${imdbId}`,
          poster_path: posterRef.current || undefined,
          last_position: clampedProgress,
          progress_percent: clampedProgress,
        }).catch(() => {});
      }
    };
  }, [imdbId]);

  useEffect(() => {
    if (!imdbId) { setError('ID não fornecido'); return; }

    const setupPlayer = async () => {
      try {
        setError(null);
        // Fetch movie metadata (no streams exposed)
        const { data: movie, error: movieErr } = await supabase
          .from('movies_catalog')
          .select('*')
          .eq('id', imdbId)
          .single();

        if (movieErr || !movie) throw new Error('Filme não encontrado no catálogo');
        setTitle(movie.title);
        setPosterPath(movie.poster_path);

        type StreamData = {
          url?: string;
          urls?: string[];
          type?: 'direct' | 'iframe';
          types?: ('direct' | 'iframe')[];
        };

        const loadPublicStreams = async (): Promise<StreamData | null> => {
          const { data: fallbackStreams } = await supabase
            .from('movie_streams')
            .select('url, status, stream_type')
            .eq('movie_id', imdbId)
            .order('status', { ascending: true });

          if (!fallbackStreams?.length) return null;
          return {
            url: fallbackStreams[0].url,
            urls: fallbackStreams.map((stream) => stream.url),
            types: fallbackStreams.map((stream) => stream.stream_type === 'iframe' || stream.stream_type === 'embed' ? 'iframe' : 'direct'),
          };
        };

        let streamData: StreamData | null = await loadPublicStreams();
        let fnErr: any = null;

        if (!streamData && userRef.current) {
          const response = await supabase.functions.invoke('get-stream', {
            body: {
              content_id: imdbId,
              content_type: 'movie',
              tmdb_id: movie.tmdb_id,
              imdb_id: (movie as any).imdb_id,
            },
          });
          streamData = response.data;
          fnErr = response.error;
        }

        if (fnErr || !streamData || (!streamData.url && !(streamData.urls && streamData.urls.length))) {
          throw new Error('Nenhum stream disponível para este filme');
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
      } catch (error: any) {
        setError(error.message || 'Ocorreu um erro ao configurar o player');
        toast({ title: 'Erro', description: error.message || 'Não foi possível carregar o player', variant: 'destructive' });
      }
    };

    setupPlayer();
  }, [imdbId]);

  if (!currentProfile && user) return null;

  return (
    <Layout hideNav>
      <div className="min-h-screen flex flex-col bg-black">
        {/* Top bar - pointer-events-none on wrapper so player controls (audio, settings, fullscreen) remain clickable */}
        <div className="p-3 flex items-center gap-3 absolute top-0 left-0 z-10 pointer-events-none max-w-[60%]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1.5 text-white/80 hover:text-white hover:bg-white/10 pointer-events-auto"
          >
            <ChevronLeft size={16} /> Voltar
          </Button>
          {title && <span className="text-sm text-white/90 font-medium truncate">{title}</span>}
        </div>

        {/* Player - full screen */}
        <div className="flex-1 flex items-center justify-center">
          {error ? (
            <div className="bg-card rounded-lg p-8 text-center max-w-md">
              <h2 className="text-xl text-foreground mb-3">Erro ao Carregar Player</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate('/')}>Voltar para a Página Inicial</Button>
            </div>
          ) : streamUrl ? (
            <div className="w-full h-full max-w-[100vw] relative">
              {/* Backdrop poster — blurred, contained, behind the player */}
              {posterPath && streamType !== 'iframe' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <img
                    src={moviesCatalogService.getPosterUrl(posterPath, 'w500')}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover opacity-30 blur-2xl scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
              )}
              {streamType === 'iframe' ? (
                <div className="relative w-full h-full">
                  <iframe
                    src={streamUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    title={title || 'Video Player'}
                  />
                </div>
              ) : (
              <VideoPlayer
                  src={streamUrl}
                  title={title}
                  initialProgress={watchedContent?.progress_percent || 0}
                  onProgress={(p) => {
                    updateWatchedProgress(p);
                    if (p > 1 && !reportedOkRef.current) {
                      reportedOkRef.current = true;
                      supabase.functions.invoke('report-stream-status', {
                        body: { url: streamUrl, status: 'online', content_type: 'movie', content_id: imdbId },
                      }).catch(() => {});
                    }
                  }}
                  autoFullscreen
                  fillContainer
                  onError={() => {
                    supabase.functions.invoke('report-stream-status', {
                      body: { url: streamUrl, status: 'offline', content_type: 'movie', content_id: imdbId },
                    }).catch(() => {});
                    reportedOkRef.current = false;
                    const nextIdx = currentUrlIndex + 1;
                    if (nextIdx < streamUrls.length) {
                      setCurrentUrlIndex(nextIdx);
                      setStreamUrl(streamUrls[nextIdx]);
                      setStreamType(streamTypes[nextIdx] || 'direct');
                    } else {
                      setError('Nenhum stream funcionou para este filme');
                    }
                  }}
                />
              )}
            </div>
          ) : (
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Player;
