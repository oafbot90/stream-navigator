import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Layers, Search, Plus, Trash2, ArrowUp, ArrowDown, ChevronLeft, GripVertical, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { moviesCatalogService, CatalogMovie } from '@/services/moviesCatalogService';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroSliderItem {
  id: string;
  movie_id: string;
  position: number;
  is_active: boolean;
  created_at: string;
  movie?: CatalogMovie;
}

const AdminSlider: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<CatalogMovie[]>([]);
  const [searching, setSearching] = useState(false);

  const { data: sliderItems = [], isLoading } = useQuery({
    queryKey: ['admin-slider'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hero_slider').select('*').order('position', { ascending: true });
      if (error) throw error;
      const items: HeroSliderItem[] = [];
      for (const item of data) {
        try {
          const movie = await moviesCatalogService.getMovieWithStreams(item.movie_id);
          items.push({ ...item, movie });
        } catch {
          items.push(item as HeroSliderItem);
        }
      }
      return items;
    },
  });

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const results = await moviesCatalogService.searchMovies(search, 10);
      setSearchResults(results);
    } catch {
      toast({ title: 'Erro', description: 'Falha na busca.', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: async (movieId: string) => {
      const maxPos = sliderItems.length > 0 ? Math.max(...sliderItems.map(i => i.position)) + 1 : 0;
      const { error } = await supabase.from('hero_slider').insert({ movie_id: movieId, position: maxPos });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slider'] });
      toast({ title: 'Adicionado ao slider!' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro', description: e.message?.includes('unique') ? 'Já está no slider.' : 'Falha ao adicionar.', variant: 'destructive' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hero_slider').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slider'] });
      toast({ title: 'Removido do slider' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('hero_slider').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-slider'] }),
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const idx = sliderItems.findIndex(i => i.id === id);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sliderItems.length) return;
      const current = sliderItems[idx];
      const swap = sliderItems[swapIdx];
      await Promise.all([
        supabase.from('hero_slider').update({ position: swap.position }).eq('id', current.id),
        supabase.from('hero_slider').update({ position: current.position }).eq('id', swap.id),
      ]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-slider'] }),
  });

  const existingMovieIds = new Set(sliderItems.map(i => i.movie_id));

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20">
                  <Layers className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-foreground tracking-tight">Hero Slider</h1>
                  <p className="text-sm text-muted-foreground">Gerencie os destaques da página inicial</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20">{sliderItems.length} filmes</Badge>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link to="/admin"><ChevronLeft className="h-4 w-4 mr-1" /> Admin</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Current Slider Items */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Filmes no Slider</h2>
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : sliderItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 py-12 text-center">
                <Layers className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum filme no slider. Busque e adicione abaixo.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {sliderItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className={`rounded-2xl border p-3 flex items-center gap-4 transition-all duration-300 ${
                        item.is_active
                          ? 'border-primary/20 bg-gradient-to-r from-primary/5 to-transparent'
                          : 'border-border/20 bg-card/30 opacity-60'
                      }`}>
                        {/* Position indicator */}
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <span className="text-lg font-black text-muted-foreground/40 leading-none">{String(idx + 1).padStart(2, '0')}</span>
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/20" />
                        </div>

                        {/* Poster */}
                        <img
                          src={moviesCatalogService.getPosterUrl(item.movie?.poster_path || null, 'w185')}
                          alt={item.movie?.title || 'Filme'}
                          className="w-14 h-20 object-cover rounded-xl shrink-0"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate text-sm">{item.movie?.title || 'Filme não encontrado'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.movie?.release_year || '—'} • ⭐ {item.movie?.vote_average?.toFixed(1) || '—'}
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <div className="flex items-center gap-1.5 mr-2">
                            {item.is_active ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                            <Switch
                              checked={item.is_active}
                              onCheckedChange={(checked) => toggleMutation.mutate({ id: item.id, is_active: checked })}
                            />
                          </div>
                          <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => moveMutation.mutate({ id: item.id, direction: 'up' })} className="h-8 w-8 rounded-xl">
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" disabled={idx === sliderItems.length - 1} onClick={() => moveMutation.mutate({ id: item.id, direction: 'down' })} className="h-8 w-8 rounded-xl">
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeMutation.mutate(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Search & Add */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Adicionar ao Slider</h2>
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Buscar filme por título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-md rounded-xl bg-card/40 border-border/30"
              />
              <Button onClick={handleSearch} disabled={searching} className="gap-2 rounded-xl">
                <Search className="h-4 w-4" /> Buscar
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {searchResults.map((movie) => {
                  const alreadyAdded = existingMovieIds.has(movie.id);
                  return (
                    <motion.div key={movie.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <div className="rounded-2xl border border-border/20 bg-card/30 overflow-hidden group hover:border-primary/30 transition-all">
                        <div className="aspect-[2/3] relative overflow-hidden">
                          <img
                            src={moviesCatalogService.getPosterUrl(movie.poster_path, 'w342')}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          {alreadyAdded && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <Badge className="bg-primary/20 text-primary border-primary/30">Já no slider</Badge>
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-2">
                          <p className="text-xs font-bold text-foreground truncate">{movie.title}</p>
                          <Button
                            size="sm"
                            className="w-full gap-1 rounded-xl text-xs"
                            disabled={alreadyAdded || addMutation.isPending}
                            onClick={() => addMutation.mutate(movie.id)}
                          >
                            {alreadyAdded ? 'Adicionado' : <><Plus className="h-3 w-3" /> Adicionar</>}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminSlider;
