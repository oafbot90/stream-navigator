import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Loader2, Sparkles, ImageIcon, Frame, Pencil, Check, X, Crown, Wallpaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

const ADMIN_EMAILS = ['alezin1299@gmail.com', 'alezin1788@gmail.com'];

interface Decoration {
  id: string;
  name: string;
  type: string;
  url: string;
  is_animated: boolean;
  is_premium: boolean;
  position: number;
}

interface Banner {
  id: string;
  name: string;
  url: string;
  is_animated: boolean;
  is_premium: boolean;
  position: number;
}

interface Background {
  id: string;
  name: string;
  url: string;
  is_premium: boolean;
  position: number;
  orientation: 'horizontal' | 'vertical';
}

const AdminCustomization: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loadingDec, setLoadingDec] = useState(true);
  const [loadingBan, setLoadingBan] = useState(true);
  const [loadingBg, setLoadingBg] = useState(true);

  const [decUrl, setDecUrl] = useState('');
  const [decName, setDecName] = useState('');
  const [decType, setDecType] = useState('frame');
  const [decAnimated, setDecAnimated] = useState(false);
  const [decPremium, setDecPremium] = useState(false);

  const [banUrl, setBanUrl] = useState('');
  const [banName, setBanName] = useState('');
  const [banAnimated, setBanAnimated] = useState(false);
  const [banPremium, setBanPremium] = useState(false);

  const [bgUrl, setBgUrl] = useState('');
  const [bgName, setBgName] = useState('');
  const [bgPremium, setBgPremium] = useState(false);
  const [bgOrientation, setBgOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  const [editingDecId, setEditingDecId] = useState<string | null>(null);
  const [editDecName, setEditDecName] = useState('');
  const [editingBanId, setEditingBanId] = useState<string | null>(null);
  const [editBanName, setEditBanName] = useState('');
  const [editingBgId, setEditingBgId] = useState<string | null>(null);
  const [editBgName, setEditBgName] = useState('');

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadData();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const loadData = async () => {
    const [decRes, banRes, bgRes] = await Promise.all([
      supabase.from('profile_decorations').select('*').order('position'),
      supabase.from('profile_banners').select('*').order('position'),
      (supabase as any).from('profile_backgrounds').select('*').order('position'),
    ]);
    setDecorations((decRes.data as Decoration[]) || []);
    setBanners((banRes.data as Banner[]) || []);
    setBackgrounds((bgRes.data as Background[]) || []);
    setLoadingDec(false);
    setLoadingBan(false);
    setLoadingBg(false);
  };

  const addBackground = async () => {
    if (!bgUrl.trim() || !bgName.trim()) {
      toast({ title: 'Preencha URL e nome', variant: 'destructive' });
      return;
    }
    try {
      const { data, error } = await (supabase as any).from('profile_backgrounds').insert({
        name: bgName.trim(), url: bgUrl.trim(),
        is_premium: bgPremium, position: backgrounds.length,
        orientation: bgOrientation,
      }).select().single();
      if (error) throw error;
      setBackgrounds([...backgrounds, data as Background]);
      setBgUrl(''); setBgName(''); setBgPremium(false); setBgOrientation('horizontal');
      toast({ title: 'Fundo adicionado!' });
    } catch { toast({ title: 'Erro ao adicionar', variant: 'destructive' }); }
  };

  const deleteBackground = async (id: string) => {
    try {
      await (supabase as any).from('profile_backgrounds').delete().eq('id', id);
      setBackgrounds(backgrounds.filter(b => b.id !== id));
      toast({ title: 'Fundo removido!' });
    } catch { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const toggleBgPremium = async (bg: Background) => {
    try {
      const newVal = !bg.is_premium;
      await (supabase as any).from('profile_backgrounds').update({ is_premium: newVal }).eq('id', bg.id);
      setBackgrounds(backgrounds.map(b => b.id === bg.id ? { ...b, is_premium: newVal } : b));
      toast({ title: newVal ? 'Marcado como Premium' : 'Marcado como Grátis' });
    } catch { toast({ title: 'Erro ao atualizar', variant: 'destructive' }); }
  };

  const saveBgEdit = async (id: string) => {
    if (!editBgName.trim()) return;
    try {
      await (supabase as any).from('profile_backgrounds').update({ name: editBgName.trim() }).eq('id', id);
      setBackgrounds(backgrounds.map(b => b.id === id ? { ...b, name: editBgName.trim() } : b));
      setEditingBgId(null);
      toast({ title: 'Atualizado!' });
    } catch { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const addDecoration = async () => {
    if (!decUrl.trim() || !decName.trim()) {
      toast({ title: 'Preencha URL e nome', variant: 'destructive' });
      return;
    }
    try {
      const { data, error } = await supabase.from('profile_decorations').insert({
        name: decName.trim(), url: decUrl.trim(), type: decType,
        is_animated: decAnimated, is_premium: decPremium, position: decorations.length,
      }).select().single();
      if (error) throw error;
      setDecorations([...decorations, data as Decoration]);
      setDecUrl(''); setDecName(''); setDecAnimated(false); setDecPremium(false);
      toast({ title: 'Decoração adicionada!' });
    } catch { toast({ title: 'Erro ao adicionar', variant: 'destructive' }); }
  };

  const deleteDecoration = async (id: string) => {
    try {
      await supabase.from('profile_decorations').delete().eq('id', id);
      setDecorations(decorations.filter(d => d.id !== id));
      toast({ title: 'Decoração removida!' });
    } catch { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const toggleDecPremium = async (dec: Decoration) => {
    try {
      const newVal = !dec.is_premium;
      await supabase.from('profile_decorations').update({ is_premium: newVal }).eq('id', dec.id);
      setDecorations(decorations.map(d => d.id === dec.id ? { ...d, is_premium: newVal } : d));
      toast({ title: newVal ? 'Marcado como Premium' : 'Marcado como Grátis' });
    } catch { toast({ title: 'Erro ao atualizar', variant: 'destructive' }); }
  };

  const saveDecEdit = async (id: string) => {
    if (!editDecName.trim()) return;
    try {
      await supabase.from('profile_decorations').update({ name: editDecName.trim() }).eq('id', id);
      setDecorations(decorations.map(d => d.id === id ? { ...d, name: editDecName.trim() } : d));
      setEditingDecId(null);
      toast({ title: 'Atualizado!' });
    } catch { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const addBanner = async () => {
    if (!banUrl.trim() || !banName.trim()) {
      toast({ title: 'Preencha URL e nome', variant: 'destructive' });
      return;
    }
    try {
      const { data, error } = await supabase.from('profile_banners').insert({
        name: banName.trim(), url: banUrl.trim(),
        is_animated: banAnimated, is_premium: banPremium, position: banners.length,
      }).select().single();
      if (error) throw error;
      setBanners([...banners, data as Banner]);
      setBanUrl(''); setBanName(''); setBanAnimated(false); setBanPremium(false);
      toast({ title: 'Banner adicionado!' });
    } catch { toast({ title: 'Erro ao adicionar', variant: 'destructive' }); }
  };

  const deleteBanner = async (id: string) => {
    try {
      await supabase.from('profile_banners').delete().eq('id', id);
      setBanners(banners.filter(b => b.id !== id));
      toast({ title: 'Banner removido!' });
    } catch { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const toggleBanPremium = async (ban: Banner) => {
    try {
      const newVal = !ban.is_premium;
      await supabase.from('profile_banners').update({ is_premium: newVal }).eq('id', ban.id);
      setBanners(banners.map(b => b.id === ban.id ? { ...b, is_premium: newVal } : b));
      toast({ title: newVal ? 'Marcado como Premium' : 'Marcado como Grátis' });
    } catch { toast({ title: 'Erro ao atualizar', variant: 'destructive' }); }
  };

  const saveBanEdit = async (id: string) => {
    if (!editBanName.trim()) return;
    try {
      await supabase.from('profile_banners').update({ name: editBanName.trim() }).eq('id', id);
      setBanners(banners.map(b => b.id === id ? { ...b, name: editBanName.trim() } : b));
      setEditingBanId(null);
      toast({ title: 'Atualizado!' });
    } catch { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const renderMediaPreview = (url: string, isAnimated: boolean, className: string = '') => (
    <img src={url} alt="" className={`object-cover ${className}`} style={isAnimated ? { imageRendering: 'auto' } : undefined} />
  );

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="rounded-xl">
                <ChevronLeft className="h-4 w-4 mr-1" /> Admin
              </Button>
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20">
                <Sparkles className="h-5 w-5 text-violet-400" />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Personalização de Perfil</h1>
            </div>
          </motion.div>

          <Tabs defaultValue="decorations" className="space-y-6">
            <TabsList className="bg-muted w-full grid grid-cols-3">
              <TabsTrigger value="decorations" className="gap-2"><Frame className="w-4 h-4" /> Decorações</TabsTrigger>
              <TabsTrigger value="banners" className="gap-2"><ImageIcon className="w-4 h-4" /> Banners</TabsTrigger>
              <TabsTrigger value="backgrounds" className="gap-2"><Wallpaper className="w-4 h-4" /> Fundos</TabsTrigger>
            </TabsList>

            {/* DECORATIONS TAB */}
            <TabsContent value="decorations" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-transparent p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus className="h-4 w-4 text-violet-400" />
                    <h2 className="font-bold text-foreground text-sm">Adicionar Decoração</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Suporta GIF animado e imagens estáticas (frames, badges, efeitos)</p>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[180px]">
                      <label className="text-xs text-muted-foreground mb-1 block">URL da Imagem/GIF</label>
                      <Input value={decUrl} onChange={(e) => setDecUrl(e.target.value)} placeholder="https://..." className="rounded-xl bg-background/50" />
                    </div>
                    <div className="w-32">
                      <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                      <Input value={decName} onChange={(e) => setDecName(e.target.value)} placeholder="Nome" className="rounded-xl bg-background/50" />
                    </div>
                    <div className="w-32">
                      <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                      <Select value={decType} onValueChange={setDecType}>
                        <SelectTrigger className="rounded-xl bg-background/50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="frame">Moldura</SelectItem>
                          <SelectItem value="badge">Badge</SelectItem>
                          <SelectItem value="effect">Efeito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="dec-animated" checked={decAnimated} onCheckedChange={setDecAnimated} />
                      <Label htmlFor="dec-animated" className="text-xs">Animado</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="dec-premium" checked={decPremium} onCheckedChange={setDecPremium} />
                      <Label htmlFor="dec-premium" className="text-xs flex items-center gap-1">
                        <Crown className="w-3 h-3 text-yellow-500" /> Premium
                      </Label>
                    </div>
                    <Button onClick={addDecoration} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Adicionar</Button>
                  </div>
                </div>
              </motion.div>

              <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2"><Frame className="h-4 w-4 text-primary" /><h2 className="font-bold text-foreground text-sm">Decorações Disponíveis</h2></div>
                  <Badge variant="secondary" className="text-[10px]">{decorations.length}</Badge>
                </div>
                {loadingDec ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : decorations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma decoração adicionada</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {decorations.map((dec, i) => (
                      <motion.div key={dec.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                        <div className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-border/20 bg-muted/10 hover:bg-muted/30 transition-all group relative">
                          <button onClick={() => deleteDecoration(dec.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity p-1">
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden ring-2 ring-border/20">
                            {renderMediaPreview(dec.url, dec.is_animated, 'w-full h-full')}
                            {dec.is_premium && (
                              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                                <Crown className="w-2.5 h-2.5 text-black" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[9px] px-1.5">{dec.type === 'frame' ? 'Moldura' : dec.type === 'badge' ? 'Badge' : 'Efeito'}</Badge>
                            {dec.is_animated && <Badge className="text-[9px] px-1.5 bg-violet-500/20 text-violet-300 border-violet-500/30">GIF</Badge>}
                          </div>
                          {editingDecId === dec.id ? (
                            <div className="flex items-center gap-1 w-full">
                              <Input value={editDecName} onChange={(e) => setEditDecName(e.target.value)} className="h-6 text-[10px] px-1.5 rounded-lg" autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') saveDecEdit(dec.id); if (e.key === 'Escape') setEditingDecId(null); }} />
                              <button onClick={() => saveDecEdit(dec.id)} className="text-green-400"><Check className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setEditingDecId(null)} className="text-red-400"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 group/name">
                              <span className="text-[10px] text-muted-foreground font-semibold truncate">{dec.name}</span>
                              <button onClick={() => { setEditingDecId(dec.id); setEditDecName(dec.name); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity">
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => toggleDecPremium(dec)}
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition-colors ${dec.is_premium ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                          >
                            {dec.is_premium ? '★ Premium' : 'Grátis'}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* BANNERS TAB */}
            <TabsContent value="banners" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-transparent p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus className="h-4 w-4 text-emerald-400" />
                    <h2 className="font-bold text-foreground text-sm">Adicionar Banner</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Suporta GIF animado e imagens estáticas para banners de perfil</p>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[180px]">
                      <label className="text-xs text-muted-foreground mb-1 block">URL da Imagem/GIF</label>
                      <Input value={banUrl} onChange={(e) => setBanUrl(e.target.value)} placeholder="https://..." className="rounded-xl bg-background/50" />
                    </div>
                    <div className="w-32">
                      <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                      <Input value={banName} onChange={(e) => setBanName(e.target.value)} placeholder="Nome" className="rounded-xl bg-background/50" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="ban-animated" checked={banAnimated} onCheckedChange={setBanAnimated} />
                      <Label htmlFor="ban-animated" className="text-xs">Animado</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="ban-premium" checked={banPremium} onCheckedChange={setBanPremium} />
                      <Label htmlFor="ban-premium" className="text-xs flex items-center gap-1">
                        <Crown className="w-3 h-3 text-yellow-500" /> Premium
                      </Label>
                    </div>
                    <Button onClick={addBanner} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Adicionar</Button>
                  </div>
                </div>
              </motion.div>

              <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /><h2 className="font-bold text-foreground text-sm">Banners Disponíveis</h2></div>
                  <Badge variant="secondary" className="text-[10px]">{banners.length}</Badge>
                </div>
                {loadingBan ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : banners.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Nenhum banner adicionado</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {banners.map((ban, i) => (
                      <motion.div key={ban.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                        <div className="flex items-center gap-3 p-3 rounded-2xl border border-border/20 bg-muted/10 hover:bg-muted/30 transition-all group relative">
                          <button onClick={() => deleteBanner(ban.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity p-1">
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <div className="relative w-24 h-14 rounded-xl overflow-hidden ring-2 ring-border/20 shrink-0">
                            {renderMediaPreview(ban.url, ban.is_animated, 'w-full h-full')}
                            {ban.is_premium && (
                              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                                <Crown className="w-2.5 h-2.5 text-black" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              {ban.is_animated && <Badge className="text-[9px] px-1.5 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">GIF</Badge>}
                            </div>
                            {editingBanId === ban.id ? (
                              <div className="flex items-center gap-1 mt-1">
                                <Input value={editBanName} onChange={(e) => setEditBanName(e.target.value)} className="h-6 text-[10px] px-1.5 rounded-lg" autoFocus
                                  onKeyDown={(e) => { if (e.key === 'Enter') saveBanEdit(ban.id); if (e.key === 'Escape') setEditingBanId(null); }} />
                                <button onClick={() => saveBanEdit(ban.id)} className="text-green-400"><Check className="h-3.5 w-3.5" /></button>
                                <button onClick={() => setEditingBanId(null)} className="text-red-400"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 mt-1 group/name">
                                <span className="text-xs text-muted-foreground font-semibold truncate">{ban.name}</span>
                                <button onClick={() => { setEditingBanId(ban.id); setEditBanName(ban.name); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity">
                                  <Pencil className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => toggleBanPremium(ban)}
                              className={`mt-1 text-[9px] px-2 py-0.5 rounded-full font-bold transition-colors ${ban.is_premium ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                            >
                              {ban.is_premium ? '★ Premium' : 'Grátis'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* BACKGROUNDS TAB */}
            <TabsContent value="backgrounds" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-transparent p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus className="h-4 w-4 text-blue-400" />
                    <h2 className="font-bold text-foreground text-sm">Adicionar Fundo</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    <strong className="text-foreground">Horizontal</strong> (1920x1080) → exibido em desktop/notebook ·{' '}
                    <strong className="text-foreground">Vertical</strong> (1080x1920) → exibido em celular
                  </p>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[180px]">
                      <label className="text-xs text-muted-foreground mb-1 block">URL da Imagem</label>
                      <Input value={bgUrl} onChange={(e) => setBgUrl(e.target.value)} placeholder="https://..." className="rounded-xl bg-background/50" />
                    </div>
                    <div className="w-32">
                      <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                      <Input value={bgName} onChange={(e) => setBgName(e.target.value)} placeholder="Nome" className="rounded-xl bg-background/50" />
                    </div>
                    <div className="w-36">
                      <label className="text-xs text-muted-foreground mb-1 block">Orientação</label>
                      <Select value={bgOrientation} onValueChange={(v) => setBgOrientation(v as 'horizontal' | 'vertical')}>
                        <SelectTrigger className="rounded-xl bg-background/50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="horizontal">Horizontal (Desktop)</SelectItem>
                          <SelectItem value="vertical">Vertical (Mobile)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="bg-premium" checked={bgPremium} onCheckedChange={setBgPremium} />
                      <Label htmlFor="bg-premium" className="text-xs flex items-center gap-1">
                        <Crown className="w-3 h-3 text-yellow-500" /> Premium
                      </Label>
                    </div>
                    <Button onClick={addBackground} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Adicionar</Button>
                  </div>
                </div>
              </motion.div>

              <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2"><Wallpaper className="h-4 w-4 text-primary" /><h2 className="font-bold text-foreground text-sm">Fundos Disponíveis</h2></div>
                  <Badge variant="secondary" className="text-[10px]">{backgrounds.length}</Badge>
                </div>
                {loadingBg ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : backgrounds.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Nenhum fundo adicionado</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {backgrounds.map((bg, i) => (
                      <motion.div key={bg.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                        <div className="flex items-center gap-3 p-3 rounded-2xl border border-border/20 bg-muted/10 hover:bg-muted/30 transition-all group relative">
                          <button onClick={() => deleteBackground(bg.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity p-1">
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <div className="relative w-28 h-16 rounded-xl overflow-hidden ring-2 ring-border/20 shrink-0">
                            <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" loading="lazy" />
                            {bg.is_premium && (
                              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                                <Crown className="w-2.5 h-2.5 text-black" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Badge variant="outline" className="text-[9px] px-1.5 mb-1">
                              {bg.orientation === 'vertical' ? '📱 Mobile' : '🖥️ Desktop'}
                            </Badge>
                            {editingBgId === bg.id ? (
                              <div className="flex items-center gap-1">
                                <Input value={editBgName} onChange={(e) => setEditBgName(e.target.value)} className="h-6 text-[10px] px-1.5 rounded-lg" autoFocus
                                  onKeyDown={(e) => { if (e.key === 'Enter') saveBgEdit(bg.id); if (e.key === 'Escape') setEditingBgId(null); }} />
                                <button onClick={() => saveBgEdit(bg.id)} className="text-green-400"><Check className="h-3.5 w-3.5" /></button>
                                <button onClick={() => setEditingBgId(null)} className="text-red-400"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 group/name">
                                <span className="text-xs text-muted-foreground font-semibold truncate">{bg.name}</span>
                                <button onClick={() => { setEditingBgId(bg.id); setEditBgName(bg.name); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity">
                                  <Pencil className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => toggleBgPremium(bg)}
                              className={`mt-1 text-[9px] px-2 py-0.5 rounded-full font-bold transition-colors ${bg.is_premium ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                            >
                              {bg.is_premium ? '★ Premium' : 'Grátis'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AdminCustomization;
