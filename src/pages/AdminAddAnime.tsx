import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

interface TmdbResult {
  id: number; title?: string; name?: string; original_title?: string; original_name?: string;
  overview: string; poster_path: string | null; backdrop_path: string | null;
  release_date?: string; first_air_date?: string; vote_average: number; vote_count: number; media_type?: string;
}

const AdminAddAnime: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [selected, setSelected] = useState<TmdbResult | null>(null);
  const [saveAs, setSaveAs] = useState<'movie' | 'tv'>('tv');

  const searchTmdb = async (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) { setResults([]); return; }
    setSearching(true);
    try {
      const [movieRes, tvRes] = await Promise.all([
        supabase.functions.invoke('content', { body: { action: 'search', query: term, type: 'movie' } }),
        supabase.functions.invoke('content', { body: { action: 'search', query: term, type: 'tv' } }),
      ]);
      const movies = (movieRes.data?.results || []).map((r: any) => ({ ...r, media_type: 'movie' }));
      const tvShows = (tvRes.data?.results || []).map((r: any) => ({ ...r, media_type: 'tv' }));
      setResults([...movies, ...tvShows].slice(0, 12));
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setSearching(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim()) searchTmdb(query);
      else setResults([]);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);


  const handleSelect = (r: TmdbResult) => { setSelected(r); setSaveAs(r.media_type === 'movie' ? 'movie' : 'tv'); };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const title = selected.title || selected.name || '';
      const originalTitle = selected.original_title || selected.original_name || '';
      const releaseDate = selected.release_date || selected.first_air_date || '';
      const year = releaseDate ? parseInt(releaseDate.split('-')[0]) : null;

      if (saveAs === 'movie') {
        const { data: existing } = await supabase.from('movies_catalog').select('id').eq('tmdb_id', selected.id).maybeSingle();
        if (existing) { toast({ title: 'Já existe' }); navigate(`/admin/edit-movie/${existing.id}`); return; }
        const { data: inserted, error } = await supabase.from('movies_catalog').insert({
          title, tmdb_id: selected.id,
          poster_path: selected.poster_path,
          vote_average: selected.vote_average, vote_count: selected.vote_count,
          genres: ['Animação'],
        } as any).select('id').single();
        if (error) throw error;
        toast({ title: 'Anime adicionado!' });
        navigate(`/admin/edit-movie/${inserted.id}`);
      } else {
        const { data: existing } = await supabase.from('series_catalog').select('id').eq('tmdb_id', selected.id).maybeSingle();
        if (existing) { toast({ title: 'Já existe' }); navigate(`/admin/edit-series/${existing.id}`); return; }
        const { data: inserted, error } = await supabase.from('series_catalog').insert({
          title, tmdb_id: selected.id,
          poster_path: selected.poster_path,
          vote_average: selected.vote_average, vote_count: selected.vote_count,
          genres: ['Animação'],
        } as any).select('id').single();
        if (error) throw error;
        toast({ title: 'Anime adicionado!' });
        navigate(`/admin/edit-series/${inserted.id}`);
      }
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
              <Button asChild variant="ghost" size="sm" className="rounded-xl"><Link to="/admin/animes"><ChevronLeft className="h-4 w-4" /> Voltar</Link></Button>
              <div className="p-2 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Adicionar Anime</h1>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-4"><Search className="h-4 w-4 text-primary" /><h2 className="font-bold text-foreground text-sm">Buscar no TMDB</h2></div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input autoFocus placeholder="Digite o nome do anime..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10 pr-10 rounded-xl bg-background/50 border-border/30" />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              {results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {results.map((r) => (
                    <button key={`${r.media_type}-${r.id}`} onClick={() => handleSelect(r)} className={`rounded-2xl overflow-hidden border-2 transition-all text-left ${selected?.id === r.id && selected?.media_type === r.media_type ? 'border-primary ring-2 ring-primary/20 scale-[1.02]' : 'border-border/20 hover:border-primary/40'}`}>
                      <div className="relative">
                        <img src={r.poster_path ? `${TMDB_IMG}/w185${r.poster_path}` : '/placeholder.svg'} alt={r.title || r.name} className="w-full aspect-[2/3] object-cover" />
                        <Badge variant="secondary" className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 bg-black/60 backdrop-blur-sm border-0">
                          {r.media_type === 'movie' ? 'Filme' : 'Série'}
                        </Badge>
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-bold text-foreground truncate">{r.title || r.name}</p>
                        <p className="text-[10px] text-muted-foreground">{(r.release_date || r.first_air_date)?.split('-')[0] || '—'}</p>
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
                  <img src={selected.poster_path ? `${TMDB_IMG}/w185${selected.poster_path}` : '/placeholder.svg'} alt={selected.title || selected.name} className="w-20 rounded-xl" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /><h3 className="font-black text-foreground truncate">{selected.title || selected.name}</h3></div>
                    <p className="text-xs text-muted-foreground">{selected.original_title || selected.original_name} • {(selected.release_date || selected.first_air_date)?.split('-')[0]}</p>
                    <p className="text-xs text-muted-foreground">⭐ {selected.vote_average?.toFixed(1)} • TMDB ID: {selected.id}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant={saveAs === 'movie' ? 'default' : 'outline'} onClick={() => setSaveAs('movie')} className="text-xs h-7 rounded-lg">Salvar como Filme</Button>
                      <Button size="sm" variant={saveAs === 'tv' ? 'default' : 'outline'} onClick={() => setSaveAs('tv')} className="text-xs h-7 rounded-lg">Salvar como Série</Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <Button onClick={handleSave} disabled={saving || !selected} className="w-full gap-2 rounded-xl h-12 text-sm font-bold" size="lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Salvar Anime
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminAddAnime;
