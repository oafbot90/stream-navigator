import React, { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Ban, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StreamStatusTable from '@/components/admin/StreamStatusTable';
import { useStreamStatus, useStreamStatusCounts } from '@/hooks/useStreamStatus';

const PAGE_SIZE = 50;

const AdminStreamStatus: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useStreamStatus('no-links');
  const { data: counts } = useStreamStatusCounts();

  const filtered = useMemo(() => {
    const rows = data || [];
    const q = deferredSearch.trim().toLowerCase();
    return q ? rows.filter(r => r.title?.toLowerCase().includes(q)) : rows;
  }, [data, deferredSearch]);

  React.useEffect(() => { setPage(1); }, [deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="rounded-xl border border-border/30">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-foreground tracking-tight">Status dos Links</h1>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mt-1">
                <Ban className="h-3.5 w-3.5 text-yellow-400" />
                Filmes e séries sem nenhum link de stream ({counts?.['no-links'] ?? '…'})
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título..."
                className="pl-9 h-10 rounded-xl bg-card/40 border-border/20"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              <StreamStatusTable rows={paged} startIndex={start} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Mostrando {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} de {filtered.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm" className="h-8 rounded-lg"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <span className="tabular-nums font-mono">{safePage} / {totalPages}</span>
                  <Button
                    variant="outline" size="sm" className="h-8 rounded-lg"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Próxima <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminStreamStatus;
