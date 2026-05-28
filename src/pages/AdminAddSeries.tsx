import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Search, Loader2, Plus, Tv, ChevronLeft, CheckCircle2, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

interface TmdbSeriesResult {
  id: number; name: string; original_name: string; overview: string; poster_path: string | null;
  backdrop_path: string | null; first_air_date: string; vote_average: number; vote_count: number;
}

const AdminAddSeries: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [seriesName, setSeriesName] = useState('');
  const [availableAt, setAvailableAt] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<TmdbSeriesResult[]>([]);
  const [selected, setSelected] = useState<TmdbSeriesResult | null>(null);

  const searchTmdb = async (q?: string) => {
    const term = (q ?? seriesName).trim();
    if (!term) { setResults([]); return; }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('content', { body: { action: 'search', query: term, type: 'tv' } });
      if (error) throw error;
      setResults(data?.results?.slice(0, 8) || []);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setSearching(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (seriesName.trim()) searchTmdb(seriesName);
      else setResults([]);
    }, 400);
    return () => clearTimeout(t);
  }, [seriesName]);


  const handleSave = async () => {
    if (!selected) { toast({ title: 'Selecione uma série', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const availableAtIso = availableAt ? new Date(availableAt + 'T00:00:00').toISOString() : null;
      const { data: existing } = await supabase.from('series_catalog').select('id').eq('tmdb_id', selected.id).maybeSingle();
      if (existing) {
        if (availableAtIso) await (supabase as any).from('series_catalog').update({ available_at: availableAtIso }).eq('id', existing.id);
        toast({ title: 'Já existe' }); navigate(`/admin/edit-series/${existing.id}`); return;
      }
      const { data: inserted, error } = await supabase.from('series_catalog').insert({
        title: selected.name, tmdb_id: selected.id,
        poster_path: selected.poster_path,
        vote_average: selected.vote_average, vote_count: selected.vote_count,
        available_at: availableAtIso,
      } as any).select('id').single();
      if (error) throw error;
      if (availableAtIso && new Date(availableAtIso) > new Date()) {
        await (supabase as any).from('release_calendar').insert({
          title: selected.name,
          poster_url: selected.poster_path ? `${TMDB_IMG}/w500${selected.poster_path}` : null,
          backdrop_url: selected.backdrop_path ? `${TMDB_IMG}/w780${selected.backdrop_path}` : null,
          release_date: availableAt,
          content_type: 'tv',
          tmdb_id: selected.id,
        });
      }
      toast({ title: 'Série adicionada!' });
      navigate(`/admin/edit-series/${inserted.id}`);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="rounded-xl"><Link to="/admin/series"><ChevronLeft className="h-4 w-4" /> Voltar</Link></Button>
              <div className="p-2 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20">
                <Tv className="h-5 w-5 text-orange-400" />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Adicionar Série</h1>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-foreground text-sm">Buscar no TMDB</h2>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input autoFocus placeholder="Digite o nome da série..." value={seriesName} onChange={(e) => setSeriesName(e.target.value)} className="pl-10 pr-10 rounded-xl bg-background/50 border-border/30" />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              {results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {results.map((r) => (
                    <button key={r.id} onClick={() => setSelected(r)} className={`rounded-2xl overflow-hidden border-2 transition-all text-left ${selected?.id === r.id ? 'border-primary ring-2 ring-primary/20 scale-[1.02]' : 'border-border/20 hover:border-primary/40'}`}>
                      <img src={r.poster_path ? `${TMDB_IMG}/w185${r.poster_path}` : '/placeholder.svg'} alt={r.name} className="w-full aspect-[2/3] object-cover" />
                      <div className="p-2">
                        <p className="text-[11px] font-bold text-foreground truncate">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground">{r.first_air_date?.split('-')[0] || '—'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {selected && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-5 mb-6">
                <div className="flex gap-4">
                  <img src={selected.poster_path ? `${TMDB_IMG}/w185${selected.poster_path}` : '/placeholder.svg'} alt={selected.name} className="w-20 rounded-xl" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /><h3 className="font-black text-foreground truncate">{selected.name}</h3></div>
                    <p className="text-xs text-muted-foreground">{selected.original_name} • {selected.first_air_date?.split('-')[0]}</p>
                    <p className="text-xs text-muted-foreground">⭐ {selected.vote_average?.toFixed(1)} • TMDB ID: {selected.id}</p>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{selected.overview}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-3"><Calendar className="h-4 w-4 text-primary" /><h2 className="font-bold text-foreground text-sm">Data de lançamento (opcional)</h2></div>
            <Input type="date" value={availableAt} onChange={(e) => setAvailableAt(e.target.value)} className="rounded-xl bg-background/50 border-border/30" />
            <p className="text-[10px] text-muted-foreground mt-1.5">Se preenchido, a série aparece no calendário e fica marcada como lançamento agendado.</p>
          </div>

          <Button onClick={handleSave} disabled={saving || !selected} className="w-full gap-2 rounded-xl h-12 text-sm font-bold" size="lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Salvar Série
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminAddSeries;
