import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Copy, Plus, Check, Trash2, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const ADMIN_EMAILS = ['alezin1299@gmail.com', 'alezin1788@gmail.com'];

const generateKeyCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')).join('-');
};

const AdminPremiumKeys: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [durationDays, setDurationDays] = useState(30);
  const [quantity, setQuantity] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  useEffect(() => { if (!isAdmin) { navigate('/'); return; } fetchKeys(); }, [isAdmin]);

  const fetchKeys = async () => {
    const { data } = await supabase.from('premium_keys' as any).select('*').order('created_at', { ascending: false }).limit(100);
    setKeys((data as any[]) || []); setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const newKeys = Array.from({ length: quantity }, () => ({ key_code: generateKeyCode(), duration_days: durationDays, created_by: user!.id }));
      await supabase.from('premium_keys' as any).insert(newKeys as any);
      toast({ title: `${quantity} chave(s) gerada(s)!` }); fetchKeys();
    } catch { toast({ title: 'Erro', variant: 'destructive' }); }
    finally { setGenerating(false); }
  };

  const handleCopy = (keyCode: string, id: string) => { navigator.clipboard.writeText(keyCode); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); toast({ title: 'Copiada!' }); };
  const handleDelete = async (id: string) => { await supabase.from('premium_keys' as any).delete().eq('id', id); toast({ title: 'Removida' }); fetchKeys(); };

  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="rounded-xl"><ChevronLeft className="h-4 w-4 mr-1" /> Admin</Button>
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20">
                <Key className="h-5 w-5 text-yellow-400" />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Chaves Premium</h1>
            </div>
          </motion.div>

          {/* Generate */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-transparent p-6 mb-8">
              <div className="flex items-center gap-2 mb-4"><Sparkles className="h-4 w-4 text-yellow-400" /><h2 className="font-bold text-foreground text-sm">Gerar Novas Chaves</h2></div>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Duração (dias)</label>
                  <Input type="number" value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} className="w-28 rounded-xl bg-background/50 border-border/30" min={1} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Quantidade</label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-20 rounded-xl bg-background/50 border-border/30" min={1} max={50} />
                </div>
                <Button onClick={handleGenerate} disabled={generating} className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold gap-2 rounded-xl hover:from-yellow-400 hover:to-amber-400">
                  <Plus className="h-4 w-4" /> {generating ? 'Gerando...' : 'Gerar Chaves'}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Keys List */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-foreground text-sm">Todas as Chaves</h2>
                <Badge variant="secondary" className="text-[10px]">{keys.length}</Badge>
              </div>
              {loading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" /></div>
              ) : keys.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhuma chave gerada</p>
              ) : (
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                  {keys.map((key: any) => (
                    <div key={key.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${key.is_used ? 'border-border/10 opacity-40' : 'border-yellow-500/10 bg-yellow-500/[0.03] hover:bg-yellow-500/[0.06]'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-bold text-foreground tracking-widest">{key.key_code}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {key.duration_days} dias {key.is_used && `• Usado em ${new Date(key.used_at).toLocaleDateString('pt-BR')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {!key.is_used ? (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(key.key_code, key.id)} className="h-8 w-8 rounded-xl">
                              {copiedId === key.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(key.id)} className="h-8 w-8 rounded-xl text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Usado</Badge>
                        )}
                      </div>
                    </div>
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

export default AdminPremiumKeys;
