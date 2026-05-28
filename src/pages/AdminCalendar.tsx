import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Calendar as CalIcon, Plus, Trash2, Edit, Search, Loader2, CheckCircle2,
  Link2, Film, Tv, Info, X, ChevronLeft,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { tmdbApi } from '@/services/tmdbApi';
import { motion } from 'framer-motion';

const ADMIN_EMAILS = ['alezin1299@gmail.com', 'alezin1788@gmail.com'];
const TMDB_IMG = 'https://image.tmdb.org/t/p';

type ContentType = 'movie' | 'tv' | 'anime' | 'event';

interface ReleaseEntry {
  id: string;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  release_date: string;
  content_type: ContentType;
  tmdb_id: number | null;
  season_number: number | null;
  episode_number: number | null;
  created_at: string;
}

interface EpisodeDraft {
  key: string;
  season_number: number;
  episode_number: number;
  title: string;
  still_path: string | null;
  air_date: string | null;
  streamUrl: string;
  streamQuality: string;
}

const AdminCalendar: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  const [entries, setEntries] = useState<ReleaseEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form open/close (inline panel, not a dialog)
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [contentType, setContentType] = useState<ContentType>('movie');
  const [releaseDate, setReleaseDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [title, setTitle] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [tmdbId, setTmdbId] = useState<string>('');
  const [overview, setOverview] = useState('');

  // Movie: single stream
  const [movieUrl, setMovieUrl] = useState('');
  const [movieQuality, setMovieQuality] = useState('HD');

  // Series/anime: episodes
  const [episodes, setEpisodes] = useState<EpisodeDraft[]>([]);
  const [addingEp, setAddingEp] = useState(false);
  const [tmdbSeasons, setTmdbSeasons] = useState<Record<number, any[]>>({});

  // TMDB search
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!isAdmin) { navigate('/'); return; }
    void loadEntries();
  }, [user, isAdmin]);

  async function loadEntries() {
    setLoadingList(true);
    const { data, error } = await (supabase as any)
      .from('release_calendar').select('*').order('release_date', { ascending: true });
    if (error) toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    else setEntries((data || []) as ReleaseEntry[]);
    setLoadingList(false);
  }

  function resetForm() {
    setEditingId(null);
    setContentType('movie');
    setReleaseDate(format(new Date(), 'yyyy-MM-dd'));
    setTitle(''); setPosterUrl(''); setBackdropUrl(''); setTmdbId(''); setOverview('');
    setMovieUrl(''); setMovieQuality('HD');
    setEpisodes([]); setTmdbSeasons({});
    setTmdbQuery(''); setTmdbResults([]);
  }

  function openNew() { resetForm(); setFormOpen(true); }
  function openEdit(e: ReleaseEntry) {
    resetForm();
    setEditingId(e.id);
    setContentType(e.content_type);
    setReleaseDate(e.release_date);
    setTitle(e.title);
    setPosterUrl(e.poster_url || '');
    setBackdropUrl(e.backdrop_url || '');
    setTmdbId(e.tmdb_id ? String(e.tmdb_id) : '');
    setFormOpen(true);
  }

  async function doTmdbSearch() {
    if (!tmdbQuery.trim()) return;
    setSearching(true);
    try {
      const wantedType = contentType === 'movie' ? 'movie' : 'tv';
      const { data, error } = await supabase.functions.invoke('content', {
        body: { action: 'search', query: tmdbQuery, type: wantedType },
      });
      if (error) throw error;
      setTmdbResults((data?.results || []).slice(0, 8));
      if (!data?.results?.length) toast({ title: 'Nenhum resultado', variant: 'destructive' });
    } catch (err: any) {
      toast({ title: 'Erro TMDB', description: err.message, variant: 'destructive' });
    } finally { setSearching(false); }
  }

  function pickTmdb(item: any) {
    setTitle(item.title || item.name || '');
    setPosterUrl(item.poster_path ? `${TMDB_IMG}/w500${item.poster_path}` : '');
    setBackdropUrl(item.backdrop_path ? `${TMDB_IMG}/w780${item.backdrop_path}` : '');
    // NÃO sobrescrevemos a data de lançamento — ela é definida manualmente pelo admin
    // (data em que o conteúdo ficará disponível no app, separada da data oficial do TMDB).
    setTmdbId(String(item.id));
    setOverview(item.overview || '');
    setTmdbResults([]);
  }

  // ----- Episodes (series/anime) -----
  async function ensureSeasonLoaded(season: number): Promise<any[] | null> {
    if (tmdbSeasons[season]) return tmdbSeasons[season];
    if (!tmdbId) return null;
    try {
      const sd = await tmdbApi.getSeasonDetails(Number(tmdbId), season);
      if (sd?.episodes) {
        setTmdbSeasons(prev => ({ ...prev, [season]: sd.episodes }));
        return sd.episodes;
      }
    } catch {}
    return null;
  }

  async function addEpisode() {
    if (addingEp) return;
    setAddingEp(true);
    try {
      let targetSeason = episodes.length > 0 ? Math.max(...episodes.map(e => e.season_number)) : 1;
      let seasonEps = await ensureSeasonLoaded(targetSeason);
      let existing = episodes.filter(e => e.season_number === targetSeason).length;
      const realCount = seasonEps?.length ?? 0;
      if (seasonEps && existing >= realCount) {
        targetSeason += 1;
        seasonEps = await ensureSeasonLoaded(targetSeason);
        existing = 0;
      }
      const nextEpNum = existing + 1;
      const tmdbEp = seasonEps?.find((e: any) => e.episode_number === nextEpNum);
      setEpisodes(prev => [...prev, {
        key: `new-${Date.now()}-${Math.random()}`,
        season_number: targetSeason,
        episode_number: nextEpNum,
        title: tmdbEp?.name || `Episódio ${nextEpNum}`,
        still_path: tmdbEp?.still_path || null,
        air_date: tmdbEp?.air_date || null,
        streamUrl: '',
        streamQuality: 'HD',
      }]);
    } finally { setAddingEp(false); }
  }

  function updateEpisode(idx: number, patch: Partial<EpisodeDraft>) {
    setEpisodes(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e));
  }
  function removeEpisode(idx: number) {
    setEpisodes(prev => prev.filter((_, i) => i !== idx));
  }

  // ----- Persistence helpers (catalog + streams) -----
  async function ensureMovie(): Promise<string | null> {
    const id = tmdbId ? Number(tmdbId) : null;
    if (id) {
      const { data: existing } = await supabase.from('movies_catalog').select('id').eq('tmdb_id', id).maybeSingle();
      if (existing?.id) {
        // update available_at if scheduling in future
        await (supabase as any).from('movies_catalog')
          .update({ available_at: releaseDate ? new Date(releaseDate + 'T00:00:00').toISOString() : null })
          .eq('id', existing.id);
        return existing.id;
      }
    }
    const payload: any = {
      title: title.trim(),
      tmdb_id: id,
      poster_path: posterUrl.includes('/t/p/') ? posterUrl.split('/').pop() : posterUrl || null,
      vote_average: 0, vote_count: 0,
      available_at: releaseDate ? new Date(releaseDate + 'T00:00:00').toISOString() : null,
    };
    const { data, error } = await (supabase as any).from('movies_catalog').insert(payload).select('id').single();
    if (error) { toast({ title: 'Erro ao criar filme', description: error.message, variant: 'destructive' }); return null; }
    return data?.id || null;
  }

  async function ensureSeries(): Promise<string | null> {
    const id = tmdbId ? Number(tmdbId) : null;
    if (id) {
      const { data: existing } = await supabase.from('series_catalog').select('id').eq('tmdb_id', id).maybeSingle();
      if (existing?.id) {
        await (supabase as any).from('series_catalog')
          .update({ available_at: releaseDate ? new Date(releaseDate + 'T00:00:00').toISOString() : null })
          .eq('id', existing.id);
        return existing.id;
      }
    }
    const payload: any = {
      title: title.trim(),
      tmdb_id: id,
      poster_path: posterUrl.includes('/t/p/') ? posterUrl.split('/').pop() : posterUrl || null,
      vote_average: 0, vote_count: 0,
      available_at: releaseDate ? new Date(releaseDate + 'T00:00:00').toISOString() : null,
    };
    const { data, error } = await (supabase as any).from('series_catalog').insert(payload).select('id').single();
    if (error) { toast({ title: 'Erro ao criar série', description: error.message, variant: 'destructive' }); return null; }
    return data?.id || null;
  }

  async function persistMovieStream() {
    if (!movieUrl.trim()) return true;
    const movieId = await ensureMovie();
    if (!movieId) return false;
    const { error } = await supabase.from('movie_streams').insert({
      movie_id: movieId, url: movieUrl.trim(), quality: movieQuality || 'HD', stream_type: 'direct',
    });
    if (error && !String(error.message).includes('duplicate')) {
      toast({ title: 'Erro stream', description: error.message, variant: 'destructive' }); return false;
    }
    return true;
  }

  async function persistSeriesEpisodes() {
    const validEps = episodes.filter(e => e.streamUrl.trim() || e.title.trim());
    if (validEps.length === 0) return true;
    const seriesId = await ensureSeries();
    if (!seriesId) return false;
    for (const ep of validEps) {
      let episodeId: string | null = null;
      const { data: ex } = await supabase
        .from('series_episodes').select('id')
        .eq('series_id', seriesId).eq('season_number', ep.season_number).eq('episode_number', ep.episode_number)
        .maybeSingle();
      if (ex?.id) {
        episodeId = ex.id;
        await supabase.from('series_episodes').update({ title: ep.title } as any).eq('id', episodeId);
      } else {
        const { data: ins, error: insErr } = await supabase.from('series_episodes').insert({
          series_id: seriesId,
          season_number: ep.season_number,
          episode_number: ep.episode_number,
          title: ep.title,
        } as any).select('id').single();
        if (insErr) { toast({ title: 'Erro episódio', description: insErr.message, variant: 'destructive' }); return false; }
        episodeId = ins.id;
      }
      if (ep.streamUrl.trim() && episodeId) {
        await supabase.from('episode_streams').delete().eq('episode_id', episodeId);
        const { error: strErr } = await supabase.from('episode_streams').insert({
          episode_id: episodeId, url: ep.streamUrl.trim(),
          quality: ep.streamQuality || 'HD', stream_type: 'direct',
        });
        if (strErr) { toast({ title: 'Erro stream', description: strErr.message, variant: 'destructive' }); return false; }
      }
    }
    return true;
  }

  async function saveEntry() {
    if (!title.trim() || !releaseDate) {
      toast({ title: 'Preencha título e data', variant: 'destructive' }); return;
    }
    setSaving(true);

    // Persist catalog/streams first
    let ok = true;
    if (contentType === 'movie') ok = await persistMovieStream();
    else if (contentType === 'tv' || contentType === 'anime') ok = await persistSeriesEpisodes();
    if (!ok) { setSaving(false); return; }

    // Determine season/episode for the calendar entry (first ep if any)
    const firstEp = episodes[0];

    const payload: any = {
      title: title.trim(),
      poster_url: posterUrl.trim() || null,
      backdrop_url: backdropUrl.trim() || null,
      release_date: releaseDate,
      content_type: contentType,
      tmdb_id: tmdbId ? Number(tmdbId) : null,
      season_number: firstEp?.season_number ?? null,
      episode_number: firstEp?.episode_number ?? null,
      description: overview || null,
    };
    const q = editingId
      ? (supabase as any).from('release_calendar').update(payload).eq('id', editingId)
      : (supabase as any).from('release_calendar').insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) { toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' }); return; }

    toast({ title: editingId ? 'Atualizado!' : 'Lançamento criado!' });
    setFormOpen(false);
    resetForm();
    void loadEntries();
  }

  async function deleteEntry(id: string) {
    if (!confirm('Remover esta entrada?')) return;
    const { error } = await (supabase as any).from('release_calendar').delete().eq('id', id);
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    setEntries(e => e.filter(x => x.id !== id));
  }

  if (!user || !isAdmin) return null;

  const isMovie = contentType === 'movie';
  const isSeriesLike = contentType === 'tv' || contentType === 'anime';
  const isEvent = contentType === 'event';
  const seasons = [...new Set(episodes.map(e => e.season_number))].sort((a, b) => a - b);

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  <CalIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight">Calendário de Lançamentos</h1>
                  <p className="text-xs text-muted-foreground">Programe lançamentos e anexe player ao catálogo</p>
                </div>
              </div>
              {!formOpen && (
                <Button onClick={openNew} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Novo lançamento</Button>
              )}
            </div>
          </motion.div>

          {formOpen && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 mb-10">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editingId ? 'Editar lançamento' : 'Novo lançamento'}</h2>
                <Button variant="ghost" size="sm" onClick={() => { setFormOpen(false); resetForm(); }} className="gap-1 rounded-xl">
                  <X className="h-4 w-4" /> Fechar
                </Button>
              </div>

              {/* Tipo + Data */}
              <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm">Tipo & Data de lançamento</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo de conteúdo</Label>
                    <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                      <SelectTrigger className="rounded-xl bg-background/50 border-border/30 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="movie">Filme</SelectItem>
                        <SelectItem value="tv">Série</SelectItem>
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="event">Evento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Data de lançamento</Label>
                    <Input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" />
                    <p className="text-[10px] text-muted-foreground mt-1">Conteúdo ficará disponível a partir desta data.</p>
                  </div>
                </div>
              </div>

              {/* TMDB search (skip for events) */}
              {!isEvent && (
                <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm">Buscar no TMDB</h3>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <Input placeholder={isMovie ? 'Nome do filme...' : 'Nome da série/anime...'} value={tmdbQuery} onChange={(e) => setTmdbQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doTmdbSearch()} className="rounded-xl bg-background/50 border-border/30" />
                    <Button onClick={doTmdbSearch} disabled={searching} className="gap-2 shrink-0 rounded-xl">
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
                    </Button>
                  </div>
                  {tmdbResults.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {tmdbResults.map((r) => (
                        <button key={r.id} onClick={() => pickTmdb(r)} className={`rounded-2xl overflow-hidden border-2 transition-all text-left ${String(r.id) === tmdbId ? 'border-primary ring-2 ring-primary/20 scale-[1.02]' : 'border-border/20 hover:border-primary/40'}`}>
                          <img src={r.poster_path ? `${TMDB_IMG}/w185${r.poster_path}` : '/placeholder.svg'} alt={r.title || r.name} className="w-full aspect-[2/3] object-cover" />
                          <div className="p-2">
                            <p className="text-[11px] font-bold truncate">{r.title || r.name}</p>
                            <p className="text-[10px] text-muted-foreground">{(r.release_date || r.first_air_date || '').slice(0, 4) || '—'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Preview / manual fields */}
              <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  {isMovie ? <Film className="h-4 w-4 text-primary" /> : <Tv className="h-4 w-4 text-primary" />}
                  <h3 className="font-bold text-sm">Informações</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[140px,1fr] gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Poster</Label>
                    <div className="mt-1 aspect-[2/3] rounded-xl overflow-hidden bg-background/50 border border-border/30">
                      <img src={posterUrl || '/placeholder.svg'} alt="poster" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Título</Label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Poster URL</Label>
                        <Input value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} placeholder="https://image.tmdb.org/..." className="rounded-xl bg-background/50 border-border/30 mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Backdrop URL</Label>
                        <Input value={backdropUrl} onChange={(e) => setBackdropUrl(e.target.value)} placeholder="https://image.tmdb.org/..." className="rounded-xl bg-background/50 border-border/30 mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">TMDB ID</Label>
                      <Input value={tmdbId} onChange={(e) => setTmdbId(e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" />
                    </div>
                  </div>
                </div>
                {selected_preview(title, overview, tmdbId)}
              </div>

              {/* Movie URL */}
              {isMovie && (
                <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Link2 className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm">URL do Vídeo (opcional)</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">Será salvo em <code>movies_catalog</code> + <code>movie_streams</code>. O conteúdo só aparece após a data de lançamento (campo <code>available_at</code>).</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">URL do stream</Label>
                      <Input placeholder="https://... m3u8, mp4, embed" value={movieUrl} onChange={(e) => setMovieUrl(e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Qualidade</Label>
                      <Input value={movieQuality} onChange={(e) => setMovieQuality(e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" />
                    </div>
                  </div>
                </div>
              )}

              {/* Episodes for series/anime */}
              {isSeriesLike && (
                <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Tv className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-sm">Episódios</h3>
                      <Badge variant="secondary" className="text-[10px]">{episodes.length}</Badge>
                    </div>
                    <Button size="sm" onClick={addEpisode} disabled={addingEp || !tmdbId} className="gap-1 rounded-xl text-xs">
                      {addingEp ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Episódio
                    </Button>
                  </div>
                  {!tmdbId && <p className="text-[11px] text-muted-foreground mb-2">Busque a série no TMDB para adicionar episódios automaticamente.</p>}
                  {episodes.length === 0 && tmdbId && <p className="text-xs text-muted-foreground text-center py-4">Nenhum episódio adicionado.</p>}
                  {seasons.map(sn => (
                    <div key={sn} className="mb-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Temporada {sn}</h4>
                      <div className="space-y-1.5">
                        {episodes.filter(e => e.season_number === sn).map(ep => {
                          const idx = episodes.indexOf(ep);
                          return (
                            <div key={ep.key} className="grid grid-cols-12 gap-1.5 items-center rounded-xl bg-background/30 border border-border/10 p-2">
                              <div className="col-span-1"><Input type="number" value={ep.season_number} onChange={e => updateEpisode(idx, { season_number: parseInt(e.target.value) || 1 })} className="h-7 text-[10px] rounded-lg bg-background/50 border-border/20 px-1.5" /></div>
                              <div className="col-span-1"><Input type="number" value={ep.episode_number} onChange={e => updateEpisode(idx, { episode_number: parseInt(e.target.value) || 1 })} className="h-7 text-[10px] rounded-lg bg-background/50 border-border/20 px-1.5" /></div>
                              <div className="col-span-3"><Input value={ep.title} onChange={e => updateEpisode(idx, { title: e.target.value })} className="h-7 text-[10px] rounded-lg bg-background/50 border-border/20 px-1.5" /></div>
                              <div className="col-span-5"><Input value={ep.streamUrl} onChange={e => updateEpisode(idx, { streamUrl: e.target.value })} placeholder="URL stream" className="h-7 text-[10px] rounded-lg bg-background/50 border-border/20 px-1.5" /></div>
                              <div className="col-span-1"><Input value={ep.streamQuality} onChange={e => updateEpisode(idx, { streamQuality: e.target.value })} className="h-7 text-[10px] rounded-lg bg-background/50 border-border/20 px-1.5" /></div>
                              <div className="col-span-1 flex justify-end"><Button size="icon" variant="ghost" onClick={() => removeEpisode(idx)} className="text-destructive h-7 w-7 rounded-lg"><Trash2 size={12} /></Button></div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Save */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }} disabled={saving} className="rounded-xl">Cancelar</Button>
                <Button onClick={saveEntry} disabled={saving} className="flex-1 gap-2 rounded-xl h-12 font-bold">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {editingId ? 'Salvar alterações' : 'Adicionar ao calendário'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Existing list */}
          {!formOpen && (
            <>
              {loadingList ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : entries.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground rounded-2xl border-border/20 bg-card/40">Nenhum lançamento cadastrado ainda.</Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entries.map((e) => (
                    <Card key={e.id} className="overflow-hidden rounded-2xl border-border/20 bg-card/40">
                      {e.backdrop_url && <img src={e.backdrop_url} alt={e.title} className="w-full h-32 object-cover" loading="lazy" />}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold line-clamp-1">{e.title}</h3>
                          <Badge variant="outline" className="shrink-0 capitalize">{e.content_type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{format(new Date(e.release_date + 'T00:00:00'), 'dd/MM/yyyy')}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(e)} className="flex-1 gap-1 rounded-xl"><Edit className="h-3 w-3" /> Editar</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteEntry(e.id)} className="gap-1 rounded-xl"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

// Small inline preview card for the picked TMDB item
function selected_preview(title: string, overview: string, tmdbId: string) {
  if (!title || (!overview && !tmdbId)) return null;
  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-bold">{title}</span>
        {tmdbId && <span className="text-[10px] text-muted-foreground">TMDB #{tmdbId}</span>}
      </div>
      {overview && <p className="text-[11px] text-muted-foreground line-clamp-2">{overview}</p>}
    </div>
  );
}

export default AdminCalendar;
