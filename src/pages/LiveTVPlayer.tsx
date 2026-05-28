import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Radio, Tv, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VideoPlayer from '@/components/VideoPlayer';

const LiveTVPlayer: React.FC = () => {
  const { channelId: _channelId } = useParams<{ channelId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showControls, setShowControls] = useState(true);
  const [playerKey, setPlayerKey] = useState(0);

  const channelName = searchParams.get('name') || 'Canal';
  const channelImage = searchParams.get('image') || '';
  const channelUrl = searchParams.get('url') || '';

  // Hide controls after 3 seconds
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const resetTimeout = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    resetTimeout();
    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('touchstart', resetTimeout);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('touchstart', resetTimeout);
    };
  }, []);

  const handleBack = () => navigate('/livetv');
  const handleRefresh = () => setPlayerKey(k => k + 1);

  if (!channelUrl) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Tv className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Canal não encontrado</h2>
          <Button onClick={handleBack} variant="outline" className="mt-4">Voltar aos canais</Button>
        </div>
      </div>
    );
  }

  const decodedUrl = decodeURIComponent(channelUrl);

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ touchAction: 'manipulation' }}>
      {/* Header Controls */}
      <div className={`absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 via-black/50 to-transparent p-3 sm:p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="icon" onClick={handleBack} className="text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {channelImage && (
                <img src={decodeURIComponent(channelImage)} alt={channelName} className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold text-white truncate">{decodeURIComponent(channelName)}</h1>
                <Badge variant="destructive" className="animate-pulse text-[10px] sm:text-xs">
                  <Radio className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> AO VIVO
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={handleRefresh} className="text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10" title="Recarregar">
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* VideoPlayer fills entire screen */}
      <div className="w-full h-full">
        <VideoPlayer
          key={playerKey}
          src={decodedUrl}
          title={decodeURIComponent(channelName)}
          autoFullscreen
          fillContainer
        />
      </div>
    </div>
  );
};

export default LiveTVPlayer;
