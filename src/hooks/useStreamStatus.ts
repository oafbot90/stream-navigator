import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type StreamStatus = 'online' | 'offline' | 'no-links';

export type StreamStatusRow = {
  id: string;
  title: string;
  type: 'movie' | 'series';
  poster_path: string | null;
  edit_link: string;
  status: StreamStatus;
};

const PAGE = 1000;

async function fetchAll(table: 'movies_catalog' | 'series_catalog'): Promise<StreamStatusRow[]> {
  const out: StreamStatusRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('id,title,poster_path')
      .eq('has_stream', false)
      .order('title', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data || []) as any[];
    const type: 'movie' | 'series' = table === 'movies_catalog' ? 'movie' : 'series';
    const prefix = type === 'movie' ? '/admin/edit-movie/' : '/admin/edit-series/';
    for (const r of rows) {
      out.push({
        id: r.id,
        title: r.title,
        poster_path: r.poster_path,
        type,
        edit_link: prefix + r.id,
        status: 'no-links',
      });
    }
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

export function useStreamStatus(_status: StreamStatus = 'no-links') {
  return useQuery({
    queryKey: ['items-without-streams', 'has_stream'],
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<StreamStatusRow[]> => {
      const [movies, series] = await Promise.all([
        fetchAll('movies_catalog'),
        fetchAll('series_catalog'),
      ]);
      return [...movies, ...series].sort((a, b) => a.title.localeCompare(b.title));
    },
  });
}

export function useStreamStatusCounts() {
  return useQuery({
    queryKey: ['items-without-streams-count', 'has_stream'],
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const [{ count: m, error: e1 }, { count: s, error: e2 }] = await Promise.all([
        supabase.from('movies_catalog').select('id', { count: 'exact', head: true }).eq('has_stream', false),
        supabase.from('series_catalog').select('id', { count: 'exact', head: true }).eq('has_stream', false),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return {
        online: 0,
        offline: 0,
        'no-links': (m ?? 0) + (s ?? 0),
      } as Record<StreamStatus, number>;
    },
  });
}
