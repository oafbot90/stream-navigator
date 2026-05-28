import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Radio, Tv, RefreshCw, Lock, Crown } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchLiveTVChannels, Channel } from '@/services/liveTvApi';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

const LiveTVPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const navigate = useNavigate();
  const { isSubscribed } = useSubscription();
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['liveTVChannels'],
    queryFn: fetchLiveTVChannels,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const filteredChannels = useMemo(() => {
    if (!data?.channels) return [];
    return data.channels.filter(channel => 
      selectedCategory === 0 || channel.categories.includes(selectedCategory)
    );
  }, [data?.channels, selectedCategory]);

  const handleChannelClick = useCallback((channel: Channel) => {
    if (!isSubscribed) {
      toast({
        title: '🔒 Conteúdo Premium',
        description: 'Os canais ao vivo são exclusivos para assinantes Premium.',
        variant: 'destructive',
      });
      navigate('/premium');
      return;
    }
    const params = new URLSearchParams({
      name: channel.name,
      image: channel.image,
      url: channel.url,
    });
    navigate(`/livetv/player/${channel.id}?${params.toString()}`);
  }, [navigate, isSubscribed, toast]);

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Tv className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Erro ao carregar canais</h2>
            <p className="text-muted-foreground mb-4">Tente novamente mais tarde</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-20 pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Radio className="h-8 w-8 text-destructive animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Canais ao Vivo
            </h1>
            <Badge variant="destructive" className="animate-pulse">
              AO VIVO
            </Badge>
          </div>

          {/* Premium banner */}
          {!isSubscribed && (
            <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent p-4 sm:p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/20 shrink-0">
                <Crown className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-bold text-foreground">Canais ao Vivo são Premium</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Assine para liberar todos os canais em tempo real.</p>
              </div>
              <Button onClick={() => navigate('/premium')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold shrink-0">
                Assinar
              </Button>
            </div>
          )}

          {/* Categories */}
          <div className="mb-6">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-3">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-24 rounded-full" />
                  ))
                ) : (
                  data?.categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      className={`rounded-full whitespace-nowrap transition-all ${
                        selectedCategory === category.id 
                          ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                          : 'border-border hover:border-destructive hover:text-destructive'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </Button>
                  ))
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Channels Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="bg-card border-border overflow-hidden">
                  <CardContent className="p-0">
                    <Skeleton className="aspect-video w-full" />
                    <div className="p-3">
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-12">
              <Tv className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum canal encontrado nesta categoria</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredChannels.map((channel) => (
                <Card 
                  key={channel.id}
                  className="bg-card border-border overflow-hidden cursor-pointer group hover:border-destructive hover:scale-105 transition-all duration-300"
                  onClick={() => handleChannelClick(channel)}
                >
                  <CardContent className="p-0">
                    <div className={`aspect-video relative bg-muted overflow-hidden ${!isSubscribed ? 'opacity-70' : ''}`}>
                      <img 
                        src={channel.image} 
                        alt={channel.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      {!isSubscribed && (
                        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1 backdrop-blur-[2px]">
                          <Lock className="h-6 w-6 text-yellow-400" />
                          <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Premium</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center">
                          <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Radio className="h-3 w-3 animate-pulse" />
                            {isSubscribed ? 'Assistir' : 'Desbloquear'}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                          LIVE
                        </Badge>
                      </div>
                      {!isSubscribed && (
                        <div className="absolute top-2 left-2">
                          <span className="flex items-center gap-1 text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-bold">
                            <Crown className="w-3 h-3" /> VIP
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-foreground truncate group-hover:text-destructive transition-colors">
                        {channel.name}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LiveTVPage;
