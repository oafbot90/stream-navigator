import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, Save, Plus, Trash2, Loader2, Tv, Info, CheckSquare } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { tmdbApi } from '@/services/tmdbApi';

interface SeriesData {
  id: string; title: string; poster_path: string | null; vote_average: number | null;
  vote_count: number | null; genres: string[] | null; tmdb_id: number | null;
  created_at: string | null; updated_at: string | null;
  original_title?: string | null; overview?: string | null; backdrop_path?: string | null;
  first_air_date?: string | null; release_year?: number | null;
  number_of_seasons?: number | null; number_of_episodes?: number | null;
  imdb_id?: string | null; status?: string | null;
}

interface EpisodeData {
  id: string; season_number: number; episode_number: number; title: string;
  overview: string | null; still_path: string | null; air_date: string | null;
  runtime: number | null; streamUrl: string; streamQuality: string; isNew?: boolean;
}

const AdminEditSeries: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [series, setSeries] = useState<SeriesData | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
  const [genresText, setGenresText] = useState('');
  // Map season_number -> array of TMDB episodes (for that season)
  const [tmdbSeasons, setTmdbSeasons] = useState<Record<number, any[]>>({});
  const [totalSeasons, setTotalSeasons] = useState<number>(0);
  const [addingEp, setAddingEp] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelect = (epId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(epId)) next.delete(epId); else next.add(epId);
      return next;
    });
  };
  const toggleSelectSeason = (seasonNum: number) => {
    const seasonEps = episodes.filter(e => e.season_number === seasonNum);
    const allSelected = seasonEps.every(e => selectedIds.has(e.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      seasonEps.forEach(e => allSelected ? next.delete(e.id) : next.add(e.id));
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === episodes.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(episodes.map(e => e.id)));
  };

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [seriesRes, episodesRes] = await Promise.all([
        supabase.from('series_catalog').select('*').eq('id', id).single(),
        supabase.from('series_episodes').select('*').eq('series_id', id).order('season_number').order('episode_number'),
      ]);
      if (seriesRes.error) { toast({ title: 'Erro', variant: 'destructive' }); navigate('/admin/series'); return; }
      setSeries(seriesRes.data as SeriesData);
      setGenresText((seriesRes.data.genres || []).join(', '));
      const eps = episodesRes.data || [];
      const epIds = eps.map(e => e.id);
      let streamsMap: Record<string, { url: string; quality: string }> = {};
      if (epIds.length > 0) {
        // Chunk the .in() query to avoid URL length limits AND paginate to bypass the 1000-row default cap.
        const CHUNK = 100;
        for (let i = 0; i < epIds.length; i += CHUNK) {
          const chunk = epIds.slice(i, i + CHUNK);
          let from = 0;
          const PAGE = 1000;
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { data: streams, error } = await supabase
              .from('episode_streams')
              .select('episode_id, url, quality')
              .in('episode_id', chunk)
              .range(from, from + PAGE - 1);
            if (error) { console.error('episode_streams fetch error', error); break; }
            (streams || []).forEach((s: any) => {
              if (!streamsMap[s.episode_id]) streamsMap[s.episode_id] = { url: s.url, quality: s.quality || 'HD' };
            });
            if (!streams || streams.length < PAGE) break;
            from += PAGE;
          }
        }
      }
      setEpisodes(eps.map((e: any) => ({
        id: e.id, season_number: e.season_number, episode_number: e.episode_number, title: e.title,
        overview: e.overview, still_path: e.still_path, air_date: e.air_date, runtime: e.runtime,
        streamUrl: streamsMap[e.id]?.url || '', streamQuality: streamsMap[e.id]?.quality || 'HD',
      })));
      setLoading(false);

      // Fetch TMDB seasons info in background
      const tmdbId = (seriesRes.data as any).tmdb_id;
      if (tmdbId) {
        try {
          const details = await tmdbApi.getTVShowDetails(tmdbId);
          const seasonsList = (details?.seasons || []).filter((s: any) => s.season_number >= 1);
          setTotalSeasons(seasonsList.length);
          // preload first season (or seasons that have episodes already)
          const seasonsToLoad = new Set<number>([1, ...eps.map((e: any) => e.season_number)]);
          const map: Record<number, any[]> = {};
          await Promise.all([...seasonsToLoad].map(async (sn) => {
            try {
              const sd = await tmdbApi.getSeasonDetails(tmdbId, sn);
              if (sd?.episodes) map[sn] = sd.episodes;
            } catch {}
          }));
          setTmdbSeasons(map);
        } catch {}
      }
    };
    fetchData();
  }, [id]);

  const ensureSeasonLoaded = async (seasonNum: number): Promise<any[] | null> => {
    if (tmdbSeasons[seasonNum]) return tmdbSeasons[seasonNum];
    if (!series?.tmdb_id) return null;
    try {
      const sd = await tmdbApi.getSeasonDetails(series.tmdb_id, seasonNum);
      if (sd?.episodes) {
        setTmdbSeasons(prev => ({ ...prev, [seasonNum]: sd.episodes }));
        return sd.episodes;
      }
    } catch {}
    return null;
  };

  const updateField = (field: keyof SeriesData, value: any) => { if (series) setSeries({ ...series, [field]: value }); };
  const updateEpisode = (index: number, field: keyof EpisodeData, value: any) => { setEpisodes(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e)); };

  const refreshEpisodeCount = async () => {
    if (!id) return;
    const { count, error } = await supabase
      .from('series_episodes')
      .select('id', { count: 'exact', head: true })
      .eq('series_id', id);
    if (error) throw error;
    const nextCount = count || 0;
    setSeries(prev => prev ? { ...prev, number_of_episodes: nextCount } : prev);
  };


  const deletePersistedEpisodes = async (episodeIds: string[]) => {
    const ids = [...new Set(episodeIds.filter(Boolean))];
    if (ids.length === 0) return;

    const { error: streamsError } = await supabase
      .from('episode_streams')
      .delete()
      .in('episode_id', ids);
    if (streamsError) throw streamsError;

    const { data: deletedRows, error: episodesError } = await supabase
      .from('series_episodes')
      .delete()
      .in('id', ids)
      .select('id');
    if (episodesError) throw episodesError;

    if ((deletedRows || []).length !== ids.length) {
      throw new Error('O banco não confirmou a exclusão de todos os episódios. Verifique sua permissão de admin e tente novamente.');
    }

    await refreshEpisodeCount();
  };

  const addEpisode = async () => {
    if (addingEp) return;
    setAddingEp(true);
    try {
      // Descobre quantas temporadas existem (TMDB, com fallback em series.number_of_seasons)
      let maxSeasons = totalSeasons;
      if (!maxSeasons && series?.tmdb_id) {
        try {
          const details = await tmdbApi.getTVShowDetails(series.tmdb_id);
          const seasonsList = (details?.seasons || []).filter((s: any) => s.season_number >= 1);
          maxSeasons = seasonsList.length;
          setTotalSeasons(maxSeasons);
        } catch {}
      }
      if (!maxSeasons) maxSeasons = series?.number_of_seasons || 0;

      // Temporada inicial = maior já presente, ou 1
      let targetSeason = episodes.length > 0 ? Math.max(...episodes.map(e => e.season_number)) : 1;
      let seasonEps = await ensureSeasonLoaded(targetSeason);
      let realCount = seasonEps?.length ?? 0;
      let highestInSeason = episodes
        .filter(e => e.season_number === targetSeason)
        .reduce((m, e) => Math.max(m, e.episode_number), 0);

      // Se a temporada atual já está cheia (segundo TMDB), avança para a próxima
      const SAFETY = 50;
      let guard = 0;
      while (guard++ < SAFETY && realCount > 0 && highestInSeason >= realCount) {
        if (maxSeasons && targetSeason >= maxSeasons) {
          toast({
            title: 'Limite atingido',
            description: `Esta série tem ${maxSeasons} temporada(s) e a temporada ${targetSeason} já tem todos os ${realCount} episódios.`,
            variant: 'destructive',
          });
          return;
        }
        targetSeason += 1;
        seasonEps = await ensureSeasonLoaded(targetSeason);
        realCount = seasonEps?.length ?? 0;
        highestInSeason = episodes
          .filter(e => e.season_number === targetSeason)
          .reduce((m, e) => Math.max(m, e.episode_number), 0);
      }

      // Sem dados TMDB para validar limite — bloqueia se não há tmdb_id e maxSeasons foi atingido
      if (!seasonEps) {
        if (maxSeasons && targetSeason > maxSeasons) {
          toast({
            title: 'Limite atingido',
            description: `Esta série tem ${maxSeasons} temporada(s).`,
            variant: 'destructive',
          });
          return;
        }
        if (!series?.tmdb_id) {
          toast({
            title: 'Sem TMDB ID',
            description: 'Configure o TMDB ID da série para validar o limite de episódios.',
            variant: 'destructive',
          });
          return;
        }
      }

      const nextEpNum = highestInSeason + 1;
      if (seasonEps && nextEpNum > realCount) {
        toast({
          title: 'Limite atingido',
          description: `Temporada ${targetSeason} tem apenas ${realCount} episódios no TMDB.`,
          variant: 'destructive',
        });
        return;
      }

      const tmdbEp = seasonEps?.find((e: any) => e.episode_number === nextEpNum);
      const title = tmdbEp?.name || `Episódio ${nextEpNum}`;
      const still = tmdbEp?.still_path || null;
      const overview = tmdbEp?.overview || null;
      const airDate = tmdbEp?.air_date || null;
      const runtime = tmdbEp?.runtime || null;

      setEpisodes(prev => [...prev, {
        id: `new-${Date.now()}`, season_number: targetSeason, episode_number: nextEpNum,
        title, overview, still_path: still, air_date: airDate, runtime,
        streamUrl: '', streamQuality: 'HD', isNew: true,
      }]);
    } finally {
      setAddingEp(false);
    }
  };
  const removeEpisode = async (index: number) => {
    const ep = episodes[index];
    if (!ep) return;
    const isPersisted = !ep.isNew && !String(ep.id).startsWith('new-');

    try {
      if (isPersisted) await deletePersistedEpisodes([ep.id]);
      setEpisodes(prev => prev.filter((_, i) => i !== index));
      toast({ title: 'Episódio removido', description: `T${ep.season_number}E${ep.episode_number} excluído do banco.` });
    } catch (err: any) {
      toast({ title: 'Erro ao excluir episódio', description: err.message, variant: 'destructive' });
    }
  };

  const bulkDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Excluir ${selectedIds.size} episódio(s) selecionado(s)?`)) return;
    setBulkDeleting(true);
    try {
      const toDel = episodes.filter(e => selectedIds.has(e.id));
      const persistedIds = toDel.filter(e => !e.isNew && !String(e.id).startsWith('new-')).map(e => e.id);
      if (persistedIds.length > 0) await deletePersistedEpisodes(persistedIds);
      setEpisodes(prev => prev.filter(e => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
      toast({ title: `${toDel.length} episódio(s) removidos` });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setBulkDeleting(false); }
  };

  const deleteSeason = async (seasonNum: number) => {
    const seasonEps = episodes.filter(e => e.season_number === seasonNum);
    if (seasonEps.length === 0) return;
    if (!confirm(`Excluir TODOS os ${seasonEps.length} episódios da Temporada ${seasonNum}?`)) return;
    setBulkDeleting(true);
    try {
      const persistedIds = seasonEps.filter(e => !e.isNew && !String(e.id).startsWith('new-')).map(e => e.id);
      if (persistedIds.length > 0) await deletePersistedEpisodes(persistedIds);
      const ids = new Set(seasonEps.map(e => e.id));
      setEpisodes(prev => prev.filter(e => !ids.has(e.id)));
      setSelectedIds(prev => { const n = new Set(prev); ids.forEach(i => n.delete(i)); return n; });
      toast({ title: `Temporada ${seasonNum} removida`, description: `${seasonEps.length} episódio(s) excluídos.` });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setBulkDeleting(false); }
  };

  const handleSave = async () => {
    if (!series || !id) return;
    setSaving(true);
    try {
      const genres = genresText.split(',').map(g => g.trim()).filter(Boolean);
      const { error: seriesError } = await supabase.from('series_catalog').update({
        title: series.title,
        poster_path: series.poster_path, vote_average: series.vote_average,
        genres, tmdb_id: series.tmdb_id,
      } as any).eq('id', id);
      if (seriesError) throw seriesError;

      // Buscar episódios existentes (mapa por season-episode)
      const { data: existingEps } = await supabase
        .from('series_episodes').select('id, season_number, episode_number')
        .eq('series_id', id);
      const existingMap = new Map<string, string>();
      (existingEps || []).forEach((e: any) =>
        existingMap.set(`${e.season_number}-${e.episode_number}`, e.id)
      );

      // IDs do estado atual (para detectar quais remover)
      const keepIds = new Set<string>();

      for (const ep of episodes) {
        const key = `${ep.season_number}-${ep.episode_number}`;
        let episodeId = existingMap.get(key);

        if (episodeId) {
          // Atualiza título
          await supabase.from('series_episodes')
            .update({ title: ep.title } as any).eq('id', episodeId);
        } else {
          const { data: inserted, error: insErr } = await supabase
            .from('series_episodes').insert({
              series_id: id,
              season_number: ep.season_number,
              episode_number: ep.episode_number,
              title: ep.title,
            } as any).select('id').single();
          if (insErr) throw insErr;
          episodeId = inserted.id;
        }
        keepIds.add(episodeId!);

        // Substitui stream do episódio
        await supabase.from('episode_streams').delete().eq('episode_id', episodeId);
        if (ep.streamUrl.trim()) {
          const { error: strErr } = await supabase.from('episode_streams').insert({
            episode_id: episodeId,
            url: ep.streamUrl.trim(),
            quality: ep.streamQuality || 'HD',
            stream_type: 'direct',
          });
          if (strErr) throw strErr;
        }
      }

      // Remove episódios que foram excluídos do formulário
      const toDelete = (existingEps || [])
        .filter((e: any) => !keepIds.has(e.id))
        .map((e: any) => e.id);
      if (toDelete.length > 0) await deletePersistedEpisodes(toDelete);
      else await refreshEpisodeCount();

      toast({ title: 'Salvo!', description: 'Série atualizada.' });
    } catch (err: any) {
      console.error('Save error:', err);
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  if (loading) return <Layout><div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></Layout>;
  if (!series) return null;

  const seasons = [...new Set(episodes.map(e => e.season_number))].sort((a, b) => a - b);

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/series')} className="gap-1 rounded-xl"><ChevronLeft size={16} /> Voltar</Button>
              <div className="p-2 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/20"><Tv className="h-5 w-5 text-pink-400" /></div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Editar Série</h1>
            </div>
          </motion.div>

          <div className="space-y-6">
            {/* Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
                <div className="flex items-center gap-2 mb-4"><Info className="h-4 w-4 text-primary" /><h2 className="font-bold text-foreground text-sm">Informações</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div><Label className="text-xs text-muted-foreground">Título</Label><Input value={series.title} onChange={e => updateField('title', e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                  <div><Label className="text-xs text-muted-foreground">Título Original</Label><Input value={series.original_title || ''} onChange={e => updateField('original_title', e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                </div>
                <div className="mb-4"><Label className="text-xs text-muted-foreground">Sinopse</Label><Textarea rows={3} value={series.overview || ''} onChange={e => updateField('overview', e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div><Label className="text-xs text-muted-foreground">Nota</Label><Input type="number" step="0.1" value={series.vote_average ?? 0} onChange={e => updateField('vote_average', parseFloat(e.target.value) || 0)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                  <div><Label className="text-xs text-muted-foreground">Ano</Label><Input type="number" value={series.release_year ?? ''} onChange={e => updateField('release_year', parseInt(e.target.value) || null)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                  <div><Label className="text-xs text-muted-foreground">Temporadas</Label><Input type="number" value={series.number_of_seasons ?? ''} onChange={e => updateField('number_of_seasons', parseInt(e.target.value) || null)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                  <div><Label className="text-xs text-muted-foreground">TMDB ID</Label><Input type="number" value={series.tmdb_id ?? ''} onChange={e => updateField('tmdb_id', parseInt(e.target.value) || null)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label className="text-xs text-muted-foreground">Gêneros</Label><Input value={genresText} onChange={e => setGenresText(e.target.value)} placeholder="Ação, Drama" className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs text-muted-foreground">Poster</Label><Input value={series.poster_path || ''} onChange={e => updateField('poster_path', e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                    <div><Label className="text-xs text-muted-foreground">Backdrop</Label><Input value={series.backdrop_path || ''} onChange={e => updateField('backdrop_path', e.target.value)} className="rounded-xl bg-background/50 border-border/30 mt-1" /></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Episodes */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Tv className="h-4 w-4 text-primary" />
                    <h2 className="font-bold text-foreground text-sm">Episódios</h2>
                    <Badge variant="secondary" className="text-[10px]">{episodes.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {episodes.length > 0 && (
                      <Button size="sm" variant="outline" onClick={toggleSelectAll} className="gap-1 rounded-xl text-xs h-8">
                        <CheckSquare size={12} /> {selectedIds.size === episodes.length ? 'Limpar' : 'Selecionar todos'}
                      </Button>
                    )}
                    {selectedIds.size > 0 && (
                      <Button size="sm" variant="destructive" onClick={bulkDeleteSelected} disabled={bulkDeleting} className="gap-1 rounded-xl text-xs h-8">
                        {bulkDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Excluir ({selectedIds.size})
                      </Button>
                    )}
                    <Button size="sm" onClick={addEpisode} disabled={addingEp} className="gap-1 rounded-xl text-xs h-8">{addingEp ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Episódio</Button>
                  </div>
                </div>
                {seasons.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Nenhum episódio adicionado.</p>}
                {seasons.map(seasonNum => {
                  const seasonEps = episodes.filter(e => e.season_number === seasonNum);
                  const allSel = seasonEps.length > 0 && seasonEps.every(e => selectedIds.has(e.id));
                  return (
                  <div key={seasonNum} className="mb-5">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={allSel} onCheckedChange={() => toggleSelectSeason(seasonNum)} />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Temporada {seasonNum} <span className="text-muted-foreground/60">({seasonEps.length})</span></h3>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteSeason(seasonNum)} disabled={bulkDeleting} className="h-7 text-[10px] text-destructive hover:bg-destructive/10 rounded-lg gap-1">
                        <Trash2 size={11} /> Excluir temporada
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {seasonEps.map((ep) => {
                        const idx = episodes.indexOf(ep);
                        const checked = selectedIds.has(ep.id);
                        return (
                          <div key={ep.id} className={`grid grid-cols-12 gap-1.5 items-center rounded-xl border p-2 ${checked ? 'bg-destructive/5 border-destructive/30' : 'bg-background/30 border-border/10'}`}>
                            <div className="col-span-1 flex items-center gap-1">
                              <Checkbox checked={checked} onCheckedChange={() => toggleSelect(ep.id)} />
                              <Input type="number" value={ep.season_number} onChange={e => updateEpisode(idx, 'season_number', parseInt(e.target.value) || 1)} className="h-7 text-[10px] rounded-lg bg-background/50 border-border/20 px-1.5" />
                            </div>
                            <div className="col-span-1"><Input type="number" value={ep.episode_number} onChange={e => updateEpisode(idx, 'episode_number', parseInt(e.target.value) || 1)} className="h-7 text-[10px] rounded-lg bg-background/50 border-border/20 px-1.5" /></div>
                            <div className="col-span-2"><Input value={ep.title} onChange={e => updateEpisode(idx, 'title', e.target.value)} className="h-7 text-[10px] rounded-lg bg-background/50 border-border/20 px-1.5" /></div>
                            <div className="col-span-3"><Input value={ep.streamUrl} onChange={e => updateEpisode(idx, 'streamUrl', e.target.value)} placeholder="URL stream" className="h-7 text-[10px] rounded-lg bg-background/50 border-border/20 px-1.5" /></div>
                            <div className="col-span-3"><Input value={ep.still_path || ''} onChange={e => updateEpisode(idx, 'still_path', e.target.value)} placeholder="Capa URL" className="h-7 text-[10px] rounded-lg bg-background/50 border-border/20 px-1.5" /></div>
                            <div className="col-span-1"><Input value={ep.streamQuality} onChange={e => updateEpisode(idx, 'streamQuality', e.target.value)} className="h-7 text-[10px] rounded-lg bg-background/50 border-border/20 px-1.5" /></div>
                            <div className="col-span-1 flex justify-end"><Button size="icon" variant="ghost" onClick={() => removeEpisode(idx)} className="text-destructive h-7 w-7 rounded-lg"><Trash2 size={12} /></Button></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );})}
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

export default AdminEditSeries;
