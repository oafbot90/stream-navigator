import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, Loader2, Smartphone, ImagePlus } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAILS = ['alezin1299@gmail.com', 'alezin1788@gmail.com'];

interface Release {
  id: string;
  version: string;
  apk_url: string;
  changelog: string | null;
  description: string | null;
  size_mb: number | null;
  min_android: string | null;
  screenshots: any;
  is_active: boolean;
  updated_at: string;
}

const AdminAppReleases: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [version, setVersion] = useState('');
  const [description, setDescription] = useState('');
  const [changelog, setChangelog] = useState('');
  const [minAndroid, setMinAndroid] = useState('6.0');
  const [apkUrl, setApkUrl] = useState('');
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!isAdmin) { navigate('/'); return; }
    fetchReleases();
  }, [user, isAdmin]);

  const fetchReleases = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('app_releases')
      .select('*')
      .order('updated_at', { ascending: false });
    setReleases(data || []);
    setLoading(false);
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'apk_upload');

    const response = await fetch(
      'https://api.cloudinary.com/v1_1/dbgxdlw8l/image/upload',
      { method: 'POST', body: formData }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Erro ao enviar imagem');
    }
    return data.secure_url as string;
  };

  const handleUpload = async () => {
    if (!version.trim() || !apkUrl.trim()) {
      toast({ title: 'Erro', description: 'Versão e link APK obrigatórios', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const screenshots: string[] = [];
      for (const image of screenshotFiles) {
        screenshots.push(await uploadImage(image));
      }

      await (supabase as any).from('app_releases').update({ is_active: false }).eq('is_active', true);

      const { error } = await (supabase as any).from('app_releases').insert({
        version: version.trim(),
        apk_url: apkUrl.trim(),
        description: description.trim() || null,
        changelog: changelog.trim() || null,
        min_android: minAndroid.trim() || '6.0',
        size_mb: null,
        screenshots,
        is_active: true,
      });
      if (error) throw error;

      toast({ title: '✅ Versão publicada!', description: `v${version} publicada com sucesso` });
      setVersion(''); setDescription(''); setChangelog(''); setMinAndroid('6.0');
      setApkUrl(''); setScreenshotFiles([]);
      fetchReleases();
    } catch (e) {
      toast({ title: 'Erro', description: e instanceof Error ? e.message : 'Falha ao publicar', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    if (!current) {
      await (supabase as any).from('app_releases').update({ is_active: false }).eq('is_active', true);
    }
    await (supabase as any).from('app_releases').update({ is_active: !current }).eq('id', id);
    fetchReleases();
  };

  const deleteRelease = async (id: string) => {
    if (!confirm('Excluir esta versão?')) return;
    await (supabase as any).from('app_releases').delete().eq('id', id);
    fetchReleases();
  };

  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="min-h-screen pt-8 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-3 mb-8">
            <Smartphone className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">Versões do App (APK)</h1>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 mb-10 space-y-4">
            <h2 className="text-xl font-bold">Publicar nova versão</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Versão *</Label>
                <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" />
              </div>
              <div>
                <Label>Android mínimo</Label>
                <Input value={minAndroid} onChange={(e) => setMinAndroid(e.target.value)} placeholder="6.0" />
              </div>
            </div>

            <div>
              <Label>Link do APK *</Label>
              <Input
                value={apkUrl}
                onChange={(e) => setApkUrl(e.target.value)}
                placeholder="https://github.com/.../app.apk"
              />
            </div>

            <div>
              <Label>Descrição do app</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="O que é o app, principais recursos..." />
            </div>

            <div>
              <Label>Novidades / Changelog</Label>
              <Textarea value={changelog} onChange={(e) => setChangelog(e.target.value)} rows={3} placeholder="O que mudou nesta versão" />
            </div>

            <div>
              <Label className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Capturas de tela (múltiplas)</Label>
              <Input type="file" accept="image/*" multiple onChange={(e) => setScreenshotFiles(Array.from(e.target.files || []))} />
              {screenshotFiles.length > 0 && <p className="text-xs text-muted-foreground mt-1">{screenshotFiles.length} imagem(ns) selecionada(s)</p>}
            </div>

            <Button onClick={handleUpload} disabled={uploading} className="w-full gap-2">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Publicando...</> : <><Upload className="h-4 w-4" /> Publicar versão</>}
            </Button>
          </div>

          <h2 className="text-xl font-bold mb-4">Versões publicadas</h2>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : releases.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma versão ainda.</p>
          ) : (
            <div className="space-y-3">
              {releases.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">v{r.version}</span>
                      {r.is_active && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">ATIVA</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{r.apk_url}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(r.id, r.is_active)}>
                    {r.is_active ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteRelease(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminAppReleases;
