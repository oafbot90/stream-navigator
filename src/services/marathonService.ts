import { supabase } from "@/integrations/supabase/client";

export interface Marathon {
  id: string;
  title: string;
  description: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  position: number;
  is_active: boolean;
}

export interface MarathonItem {
  id: string;
  marathon_id: string;
  content_id: string;
  content_type: 'movie' | 'series';
  title: string;
  poster_path: string | null;
  position: number;
}

async function enrichMarathonsBackdrops(marathons: Marathon[]): Promise<Marathon[]> {
  const missing = marathons.filter((m) => !m.backdrop_path && !m.poster_path);
  if (missing.length === 0) return marathons;

  const { data: items } = await supabase
    .from('marathon_items')
    .select('marathon_id, content_id, content_type, position')
    .in('marathon_id', missing.map((m) => m.id))
    .order('position', { ascending: true });

  const firstByMarathon = new Map<string, { id: string; type: 'movie' | 'series' }>();
  (items || []).forEach((it: any) => {
    if (!firstByMarathon.has(it.marathon_id)) {
      firstByMarathon.set(it.marathon_id, { id: it.content_id, type: it.content_type });
    }
  });

  const movieIds = [...firstByMarathon.values()].filter((v) => v.type === 'movie').map((v) => v.id);
  const seriesIds = [...firstByMarathon.values()].filter((v) => v.type === 'series').map((v) => v.id);

  const [moviesRes, seriesRes] = await Promise.all([
    movieIds.length
      ? supabase.from('movies_catalog').select('id, poster_path, backdrop_path').in('id', movieIds)
      : Promise.resolve({ data: [] as any[] }),
    seriesIds.length
      ? supabase.from('series_catalog').select('id, poster_path, backdrop_path').in('id', seriesIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const imgById = new Map<string, { poster: string | null; backdrop: string | null }>();
  (moviesRes.data || []).forEach((m: any) => imgById.set(m.id, { poster: m.poster_path, backdrop: m.backdrop_path }));
  (seriesRes.data || []).forEach((s: any) => imgById.set(s.id, { poster: s.poster_path, backdrop: s.backdrop_path }));

  return marathons.map((m) => {
    if (m.backdrop_path || m.poster_path) return m;
    const first = firstByMarathon.get(m.id);
    if (!first) return m;
    const img = imgById.get(first.id);
    if (!img) return m;
    return { ...m, backdrop_path: img.backdrop || img.poster, poster_path: img.poster };
  });
}

export const getMarathons = async (): Promise<Marathon[]> => {
  const { data, error } = await supabase
    .from('marathons')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) throw error;
  return await enrichMarathonsBackdrops((data || []) as any);
};

export const getAllMarathons = async (): Promise<Marathon[]> => {
  const { data, error } = await supabase
    .from('marathons')
    .select('*')
    .order('position', { ascending: true });

  if (error) throw error;
  return await enrichMarathonsBackdrops(data || []);
};

export const getMarathonDetails = async (id: string): Promise<Marathon> => {
  const { data, error } = await supabase
    .from('marathons')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const getMarathonItems = async (marathonId: string): Promise<MarathonItem[]> => {
  const { data, error } = await supabase
    .from('marathon_items')
    .select('*')
    .eq('marathon_id', marathonId)
    .order('position', { ascending: true });

  if (error) throw error;
  const items = (data || []) as MarathonItem[];

  // Enrich missing poster_path from catalog (which has the TMDB poster).
  const missing = items.filter((i) => !i.poster_path);
  if (missing.length > 0) {
    const movieIds = missing.filter((i) => i.content_type === 'movie').map((i) => i.content_id);
    const seriesIds = missing.filter((i) => i.content_type === 'series').map((i) => i.content_id);

    const [moviesRes, seriesRes] = await Promise.all([
      movieIds.length
        ? supabase.from('movies_catalog').select('id, poster_path, backdrop_path').in('id', movieIds)
        : Promise.resolve({ data: [] as any[] }),
      seriesIds.length
        ? supabase.from('series_catalog').select('id, poster_path, backdrop_path').in('id', seriesIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const posterById = new Map<string, string | null>();
    (moviesRes.data || []).forEach((m: any) => posterById.set(m.id, m.poster_path));
    (seriesRes.data || []).forEach((s: any) => posterById.set(s.id, s.poster_path));

    items.forEach((i) => {
      if (!i.poster_path) {
        const p = posterById.get(i.content_id);
        if (p) i.poster_path = p;
      }
    });
  }

  return items;
};

export const createMarathon = async (marathon: Omit<Marathon, 'id'>): Promise<Marathon> => {
  const { data, error } = await supabase
    .from('marathons')
    .insert(marathon)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateMarathon = async (id: string, updates: Partial<Marathon>): Promise<Marathon> => {
  const { data, error } = await supabase
    .from('marathons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMarathon = async (id: string): Promise<void> => {
  // Delete items first
  await supabase.from('marathon_items').delete().eq('marathon_id', id);
  const { error } = await supabase.from('marathons').delete().eq('id', id);
  if (error) throw error;
};

export const addMarathonItem = async (item: Omit<MarathonItem, 'id'>): Promise<MarathonItem> => {
  const { data, error } = await supabase
    .from('marathon_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data as MarathonItem;
};

export const removeMarathonItem = async (itemId: string): Promise<void> => {
  const { error } = await supabase
    .from('marathon_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
};

export const searchMovies = async (query: string) => {
  const { data, error } = await supabase
    .from('movies_catalog')
    .select('id, title, poster_path')
    .ilike('title', `%${query}%`)
    .limit(10);

  if (error) throw error;
  return data;
};

export const searchSeries = async (query: string) => {
  const { data, error } = await supabase
    .from('series_catalog')
    .select('id, title, poster_path')
    .ilike('title', `%${query}%`)
    .limit(10);

  if (error) throw error;
  return data;
};
