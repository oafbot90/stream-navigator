import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Film, Tv, Loader2, StopCircle } from 'lucide-react';

const TMDBEnrich: React.FC = () => {
  const { toast } = useToast();
  const [running, setRunning] = useState<'movies' | 'series' | null>(null);
  const abortRef = React.useRef(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ updated: 0, errors: 0, remaining: 0 });

  const addLog = (msg: string) =>
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 300));

  const runEnrichment = async (type: 'movies' | 'series') => {
    setRunning(type);
    abortRef.current = false;
    setStats({ updated: 0, errors: 0, remaining: 0 });
    setLogs([]);
    addLog(`🚀 Iniciando enriquecimento de ${type === 'movies' ? 'filmes' : 'séries'}...`);

    let totalUpdated = 0;
    let totalErrors = 0;
    const fn = type === 'movies' ? 'enrich-movies' : 'enrich-series';

    try {
      while (!abortRef.current) {
        const { data, error } = await supabase.functions.invoke(fn, {
          body: {},
        });
        if (error) {
          addLog(`❌ Erro: ${error.message}`);
          break;
        }
        const updated = data?.updated || 0;
        const errors = data?.errors || 0;
        const remaining = data?.remaining || 0;
        totalUpdated += updated;
        totalErrors += errors;
        setStats({ updated: totalUpdated, errors: totalErrors, remaining });
        addLog(`✅ Lote: +${updated} atualizados, ${errors} erros, ${remaining} restantes`);
        if (!data?.total || data.total === 0 || remaining === 0) {
          addLog(`🎉 Concluído! Total: ${totalUpdated} atualizados, ${totalErrors} erros`);
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      if (abortRef.current) addLog(`⏹️ Interrompido pelo usuário`);
      toast({ title: 'Enriquecimento concluído', description: `${totalUpdated} itens atualizados` });
    } catch (e: any) {
      addLog(`❌ Falha: ${e.message}`);
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setRunning(null);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Enriquecer Sinopses (TMDB)</h1>
            <p className="text-sm text-muted-foreground">
              Preenche sinopse, poster, backdrop e metadata faltantes consultando TMDB
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <Film className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-foreground">Filmes</h2>
            </div>
            <Button
              onClick={() => runEnrichment('movies')}
              disabled={running !== null}
              className="w-full"
            >
              {running === 'movies' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
              ) : 'Enriquecer filmes'}
            </Button>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <Tv className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-foreground">Séries</h2>
            </div>
            <Button
              onClick={() => runEnrichment('series')}
              disabled={running !== null}
              className="w-full"
            >
              {running === 'series' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
              ) : 'Enriquecer séries'}
            </Button>
          </Card>
        </div>

        {running && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => { abortRef.current = true; }}
            className="mb-4"
          >
            <StopCircle className="h-4 w-4 mr-2" /> Parar
          </Button>
        )}

        <Card className="p-5 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Atualizados</p>
              <p className="text-2xl font-bold text-emerald-500">{stats.updated}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Erros</p>
              <p className="text-2xl font-bold text-destructive">{stats.errors}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Restantes</p>
              <p className="text-2xl font-bold text-foreground">{stats.remaining}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold mb-2 text-foreground">Log</h3>
          <div className="bg-muted/30 rounded p-3 max-h-80 overflow-y-auto font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">Nenhum log ainda...</p>
            ) : (
              logs.map((l, i) => <div key={i} className="text-foreground/80">{l}</div>)
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default TMDBEnrich;
