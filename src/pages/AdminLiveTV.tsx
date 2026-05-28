import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Pencil, Trash2, Radio, Tv, Save, X,
  Search, Wifi, WifiOff, RefreshCw, ChevronRight, Shield,
  Upload, Eye, EyeOff, ToggleLeft, ToggleRight,
} from 'lucide-react';

const ADMIN_EMAILS = ['alezin1299@gmail.com', 'alezin1788@gmail.com'];

interface ChannelRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  logo: string;
  stream_url: string;
  format: string;
  status: string;
}

const CATEGORIES = [
  'Abertos', 'Comedia', 'Documentarios', 'Esportes', 'Filmes',
  'Infantil', 'Musica', 'Noticias', 'Series', 'Variedades',
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35 } }),
};

const AdminLiveTV: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState<Partial<ChannelRow>>({
    name: '', slug: '', category: 'Abertos', logo: '', stream_url: '', format: 'm3u8', status: 'online',
  });
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: channels, isLoading } = useQuery({
    queryKey: ['admin-livetv-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livetv_channels')
        .select('*')
        .order('category')
        .order('name');
      if (error) throw error;
      return data as ChannelRow[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (channel: Partial<ChannelRow>) => {
      const { error } = await supabase.from('livetv_channels').insert({
        name: channel.name!,
        slug: channel.slug!,
        category: channel.category!,
        logo: channel.logo || '',
        stream_url: channel.stream_url!,
        format: channel.format || 'm3u8',
        status: channel.status || 'online',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-livetv-channels'] });
      toast({ title: 'Canal adicionado!' });
      setShowAdd(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async (channel: Partial<ChannelRow> & { id: string }) => {
      const { error } = await supabase.from('livetv_channels').update({
        name: channel.name,
        slug: channel.slug,
        category: channel.category,
        logo: channel.logo,
        stream_url: channel.stream_url,
        format: channel.format,
        status: channel.status,
      }).eq('id', channel.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-livetv-channels'] });
      toast({ title: 'Canal atualizado!' });
      setEditingId(null);
      resetForm();
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('livetv_channels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-livetv-channels'] });
      toast({ title: 'Canal removido!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === 'online' ? 'offline' : 'online';
      const { error } = await supabase.from('livetv_channels').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-livetv-channels'] });
      toast({ title: 'Status atualizado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const handleImportChannels = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsImporting(true);
      setImportLogs([]);
      const text = await file.text();
      const json = JSON.parse(text);
      setImportLogs(prev => [...prev, `📂 Lendo: ${file.name}`]);
      const { data, error } = await supabase.functions.invoke('import-channels', { body: json });
      if (error) throw error;
      setImportLogs(prev => [...prev, `✅ ${data.inserted} canais importados, ${data.categories} categorias, ${data.skipped} pulados, ${data.errors} erros`]);
      toast({ title: 'Canais importados!', description: `${data.inserted} canais importados` });
      queryClient.invalidateQueries({ queryKey: ['admin-livetv-channels'] });
    } catch (err: any) {
      setImportLogs(prev => [...prev, `❌ Erro: ${err.message}`]);
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setIsImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const resetForm = () => setForm({ name: '', slug: '', category: 'Abertos', logo: '', stream_url: '', format: 'm3u8', status: 'online' });

  const startEdit = (ch: ChannelRow) => {
    setEditingId(ch.id);
    setForm({ ...ch });
    setShowAdd(false);
  };

  const handleSave = () => {
    if (!form.name || !form.slug || !form.stream_url) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    if (editingId) {
      updateMutation.mutate({ ...form, id: editingId } as any);
    } else {
      addMutation.mutate(form);
    }
  };

  const filtered = (channels || []).filter(ch => {
    const matchSearch = ch.name.toLowerCase().includes(search.toLowerCase()) || ch.slug.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || ch.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const grouped = filtered.reduce<Record<string, ChannelRow[]>>((acc, ch) => {
    if (!acc[ch.category]) acc[ch.category] = [];
    acc[ch.category].push(ch);
    return acc;
  }, {});

  const onlineCount = (channels || []).filter(c => c.status === 'online').length;
  const offlineCount = (channels || []).filter(c => c.status !== 'online').length;

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-4">
              <Link to="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
                <Shield className="h-3 w-3" /> Admin
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">Canais ao Vivo</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/20">
                    <Radio className="h-6 w-6 text-red-400 animate-pulse" />
                  </div>
                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] uppercase tracking-widest font-bold">Live TV</Badge>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Gerenciar Canais</h1>
                <p className="text-muted-foreground mt-1 text-sm">Adicione, edite ou remova canais de TV ao vivo</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/50" asChild>
                  <Link to="/admin"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
                </Button>
                <input ref={fileRef} type="file" accept=".json" onChange={handleImportChannels} className="hidden" id="import-channels" />
                <label htmlFor="import-channels">
                  <Button asChild size="sm" variant="outline" className="gap-2 rounded-xl border-border/50 cursor-pointer" disabled={isImporting}>
                    <span><Upload className="h-4 w-4" /> {isImporting ? 'Importando...' : 'Importar JSON'}</span>
                  </Button>
                </label>
                <Button size="sm" className="gap-2 rounded-xl bg-red-500 hover:bg-red-600 text-white" onClick={() => { setShowAdd(true); setEditingId(null); resetForm(); }}>
                  <Plus className="h-4 w-4" /> Novo Canal
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Import Logs */}
          {importLogs.length > 0 && (
            <div className="mb-6 rounded-2xl border border-border/30 bg-card/40 p-4 max-h-32 overflow-y-auto font-mono text-xs">
              {importLogs.map((log, i) => <div key={i} className="text-muted-foreground py-0.5">{log}</div>)}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
              className="rounded-2xl border border-border/30 bg-gradient-to-br from-blue-500/10 to-transparent p-4 backdrop-blur-sm">
              <p className="text-2xl font-black text-foreground">{channels?.length || 0}</p>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total</p>
            </motion.div>
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
              className="rounded-2xl border border-border/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 backdrop-blur-sm">
              <p className="text-2xl font-black text-emerald-400">{onlineCount}</p>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Online</p>
            </motion.div>
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
              className="rounded-2xl border border-border/30 bg-gradient-to-br from-red-500/10 to-transparent p-4 backdrop-blur-sm">
              <p className="text-2xl font-black text-red-400">{offlineCount}</p>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Offline</p>
            </motion.div>
          </div>

          {/* Add/Edit Form */}
          <AnimatePresence>
            {(showAdd || editingId) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      {editingId ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
                      {editingId ? 'Editar Canal' : 'Novo Canal'}
                    </h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setShowAdd(false); setEditingId(null); resetForm(); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Input placeholder="Nome do canal *" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))} className="rounded-xl bg-background/50" />
                    <Input placeholder="Slug *" value={form.slug || ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="rounded-xl bg-background/50" />
                    <Select value={form.category || 'Abertos'} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="rounded-xl bg-background/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input placeholder="URL da Stream *" value={form.stream_url || ''} onChange={e => setForm(f => ({ ...f, stream_url: e.target.value }))} className="rounded-xl bg-background/50 sm:col-span-2" />
                    <Input placeholder="URL do Logo (opcional)" value={form.logo || ''} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} className="rounded-xl bg-background/50" />
                    <Select value={form.format || 'm3u8'} onValueChange={v => setForm(f => ({ ...f, format: v }))}>
                      <SelectTrigger className="rounded-xl bg-background/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m3u8">HLS (m3u8)</SelectItem>
                        <SelectItem value="mp4">MP4</SelectItem>
                        <SelectItem value="dash">DASH</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={form.status || 'online'} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger className="rounded-xl bg-background/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setShowAdd(false); setEditingId(null); resetForm(); }}>Cancelar</Button>
                    <Button size="sm" className="rounded-xl gap-2 bg-red-500 hover:bg-red-600 text-white" onClick={handleSave}
                      disabled={addMutation.isPending || updateMutation.isPending}>
                      <Save className="h-4 w-4" /> {editingId ? 'Salvar' : 'Adicionar'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar canal..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl bg-card/40 border-border/30" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl bg-card/40 border-border/30"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Channels grouped by category */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-20">
              <Tv className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum canal encontrado</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, chs]) => (
                <motion.div key={cat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="rounded-full text-xs font-bold border-border/40">{cat}</Badge>
                    <span className="text-xs text-muted-foreground">{chs.length} canais</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {chs.map((ch, i) => (
                      <motion.div key={ch.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                        <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-4 hover:border-red-500/30 transition-all group">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {ch.logo ? (
                                <img src={ch.logo} alt={ch.name} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center shrink-0">
                                  <Tv className="h-5 w-5 text-red-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-foreground truncate">{ch.name}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{ch.slug}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {ch.status === 'online' ? (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
                                  <Wifi className="h-2.5 w-2.5" /> On
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] gap-1">
                                  <WifiOff className="h-2.5 w-2.5" /> Off
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mb-3 font-mono">{ch.stream_url}</p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs h-8 gap-1" onClick={() => startEdit(ch)}>
                              <Pencil className="h-3 w-3" /> Editar
                            </Button>
                            <Button variant="outline" size="sm" className={`rounded-xl text-xs h-8 gap-1 ${ch.status === 'online' ? 'text-emerald-400 hover:text-red-300' : 'text-red-400 hover:text-emerald-300'}`}
                              onClick={() => toggleStatusMutation.mutate({ id: ch.id, status: ch.status })}>
                              {ch.status === 'online' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-xl text-xs h-8 gap-1 text-red-400 hover:text-red-300 hover:border-red-500/30"
                              onClick={() => { if (confirm(`Remover ${ch.name}?`)) deleteMutation.mutate(ch.id); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminLiveTV;
