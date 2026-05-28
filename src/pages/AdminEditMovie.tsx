import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, Save, Plus, Trash2, Loader2, Film, Link2, Image, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface MovieData {
  id: string; title: string; poster_path: string | null; vote_average: number | null;
  vote_count: number | null; genres: string[] | null; tmdb_id: number | null;
  created_at: string | null; updated_at: string | null;
  original_title?: string | null; overview?: string | null; backdrop_path?: string | null;
  release_date?: string | null; release_year?: number | null; runtime?: number | null;
  imdb_id?: string | null; content_type?: string; source?: string;
}

interface StreamData { id: string; url: string; quality: string | null; stream_type: string | null; }

const AdminEditMovie: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [movie, setMovie] = useState<MovieData | null>(null);
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [genresText, setGenresText] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const [movieRes, streamsRes] = await Promise.all([
        supabase.from('movies_catalog').select('*').eq('id', id).single(),
        supabase.from('movie_streams').select('*').eq('movie_id', id),
      ]);
      if (movieRes.error) { toast({ title: 'Erro', variant: 'destructive' }); navigate('/admin/movies'); return; }
      setMovie(movieRes.data as MovieData);
      setGenresText((movieRes.data.genres || []).join(', '));
      setStreams((streamsRes.data || []) as StreamData[]);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const updateField = (field: keyof MovieData, value: any) => { if (movie) setMovie({ ...movie, [field]: value }); };
  const updateStream = (index: number, field: keyof StreamData, value: string) => { setStreams(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s)); };
  const addStream = () => { setStreams(prev => [...prev, { id: `new-${Date.now()}`, url: '', quality: 'HD', stream_type: 'direct' }]); };
  const removeStream = (index: number) => { setStreams(prev => prev.filter((_, i) => i !== index)); };

  const handleSave = async () => {
    if (!movie || !id) return;
    setSaving(true);
    try {
      const genres = genresText.split(',').map(g => g.trim()).filter(Boolean);
      const { error: movieError } = await supabase.from('movies_catalog').update({
        title: movie.title,
        poster_path: movie.poster_path, vote_average: movie.vote_average,
        genres, tmdb_id: movie.tmdb_id,
      } as any).eq('id', id);
      if (movieError) throw movieError;
      await supabase.from('movie_streams').delete().eq('movie_id', id);
      const validStreams = streams.filter(s => s.url.trim());
      if (validStreams.length > 0) {
        const { error: streamError } = await supabase.from('movie_streams').insert(
          validStreams.map(s => ({ movie_id: id, url: s.url.trim(), quality: s.quality || 'HD', stream_type: s.stream_type || 'direct' }))
        );
        if (streamError) throw streamError;
      }
      toast({ title: 'Salvo!', description: 'Filme atualizado.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  if (loading) return <Layout><div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></Layout>;
  if (!movie) return null;

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/movies')} className="gap-1 rounded-xl"><ChevronLeft size={16} /> Voltar</Button>
              <div className="p-2 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20"><Film className="h-5 w-5 text-blue-400" /></div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Editar Filme</h1>
            </div>
          </motion.div>

          <div className="space-y-6">
            {/* Basic Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
                <div className="flex items-center gap-2 mb-4"><Info className="h-4 w-4 text-primary" /><h2 className="font-bold text-foreground text-sm">Informações Básicas</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div><Label className="text-xs text-muted-foreground">Título</Label><Input value={movie.title} onChange={e => updateField('title', e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                  <div><Label className="text-xs text-muted-foreground">Título Original</Label><Input value={movie.original_title || ''} onChange={e => updateField('original_title', e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                </div>
                <div className="mb-4"><Label className="text-xs text-muted-foreground">Sinopse</Label><Textarea rows={3} value={movie.overview || ''} onChange={e => updateField('overview', e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div><Label className="text-xs text-muted-foreground">Nota</Label><Input type="number" step="0.1" value={movie.vote_average ?? 0} onChange={e => updateField('vote_average', parseFloat(e.target.value) || 0)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                  <div><Label className="text-xs text-muted-foreground">Ano</Label><Input type="number" value={movie.release_year ?? ''} onChange={e => updateField('release_year', parseInt(e.target.value) || null)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                  <div><Label className="text-xs text-muted-foreground">Duração (min)</Label><Input type="number" value={movie.runtime ?? ''} onChange={e => updateField('runtime', parseInt(e.target.value) || null)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                  <div><Label className="text-xs text-muted-foreground">TMDB ID</Label><Input type="number" value={movie.tmdb_id ?? ''} onChange={e => updateField('tmdb_id', parseInt(e.target.value) || null)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Gêneros (vírgula)</Label><Input value={genresText} onChange={e => setGenresText(e.target.value)} placeholder="Ação, Drama" className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
              </div>
            </motion.div>

            {/* Images */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
                <div className="flex items-center gap-2 mb-4"><Image className="h-4 w-4 text-primary" /><h2 className="font-bold text-foreground text-sm">Imagens</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label className="text-xs text-muted-foreground">Poster Path</Label><Input value={movie.poster_path || ''} onChange={e => updateField('poster_path', e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                  <div><Label className="text-xs text-muted-foreground">Backdrop Path</Label><Input value={movie.backdrop_path || ''} onChange={e => updateField('backdrop_path', e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                </div>
              </div>
            </motion.div>

            {/* Streams */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /><h2 className="font-bold text-foreground text-sm">Streams de Vídeo</h2></div>
                  <Button size="sm" variant="outline" onClick={addStream} className="gap-1 rounded-xl text-xs"><Plus size={14} /> Adicionar</Button>
                </div>
                {streams.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Nenhum stream. Adicione um link.</p>}
                <div className="space-y-2">
                  {streams.map((stream, i) => (
                    <div key={stream.id} className="flex gap-2 items-center rounded-xl bg-background/30 border border-border/10 p-2.5">
                      <Input value={stream.url} onChange={e => updateStream(i, 'url', e.target.value)} placeholder="https://..." className="flex-1 h-8 text-xs rounded-lg bg-background/50 border-border/20" />
                      <Input value={stream.quality || ''} onChange={e => updateStream(i, 'quality', e.target.value)} placeholder="HD" className="w-20 h-8 text-xs rounded-lg bg-background/50 border-border/20" />
                      <select
                        value={stream.stream_type || 'direct'}
                        onChange={e => updateStream(i, 'stream_type', e.target.value)}
                        className="h-8 w-24 text-xs rounded-lg bg-background/50 border border-border/20 px-2"
                      >
                        <option value="direct">Direto</option>
                        <option value="iframe">Iframe</option>
                      </select>
                      <Button size="icon" variant="ghost" onClick={() => removeStream(i)} className="text-destructive h-8 w-8 rounded-lg shrink-0"><Trash2 size={14} /></Button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <Button onClick={handleSave} disabled={saving} className="w-full gap-2 rounded-xl h-12 text-sm font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />} {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminEditMovie;
