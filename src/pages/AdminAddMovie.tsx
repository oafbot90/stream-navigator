import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, Plus, Film, ChevronLeft, Link2, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

interface TmdbResult {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

const AdminAddMovie: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [movieName, setMovieName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoQuality, setVideoQuality] = useState('HD');
  const [availableAt, setAvailableAt] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [selected, setSelected] = useState<TmdbResult | null>(null);

  const searchTmdb = async (q?: string) => {
    const term = (q ?? movieName).trim();
    if (!term) { setResults([]); return; }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('content', { body: { action: 'search', query: term, type: 'movie' } });
      if (error) throw error;
      setResults(data?.results?.slice(0, 8) || []);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setSearching(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (movieName.trim()) searchTmdb(movieName);
      else setResults([]);
    }, 400);
    return () => clearTimeout(t);
  }, [movieName]);


  const handleSave = async () => {
    if (!selected) { toast({ title: 'Selecione um filme', variant: 'destructive' }); return; }
    if (!videoUrl.trim()) { toast({ title: 'Insira a URL do vídeo', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const availableAtIso = availableAt ? new Date(availableAt + 'T00:00:00').toISOString() : null;
      const { data: existing } = await supabase.from('movies_catalog').select('id').eq('tmdb_id', selected.id).maybeSingle();
      let movieId: string;
      if (existing) {
        movieId = existing.id;
        await supabase.from('movies_catalog').update({ updated_at: new Date().toISOString(), available_at: availableAtIso } as any).eq('id', movieId);
        toast({ title: 'Filme já existe', description: 'Adicionando stream ao filme existente.' });
      } else {
        const { data: inserted, error: insertErr } = await supabase.from('movies_catalog').insert({
          title: selected.title, tmdb_id: selected.id,
          poster_path: selected.poster_path,
          vote_average: selected.vote_average, vote_count: selected.vote_count,
          available_at: availableAtIso,
        } as any).select('id').single();
        if (insertErr) throw insertErr;
        movieId = inserted.id;
      }
      const { error: streamErr } = await supabase.from('movie_streams').insert({ movie_id: movieId, url: videoUrl, quality: videoQuality, stream_type: 'direct' });
      if (streamErr) throw streamErr;

      // Also create a release_calendar entry when scheduled in the future
      if (availableAtIso && new Date(availableAtIso) > new Date()) {
        await (supabase as any).from('release_calendar').insert({
          title: selected.title,
          poster_url: selected.poster_path ? `${TMDB_IMG}/w500${selected.poster_path}` : null,
          backdrop_url: selected.backdrop_path ? `${TMDB_IMG}/w780${selected.backdrop_path}` : null,
          release_date: availableAt,
          content_type: 'movie',
          tmdb_id: selected.id,
        });
      }
      toast({ title: 'Filme adicionado!', description: `${selected.title} salvo com sucesso.` });
      navigate('/admin/movies');
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
              <Button asChild variant="ghost" size="sm" className="rounded-xl"><Link to="/admin/movies"><ChevronLeft className="h-4 w-4" /> Voltar</Link></Button>
              <div className="p-2 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20">
                <Film className="h-5 w-5 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Adicionar Filme</h1>
            </div>
          </motion.div>

          {/* Step 1: Video URL */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-foreground text-sm">URL do Vídeo</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">URL do stream</Label>
                  <Input placeholder="https://..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Qualidade</Label>
                  <Input placeholder="HD, FHD, 4K..." value={videoQuality} onChange={(e) => setVideoQuality(e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" />
                </div>
                <div className="sm:col-span-3">
                  <Label className="text-xs text-muted-foreground">Disponível a partir de (opcional)</Label>
                  <Input type="date" value={availableAt} onChange={(e) => setAvailableAt(e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" />
                  <p className="text-[10px] text-muted-foreground mt-1">Se preenchido, será exibido no calendário e marcado como lançamento agendado.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 2: Search TMDB */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-foreground text-sm">Buscar no TMDB</h2>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input autoFocus placeholder="Digite o nome do filme..." value={movieName} onChange={(e) => setMovieName(e.target.value)} className="pl-10 pr-10 rounded-xl bg-background/50 border-border/30" />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              {results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {results.map((r) => (
                    <button key={r.id} onClick={() => setSelected(r)} className={`rounded-2xl overflow-hidden border-2 transition-all text-left ${selected?.id === r.id ? 'border-primary ring-2 ring-primary/20 scale-[1.02]' : 'border-border/20 hover:border-primary/40'}`}>
                      <img src={r.poster_path ? `${TMDB_IMG}/w185${r.poster_path}` : '/placeholder.svg'} alt={r.title} className="w-full aspect-[2/3] object-cover" />
                      <div className="p-2">
                        <p className="text-[11px] font-bold text-foreground truncate">{r.title}</p>
                        <p className="text-[10px] text-muted-foreground">{r.release_date?.split('-')[0] || '—'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Selected preview */}
          {selected && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-5 mb-6">
                <div className="flex gap-4">
                  <img src={selected.poster_path ? `${TMDB_IMG}/w185${selected.poster_path}` : '/placeholder.svg'} alt={selected.title} className="w-20 rounded-xl" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-black text-foreground truncate">{selected.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{selected.original_title} • {selected.release_date?.split('-')[0]}</p>
                    <p className="text-xs text-muted-foreground">⭐ {selected.vote_average?.toFixed(1)} • TMDB ID: {selected.id}</p>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{selected.overview}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <Button onClick={handleSave} disabled={saving || !selected || !videoUrl.trim()} className="w-full gap-2 rounded-xl h-12 text-sm font-bold" size="lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Salvar Filme
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminAddMovie;
