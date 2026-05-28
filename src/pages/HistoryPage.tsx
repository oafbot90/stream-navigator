import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Play, Trash2, Film, Tv, Clock, ChevronLeft, Search, Filter, Calendar } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWatchedContent, WatchedContent } from '@/services/watchedContentService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w300';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: watchedContent, isLoading } = useWatchedContent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'progress'>('recent');

  // Filter and sort content
  const filteredContent = useMemo(() => {
    if (!watchedContent) return [];

    let filtered = [...watchedContent];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.content_type === filterType);
    }

    // Sort
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'progress':
        filtered.sort((a, b) => (b.progress_percent || 0) - (a.progress_percent || 0));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => 
          new Date(b.watched_at || 0).getTime() - new Date(a.watched_at || 0).getTime()
        );
        break;
    }

    return filtered;
  }, [watchedContent, searchQuery, filterType, sortBy]);

  // Group by date
  const groupedContent = useMemo(() => {
    const groups: { [key: string]: WatchedContent[] } = {};
    
    filteredContent.forEach(item => {
      const date = item.watched_at ? new Date(item.watched_at) : new Date();
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey: string;
      
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Hoje';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Ontem';
      } else {
        groupKey = date.toLocaleDateString('pt-BR', { 
          day: 'numeric', 
          month: 'long',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    return groups;
  }, [filteredContent]);

  const handlePlay = (item: WatchedContent) => {
    if (item.content_type === 'movie') {
      navigate(`/player/movie/${item.content_id}`);
    } else {
      const season = item.season || 1;
      const episode = item.episode || 1;
      navigate(`/player/tv/${item.content_id}/${season}/${episode}`);
    }
  };

  const handleViewDetails = (item: WatchedContent) => {
    navigate(`/details/${item.content_type}/${item.content_id}`);
  };

  const handleRemoveFromHistory = async (item: WatchedContent) => {
    try {
      const { error } = await supabase
        .from('watched_content')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['watchedContent'] });
      queryClient.invalidateQueries({ queryKey: ['continueWatching'] });
      
      toast({
        title: 'Removido do histórico',
        description: `"${item.title}" foi removido do seu histórico.`,
      });
    } catch (error) {
      console.error('Error removing from history:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o item do histórico.',
        variant: 'destructive',
      });
    }
  };

  const formatWatchedTime = (date: string) => {
    const watchedDate = new Date(date);
    return watchedDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="bg-card/50 border-border p-8 text-center max-w-md">
            <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Faça login para ver seu histórico
            </h2>
            <p className="text-muted-foreground mb-4">
              Seu histórico de visualização aparecerá aqui após fazer login.
            </p>
            <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
              Fazer Login
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <History className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Histórico
                </h1>
                <p className="text-sm text-muted-foreground">
                  {filteredContent.length} {filteredContent.length === 1 ? 'item' : 'itens'} no histórico
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no histórico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                <SelectTrigger className="w-[130px] bg-card/50 border-border">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="movie">Filmes</SelectItem>
                  <SelectItem value="tv">Séries</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-[150px] bg-card/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="title">Título A-Z</SelectItem>
                  <SelectItem value="progress">Progresso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredContent.length === 0 ? (
            <Card className="bg-card/30 border-border p-12 text-center">
              <History className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchQuery || filterType !== 'all' 
                  ? 'Nenhum resultado encontrado' 
                  : 'Seu histórico está vazio'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterType !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece a assistir filmes e séries para ver seu histórico aqui.'}
              </p>
              {(searchQuery || filterType !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => { setSearchQuery(''); setFilterType('all'); }}
                >
                  Limpar filtros
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedContent).map(([dateGroup, items]) => (
                <div key={dateGroup}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">{dateGroup}</h2>
                    <span className="text-sm text-muted-foreground">
                      ({items.length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <Card 
                        key={item.id} 
                        className="bg-card/50 border-border hover:bg-card/70 transition-colors overflow-hidden"
                      >
                        <CardContent className="p-0">
                          <div className="flex gap-4">
                            {/* Poster */}
                            <div 
                              className="relative w-20 sm:w-24 flex-shrink-0 cursor-pointer"
                              onClick={() => handleViewDetails(item)}
                            >
                              <img
                                src={item.poster_path 
                                  ? `${TMDB_IMAGE_BASE}${item.poster_path}`
                                  : '/placeholder.svg'}
                                alt={item.title}
                                className="w-full h-28 sm:h-32 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="h-8 w-8 text-white" />
                              </div>
                              {/* Progress bar overlay */}
                              {item.progress_percent && item.progress_percent > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                                  <div 
                                    className="h-full bg-primary"
                                    style={{ width: `${item.progress_percent}%` }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 py-3 pr-3 flex flex-col justify-between min-w-0">
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h3 
                                    className="font-semibold text-foreground line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleViewDetails(item)}
                                  >
                                    {item.title || 'Título desconhecido'}
                                  </h3>
                                  <Badge 
                                    variant="secondary" 
                                    className="flex-shrink-0 text-xs"
                                  >
                                    {item.content_type === 'movie' ? (
                                      <><Film className="h-3 w-3 mr-1" /> Filme</>
                                    ) : (
                                      <><Tv className="h-3 w-3 mr-1" /> Série</>
                                    )}
                                  </Badge>
                                </div>

                                {/* Episode info for TV shows */}
                                {item.content_type === 'tv' && item.season && item.episode && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Temporada {item.season}, Episódio {item.episode}
                                  </p>
                                )}

                                {/* Progress */}
                                <div className="flex items-center gap-2 mt-2">
                                  <Progress 
                                    value={item.progress_percent || 0} 
                                    className="h-1.5 flex-1 max-w-[150px]"
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {item.progress_percent || 0}%
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{item.watched_at ? formatWatchedTime(item.watched_at) : '-'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handlePlay(item)}
                                    className="h-8 px-3 text-primary hover:text-primary hover:bg-primary/10"
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">
                                      {item.progress_percent && item.progress_percent > 0 
                                        ? 'Continuar' 
                                        : 'Assistir'}
                                    </span>
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-card border-border">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remover do histórico?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          "{item.title}" será removido do seu histórico. Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleRemoveFromHistory(item)}
                                          className="bg-destructive hover:bg-destructive/90"
                                        >
                                          Remover
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HistoryPage;
