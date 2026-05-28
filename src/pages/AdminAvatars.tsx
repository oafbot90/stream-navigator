import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ImagePlus, Plus, Users, Pencil, Check, X, Trash2, Loader2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { avatarService, AppAvatar } from '@/services/avatarService';
import { motion } from 'framer-motion';

const ADMIN_EMAILS = ['alezin1299@gmail.com', 'alezin1788@gmail.com'];

const AdminAvatars: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [avatars, setAvatars] = useState<AppAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newIsPremium, setNewIsPremium] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadAvatars();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const loadAvatars = async () => {
    try {
      setLoading(true);
      const data = await avatarService.getAvatars();
      setAvatars(data);
    } catch (err) {
      toast({ title: 'Erro ao carregar avatares', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newUrl.trim() || !newName.trim()) {
      toast({ title: 'Preencha URL e nome', variant: 'destructive' });
      return;
    }
    try {
      const avatar = await avatarService.addAvatar({
        url: newUrl.trim(),
        name: newName.trim(),
        color: 'from-gray-400 to-gray-600',
        position: avatars.length,
        is_premium: newIsPremium,
      });
      setAvatars([...avatars, avatar]);
      setNewUrl('');
      setNewName('');
      setNewIsPremium(false);
      toast({ title: 'Avatar adicionado!' });
    } catch (err) {
      toast({ title: 'Erro ao adicionar', variant: 'destructive' });
    }
  };

  const startEditing = (avatar: AppAvatar) => {
    setEditingId(avatar.id);
    setEditName(avatar.name);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) {
      toast({ title: 'Nome não pode estar vazio', variant: 'destructive' });
      return;
    }
    try {
      await avatarService.updateAvatar(id, { name: editName.trim() });
      setAvatars(avatars.map(a => a.id === id ? { ...a, name: editName.trim() } : a));
      setEditingId(null);
      toast({ title: 'Nome atualizado!' });
    } catch (err) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
  };

  const togglePremium = async (avatar: AppAvatar) => {
    try {
      const newVal = !avatar.is_premium;
      await avatarService.updateAvatar(avatar.id, { is_premium: newVal });
      setAvatars(avatars.map(a => a.id === avatar.id ? { ...a, is_premium: newVal } : a));
      toast({ title: newVal ? 'Marcado como Premium' : 'Marcado como Grátis' });
    } catch (err) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await avatarService.deleteAvatar(id);
      setAvatars(avatars.filter(a => a.id !== id));
      toast({ title: 'Avatar removido!' });
    } catch (err) {
      toast({ title: 'Erro ao remover', variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="rounded-xl"><ChevronLeft className="h-4 w-4 mr-1" /> Admin</Button>
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-500/5 border border-rose-500/20">
                <ImagePlus className="h-5 w-5 text-rose-400" />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Avatares de Perfil</h1>
            </div>
          </motion.div>

          {/* Add */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/5 to-transparent p-6 mb-8">
              <div className="flex items-center gap-2 mb-4"><Plus className="h-4 w-4 text-rose-400" /><h2 className="font-bold text-foreground text-sm">Adicionar Novo Avatar</h2></div>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-muted-foreground mb-1 block">URL da Imagem</label>
                  <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." className="rounded-xl bg-background/50 border-border/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome" className="w-36 rounded-xl bg-background/50 border-border/30" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={newIsPremium} onCheckedChange={setNewIsPremium} />
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Crown className="w-3 h-3 text-yellow-500" /> Premium
                  </label>
                </div>
                <Button onClick={handleAdd} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Adicionar</Button>
              </div>
            </div>
          </motion.div>

          {/* Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><h2 className="font-bold text-foreground text-sm">Avatares Disponíveis</h2></div>
                <Badge variant="secondary" className="text-[10px]">{avatars.length}</Badge>
              </div>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {avatars.map((avatar, index) => (
                    <motion.div key={avatar.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.03 }}>
                      <div className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-border/20 bg-muted/10 hover:bg-muted/30 hover:border-primary/20 transition-all group cursor-default relative">
                        <button
                          onClick={() => handleDelete(avatar.id)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <div className="relative">
                          <Avatar className="w-14 h-14 ring-2 ring-border/20 group-hover:ring-primary/30 transition-all">
                            <AvatarImage src={avatar.url} alt={avatar.name} className="object-cover" />
                            <AvatarFallback className="bg-muted text-muted-foreground font-bold">{avatar.name[0]}</AvatarFallback>
                          </Avatar>
                          {avatar.is_premium && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                              <Crown className="w-2.5 h-2.5 text-black" />
                            </div>
                          )}
                        </div>
                        {editingId === avatar.id ? (
                          <div className="flex items-center gap-1 w-full">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-6 text-[10px] px-1.5 rounded-lg bg-background/80 border-primary/30 w-full"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit(avatar.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button onClick={() => saveEdit(avatar.id)} className="text-green-400 hover:text-green-300 shrink-0"><Check className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300 shrink-0"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 group/name">
                            <span className="text-[10px] text-muted-foreground font-semibold truncate max-w-full">{avatar.name}</span>
                            <button onClick={() => startEditing(avatar)} className="opacity-0 group-hover/name:opacity-100 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity shrink-0">
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        {/* Premium toggle */}
                        <button
                          onClick={() => togglePremium(avatar)}
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition-colors ${avatar.is_premium ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        >
                          {avatar.is_premium ? '★ Premium' : 'Grátis'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminAvatars;
