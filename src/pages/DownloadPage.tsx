import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Shield, Zap, CheckCircle2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface AppRelease {
  id: string;
  version: string;
  apk_url: string;
  changelog: string | null;
  description: string | null;
  size_mb: number | null;
  min_android: string | null;
  screenshots: any;
  updated_at: string;
}

const DownloadPage: React.FC = () => {
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('app_releases')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setRelease(data || null);
      setLoading(false);
    })();
  }, []);

  const screenshots: string[] = Array.isArray(release?.screenshots)
    ? (release!.screenshots as any[]).map((s) => (typeof s === 'string' ? s : s?.url)).filter(Boolean)
    : [];

  return (
    <Layout>
      <div className="min-h-screen pt-8 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent border border-primary/20 p-8 md:p-12 mb-10">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-xs font-bold text-primary mb-4">
                  <Smartphone className="h-3.5 w-3.5" /> APP ANDROID OFICIAL
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-3">FlixHub no seu celular</h1>
                <p className="text-muted-foreground mb-6">
                  Assista filmes, séries e canais ao vivo direto do app. Mais rápido, sem navegador.
                </p>
                {loading ? (
                  <Skeleton className="h-12 w-48" />
                ) : release?.apk_url ? (
                  <div className="space-y-3">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 font-bold gap-2 h-12 px-6"
                      asChild
                    >
                      <a href={release.apk_url} download>
                        <Download className="h-5 w-5" />
                        Baixar APK • v{release.version}
                      </a>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {release.size_mb ? `${release.size_mb} MB • ` : ''}
                      Android {release.min_android || '6.0'}+
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma versão disponível ainda.</p>
                )}
              </div>
              <div className="hidden md:flex justify-center">
                <div className="relative">
                  <div className="w-48 h-72 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/40">
                    <Smartphone className="h-24 w-24 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: Zap, title: 'Mais rápido', desc: 'Performance nativa' },
              { icon: Shield, title: '100% seguro', desc: 'Sem dados expostos' },
              { icon: CheckCircle2, title: 'Sempre atualizado', desc: 'Últimos lançamentos' },
            ].map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-2xl p-5">
                <f.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-bold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {release?.description && (
            <div className="bg-card border border-border rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-bold mb-3">Sobre o app</h2>
              <p className="text-muted-foreground whitespace-pre-line">{release.description}</p>
            </div>
          )}

          {/* Screenshots */}
          {screenshots.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Capturas de tela</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                {screenshots.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Screenshot ${i + 1}`}
                    className="h-80 rounded-2xl border border-border snap-start shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Changelog */}
          {release?.changelog && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-3">Novidades da v{release.version}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{release.changelog}</p>
            </div>
          )}

          {/* Install instructions */}
          <div className="mt-8 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
            <h3 className="font-bold text-yellow-500 mb-2">Como instalar?</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Toque em "Baixar APK" acima</li>
              <li>Permita instalação de fontes desconhecidas (se solicitado)</li>
              <li>Abra o arquivo baixado e instale</li>
              <li>Pronto! Faça login e aproveite</li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DownloadPage;
