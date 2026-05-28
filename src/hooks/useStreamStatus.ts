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

/**
 * Lists movies and episodes that have NO stream links at all
 * (queried from `items_without_streams`, which derives directly from
 * movie_streams / episode_streams via NOT EXISTS).
 */
export function useStreamStatus(_status: StreamStatus = 'no-links') {
  return useQuery({
    queryKey: ['items-without-streams'],
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<StreamStatusRow[]> => {
      const { data, error } = await supabase
        .from('items_without_streams' as any)
        .select('id,title,poster_path,type,edit_link,status')
        .order('title', { ascending: true })
        .limit(10000);
      if (error) throw error;
      return (data as any[]) as StreamStatusRow[];
    },
  });
}

export function useStreamStatusCounts() {
  return useQuery({
    queryKey: ['items-without-streams-count'],
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('items_without_streams' as any)
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      return {
        online: 0,
        offline: 0,
        'no-links': count ?? 0,
      } as Record<StreamStatus, number>;
    },
  });
}
