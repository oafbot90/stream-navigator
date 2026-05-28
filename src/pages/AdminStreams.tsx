import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle, XCircle, Loader2, ArrowLeft,
  AlertCircle, ChevronLeft, ChevronRight, Zap, ExternalLink,
  Film, Tv, Activity, ShieldAlert, TrendingUp
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface StreamRow {
  id: string; url: string; quality: string | null; stream_type: string | null;
  status: string | null; last_checked_at: string | null; movie_id?: string;
  episode_id?: string; content_name?: string; edit_link?: string;
}

const PAGE_SIZE = 500;
type StatusFilter = 'all' | 'active' | 'broken' | 'unknown';

const AdminStreams: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checkResult, setCheckResult] = useState<any>(null);
  const [movieFilter, setMovieFilter] = useState<StatusFilter>('all');
  const [episodeFilter, setEpisodeFilter] = useState<StatusFilter>('all');
  const [moviePage, setMoviePage] = useState(0);
  const [episodePage, setEpisodePage] = useState(0);

  const movieStreams = useQuery({
    queryKey: ['admin-movie-streams', movieFilter, moviePage],
    queryFn: async () => {
      let query = supabase.from('movie_streams').select('*, movies_catalog!inner(title)').order('created_at', { ascending: false }).range(moviePage * PAGE_SIZE, (moviePage + 1) * PAGE_SIZE - 1);
      if (movieFilter === 'active') query = query.eq('status', 'active');
      else if (movieFilter === 'broken') query = query.eq('status', 'broken');
      else if (movieFilter === 'unknown') query = query.or('status.is.null,status.eq.unknown');
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((s: any) => ({ ...s, content_name: s.movies_catalog?.title || '-', edit_link: `/admin/edit-movie/${s.movie_id}` })) as StreamRow[];
    },
  });

  const episodeStreams = useQuery({
    queryKey: ['admin-episode-streams', episodeFilter, episodePage],
    queryFn: async () => {
      let query = supabase.from('episode_streams').select('*, series_episodes!inner(title, season_number, episode_number, series_catalog:series_id(title, id))').order('created_at', { ascending: false }).range(episodePage * PAGE_SIZE, (episodePage + 1) * PAGE_SIZE - 1);
      if (episodeFilter === 'active') query = query.eq('status', 'active');
      else if (episodeFilter === 'broken') query = query.eq('status', 'broken');
      else if (episodeFilter === 'unknown') query = query.or('status.is.null,status.eq.unknown');
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((s: any) => {
        const ep = s.series_episodes;
        return { ...s, content_name: ep?.series_catalog?.title ? `${ep.series_catalog.title} - S${ep.season_number}E${ep.episode_number}` : ep?.title || '-', edit_link: ep?.series_catalog?.id ? `/admin/edit-series/${ep.series_catalog.id}` : undefined };
      }) as StreamRow[];
    },
  });

  const movieStats = useQuery({
    queryKey: ['admin-movie-streams-stats'],
    queryFn: async () => {
      const [total, active, broken] = await Promise.all([
        supabase.from('movie_streams').select('id', { count: 'exact', head: true }),
        supabase.from('movie_streams').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('movie_streams').select('id', { count: 'exact', head: true }).eq('status', 'broken'),
      ]);
      const t = total.count || 0, a = active.count || 0, b = broken.count || 0;
      return { total: t, active: a, broken: b, unknown: t - a - b };
    },
  });

  const episodeStats = useQuery({
    queryKey: ['admin-episode-streams-stats'],
    queryFn: async () => {
      const [total, active, broken] = await Promise.all([
        supabase.from('episode_streams').select('id', { count: 'exact', head: true }),
        supabase.from('episode_streams').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('episode_streams').select('id', { count: 'exact', head: true }).eq('status', 'broken'),
      ]);
      const t = total.count || 0, a = active.count || 0, b = broken.count || 0;
      return { total: t, active: a, broken: b, unknown: t - a - b };
    },
  });

  const checkMutation = useMutation({
    mutationFn: async (table?: string) => {
      const { data, error } = await supabase.functions.invoke('check-streams', { body: { table: table || 'all' } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCheckResult(data);
      queryClient.invalidateQueries({ queryKey: ['admin-movie-streams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-episode-streams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-movie-streams-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-episode-streams-stats'] });
      toast({ title: '✅ Verificação concluída' });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const ms = movieStats.data;
  const es = episodeStats.data;
  const totalStreams = (ms?.total || 0) + (es?.total || 0);
  const totalActive = (ms?.active || 0) + (es?.active || 0);
  const totalBroken = (ms?.broken || 0) + (es?.broken || 0);
  const totalUnknown = (ms?.unknown || 0) + (es?.unknown || 0);
  const healthPercent = totalStreams > 0 ? Math.round((totalActive / totalStreams) * 100) : 0;

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link to="/admin"><Button variant="ghost" size="icon" className="rounded-xl border border-border/30"><ArrowLeft className="h-4 w-4" /></Button></Link>
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 border border-teal-500/20">
                  <Activity className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-foreground tracking-tight">Monitor de Streams</h1>
                  <p className="text-xs text-muted-foreground">Status de todas as streams da plataforma</p>
                </div>
              </div>
              <Button onClick={() => checkMutation.mutate('all')} disabled={checkMutation.isPending} className="gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold shadow-lg shadow-teal-500/20" size="lg">
                {checkMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                {checkMutation.isPending ? 'Verificando...' : 'Verificar Todas'}
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { icon: <Activity className="h-5 w-5" />, label: 'Total', value: totalStreams, color: 'text-foreground', bg: 'from-muted/50' },
              { icon: <CheckCircle className="h-5 w-5" />, label: 'Ativas', value: totalActive, color: 'text-emerald-400', bg: 'from-emerald-500/10' },
              { icon: <XCircle className="h-5 w-5" />, label: 'Quebradas', value: totalBroken, color: 'text-destructive', bg: 'from-destructive/10' },
              { icon: <AlertCircle className="h-5 w-5" />, label: 'Pendentes', value: totalUnknown, color: 'text-yellow-400', bg: 'from-yellow-500/10' },
              { icon: <TrendingUp className="h-5 w-5" />, label: 'Saúde', value: `${healthPercent}%`, color: healthPercent > 70 ? 'text-emerald-400' : healthPercent > 40 ? 'text-yellow-400' : 'text-destructive', bg: 'from-primary/5' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className={`rounded-2xl border border-border/20 bg-gradient-to-br ${s.bg} to-transparent p-4 flex flex-col items-center gap-1`}>
                  <div className={s.color}>{s.icon}</div>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Check Result */}
          <AnimatePresence>
            {checkResult && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-5">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-2xl font-black text-foreground">{checkResult.total_checked}</p><p className="text-[10px] text-muted-foreground uppercase font-bold">Verificadas</p></div>
                  <div><p className="text-2xl font-black text-destructive">{checkResult.total_broken}</p><p className="text-[10px] text-muted-foreground uppercase font-bold">Quebradas</p></div>
                  <div><p className="text-2xl font-black text-emerald-400">{checkResult.total_fixed}</p><p className="text-[10px] text-muted-foreground uppercase font-bold">Corrigidas</p></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <Tabs defaultValue="movies" className="space-y-4">
            <TabsList className="bg-card/40 border border-border/20 p-1 rounded-2xl">
              <TabsTrigger value="movies" className="rounded-xl gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs">
                <Film className="h-4 w-4" /> Filmes {ms ? `(${ms.total})` : ''}
              </TabsTrigger>
              <TabsTrigger value="episodes" className="rounded-xl gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs">
                <Tv className="h-4 w-4" /> Episódios {es ? `(${es.total})` : ''}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="movies"><StreamPanel streams={movieStreams.data} isLoading={movieStreams.isLoading} filter={movieFilter} setFilter={(f) => { setMovieFilter(f); setMoviePage(0); }} stats={ms} page={moviePage} setPage={setMoviePage} /></TabsContent>
            <TabsContent value="episodes"><StreamPanel streams={episodeStreams.data} isLoading={episodeStreams.isLoading} filter={episodeFilter} setFilter={(f) => { setEpisodeFilter(f); setEpisodePage(0); }} stats={es} page={episodePage} setPage={setEpisodePage} /></TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

function StreamPanel({ streams, isLoading, filter, setFilter, stats, page, setPage }: {
  streams: StreamRow[] | undefined; isLoading: boolean; filter: StatusFilter;
  setFilter: (f: StatusFilter) => void; stats: { total: number; active: number; broken: number; unknown: number } | undefined;
  page: number; setPage: (p: number) => void;
}) {
  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!streams) return null;

  const filters: { value: StatusFilter; label: string; color?: string; icon?: React.ReactNode }[] = [
    { value: 'all', label: `Todas (${stats?.total ?? '...'})` },
    { value: 'active', label: `Ativas (${stats?.active ?? '...'})`, color: 'emerald', icon: <CheckCircle className="h-3 w-3" /> },
    { value: 'broken', label: `Quebradas (${stats?.broken ?? '...'})`, color: 'red', icon: <XCircle className="h-3 w-3" /> },
    { value: 'unknown', label: `Pendentes (${stats?.unknown ?? '...'})`, color: 'yellow', icon: <AlertCircle className="h-3 w-3" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map(f => {
          const active = filter === f.value;
          const colorClasses: Record<string, string> = {
            emerald: active ? 'bg-emerald-500 text-white border-emerald-500' : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10',
            red: active ? 'bg-destructive text-white border-destructive' : 'text-destructive border-destructive/30 hover:bg-destructive/10',
            yellow: active ? 'bg-yellow-500 text-white border-yellow-500' : 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10',
          };
          const cls = f.color ? colorClasses[f.color] : (active ? 'bg-foreground text-background border-foreground' : 'text-foreground border-border/30 hover:bg-muted/50');
          return (
            <button key={f.value} onClick={() => setFilter(f.value)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${cls}`}>
              {f.icon}{f.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/20 overflow-hidden bg-card/30 backdrop-blur-sm">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/60 backdrop-blur-sm border-b border-border/20">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-12">#</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Conteúdo</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden lg:table-cell">URL</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-24">Qual.</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-28">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden md:table-cell w-40">Verificado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {streams.length === 0 && (
                <tr><td colSpan={6} className="text-center py-16 text-muted-foreground"><ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" />Nenhuma stream</td></tr>
              )}
              {streams.map((s, i) => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-4 py-2.5 text-[11px] text-muted-foreground/60 font-mono">{page * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-2.5">
                    {s.edit_link ? (
                      <Link to={s.edit_link} className="flex items-center gap-1.5 text-foreground font-semibold hover:text-primary transition-colors text-xs max-w-[250px]">
                        <span className="truncate">{s.content_name}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
                      </Link>
                    ) : <span className="text-xs font-semibold text-foreground truncate max-w-[250px] block">{s.content_name}</span>}
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell"><span className="font-mono text-[10px] text-muted-foreground/60 truncate max-w-[300px] block">{s.url}</span></td>
                  <td className="px-4 py-2.5"><Badge variant="outline" className="text-[10px] font-semibold rounded-lg">{s.quality || '-'}</Badge></td>
                  <td className="px-4 py-2.5"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-[10px] text-muted-foreground">{s.last_checked_at ? new Date(s.last_checked_at).toLocaleString('pt-BR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground font-mono">{page * PAGE_SIZE + 1} - {page * PAGE_SIZE + streams.length} (pág. {page + 1})</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded-xl text-xs"><ChevronLeft className="h-3.5 w-3.5 mr-1" />Anterior</Button>
          <Button variant="outline" size="sm" disabled={streams.length < PAGE_SIZE} onClick={() => setPage(page + 1)} className="rounded-xl text-xs">Próximo<ChevronRight className="h-3.5 w-3.5 ml-1" /></Button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === 'broken') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20"><span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />Quebrada</span>;
  if (status === 'active') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Ativa</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"><span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />Pendente</span>;
}

export default AdminStreams;
