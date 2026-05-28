import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Save, AlertTriangle } from 'lucide-react';

const ADMIN_EMAILS = ['alezin1299@gmail.com', 'alezin1788@gmail.com'];

const AdminAppConfig: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    min_version: '1.0.0',
    latest_version: '1.0.0',
    force_update: false,
    update_message: '',
    store_url_android: '',
    store_url_ios: '',
  });

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!isAdmin) { navigate('/'); return; }
    load();
  }, [user, isAdmin]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('app_config').select('*').eq('id', 'global').maybeSingle();
    if (error) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    } else if (data) {
      setForm({
        min_version: data.min_version || '1.0.0',
        latest_version: data.latest_version || '1.0.0',
        force_update: data.force_update || false,
        update_message: data.update_message || '',
        store_url_android: data.store_url_android || '',
        store_url_ios: data.store_url_ios || '',
      });
    }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('app_config').upsert({
      id: 'global',
      ...form,
      store_url_android: form.store_url_android || null,
      store_url_ios: form.store_url_ios || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Configuração salva!', description: 'As alterações foram aplicadas.' });
    }
  };

  if (!user || !isAdmin) return null;

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground">Configuração do App</h1>
              <p className="text-sm text-muted-foreground">Controle de versão e atualização forçada</p>
            </div>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : (
            <Card className="bg-card/40 border-border/30">
              <CardHeader>
                <CardTitle className="text-lg">Versões e Atualização</CardTitle>
                <CardDescription>Configure as versões do app e a política de atualização.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_version">Versão mínima aceita</Label>
                    <Input id="min_version" value={form.min_version} onChange={(e) => setForm({ ...form, min_version: e.target.value })} placeholder="1.0.0" />
                  </div>
                  <div>
                    <Label htmlFor="latest_version">Versão mais recente</Label>
                    <Input id="latest_version" value={form.latest_version} onChange={(e) => setForm({ ...form, latest_version: e.target.value })} placeholder="1.0.0" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border/30 p-4 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Forçar atualização</p>
                      <p className="text-xs text-muted-foreground">Bloqueia o uso do app em versões antigas.</p>
                    </div>
                  </div>
                  <Switch checked={form.force_update} onCheckedChange={(v) => setForm({ ...form, force_update: v })} />
                </div>

                <div>
                  <Label htmlFor="update_message">Mensagem de atualização</Label>
                  <Textarea id="update_message" rows={3} value={form.update_message} onChange={(e) => setForm({ ...form, update_message: e.target.value })} />
                </div>

                <div>
                  <Label htmlFor="android">Link Play Store (Android)</Label>
                  <Input id="android" value={form.store_url_android} onChange={(e) => setForm({ ...form, store_url_android: e.target.value })} placeholder="https://play.google.com/..." />
                </div>

                <div>
                  <Label htmlFor="ios">Link App Store (iOS)</Label>
                  <Input id="ios" value={form.store_url_ios} onChange={(e) => setForm({ ...form, store_url_ios: e.target.value })} placeholder="https://apps.apple.com/..." />
                </div>

                <Button onClick={save} disabled={saving} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar configuração'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminAppConfig;
