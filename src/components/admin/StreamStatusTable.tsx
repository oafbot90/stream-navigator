import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Film, Tv } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { StreamStatusRow } from '@/hooks/useStreamStatus';

const posterUrl = (p: string | null) =>
  p ? `https://image.tmdb.org/t/p/w92${p.startsWith('/') ? p : `/${p}`}` : null;

type Props = { rows: StreamStatusRow[]; startIndex?: number };

const Row = memo(({ r, index }: { r: StreamStatusRow; index: number }) => {
  const img = posterUrl(r.poster_path);
  return (
    <tr className="hover:bg-muted/20 transition-colors">
      <td className="px-4 py-2 text-[11px] text-muted-foreground/60 font-mono">{index}</td>
      <td className="px-4 py-2">
        {img ? (
          <img src={img} alt="" loading="lazy" decoding="async" className="w-10 h-14 rounded object-cover" />
        ) : <div className="w-10 h-14 rounded bg-muted/30" />}
      </td>
      <td className="px-4 py-2 font-semibold text-foreground text-xs">{r.title}</td>
      <td className="px-4 py-2">
        <Badge variant="outline" className="text-[10px] font-semibold rounded-lg gap-1">
          {r.type === 'movie' ? <><Film className="h-3 w-3" /> Filme</> : <><Tv className="h-3 w-3" /> Série</>}
        </Badge>
      </td>
      <td className="px-4 py-2 text-[11px] text-muted-foreground tabular-nums">—</td>
      <td className="px-4 py-2">
        <Link to={r.edit_link} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          Editar <ExternalLink className="h-3 w-3" />
        </Link>
      </td>
    </tr>
  );
});
Row.displayName = 'StreamStatusTableRow';

const StreamStatusTable: React.FC<Props> = ({ rows, startIndex = 0 }) => {
  return (
    <div className="rounded-2xl border border-border/20 overflow-hidden bg-card/30 backdrop-blur-sm">
      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/60 backdrop-blur-sm border-b border-border/20">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-12">#</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-16">Poster</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Título</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-24">Tipo</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-40">On / Off</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-28">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">Nenhum item</td></tr>
            )}
            {rows.map((r, i) => (
              <Row key={`${r.type}-${r.id}`} r={r} index={startIndex + i + 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(StreamStatusTable);