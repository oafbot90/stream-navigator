import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfiles } from '@/contexts/ProfileContext';
import { tmdbApi, posterSizes } from './tmdbApi';

export interface WatchedContent {
  id: string;
  user_id: string;
  profile_id: string;
  content_id: string;
  content_type: 'movie' | 'tv';
  title: string;
  poster_path?: string;
  progress_percent?: number;
  last_position?: number;
  season?: number;
  episode?: number;
  watched_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Helper function to fetch TMDB details
const fetchTMDBDetails = async (contentId: string, contentType: string) => {
  try {
    if (contentId.startsWith('tt')) {
      const response = await tmdbApi.findByImdbId(contentId);
      const item = contentType === 'movie'
        ? response?.movie_results?.[0]
        : response?.tv_results?.[0];

      if (item?.id) {
        return {
          title: item.title || item.name || `Título ${contentId}`,
          poster_path: item.poster_path || null
        };
      }
      return { title: `IMDb ${contentId}`, poster_path: null };
    }

    const tmdbId = parseInt(contentId);
    if (isNaN(tmdbId)) return null;

    const validContentType = contentType as 'movie' | 'tv';
    const details = validContentType === 'movie'
      ? await tmdbApi.getMovieDetails(tmdbId)
      : await tmdbApi.getTVShowDetails(tmdbId);

    if (details) {
      const title = validContentType === 'movie' ? details.title : details.name;
      return { title: title || `Título ${contentId}`, poster_path: details.poster_path || null };
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar detalhes TMDB:', error);
    return null;
  }
};

// Enrich items with TMDB data if needed
const enrichItems = async (data: any[]) => {
  return Promise.all(data.map(async (item) => {
    const needsUpdate = 
      !item.title || 
      item.title === 'Título desconhecido' || 
      /^(Filme|Série)\s+tt\d+$/.test(item.title) ||
      !item.poster_path;

    if (needsUpdate && !item.content_id.startsWith('tt')) {
      const tmdbDetails = await fetchTMDBDetails(item.content_id, item.content_type);
      if (tmdbDetails) {
        await supabase
          .from('watched_content')
          .update({ title: tmdbDetails.title ?? 'Título desconhecido', poster_path: tmdbDetails.poster_path ?? null })
          .eq('id', item.id);
        return { ...item, title: tmdbDetails.title || 'Título desconhecido', poster_path: tmdbDetails.poster_path || null };
      }
    }
    return { ...item, title: item.title || 'Título desconhecido', poster_path: item.poster_path || null };
  }));
};

// Fetch current user's watched content
export const useWatchedContent = () => {
  const { currentProfile } = useProfiles();
  return useQuery({
    queryKey: ['watchedContent', 'list', currentProfile?.id],
    queryFn: async () => {
      if (!currentProfile) return [];
      const { data, error } = await supabase
        .from('watched_content')
        .select('*')
        .eq('profile_id', currentProfile.id)
        .order('watched_at', { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      return await enrichItems(data) as WatchedContent[];
    },
    enabled: !!currentProfile,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

// Continue watching list
export const useContinueWatching = () => {
  const { currentProfile } = useProfiles();
  return useQuery({
    queryKey: ['continueWatching', currentProfile?.id],
    queryFn: async () => {
      if (!currentProfile) return [];
      const { data, error } = await supabase
        .from('watched_content')
        .select('*')
        .eq('profile_id', currentProfile.id)
        .lt('progress_percent', 95)
        .order('watched_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      return await enrichItems(data) as WatchedContent[];
    },
    enabled: !!currentProfile,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

// Save or update watched content
export const useUpsertWatchedContent = () => {
  const queryClient = useQueryClient();
  const { currentProfile } = useProfiles();

  return useMutation({
    mutationFn: async (content: {
      content_id: string;
      content_type: 'movie' | 'tv';
      title: string;
      poster_path?: string;
      progress_percent?: number;
      last_position?: number;
      season?: number;
      episode?: number;
    }) => {
      if (!currentProfile) throw new Error('No profile selected');
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const tmdbDetails = await fetchTMDBDetails(content.content_id, content.content_type);
      const finalTitle = tmdbDetails?.title || content.title || 'Título desconhecido';
      const finalPosterPath = tmdbDetails?.poster_path || content.poster_path || null;

      const { data: existingContent } = await supabase
        .from('watched_content')
        .select('id')
        .eq('content_id', content.content_id)
        .eq('content_type', content.content_type)
        .eq('profile_id', currentProfile.id)
        .maybeSingle();

      if (existingContent?.id) {
        const { data, error } = await supabase
          .from('watched_content')
          .update({
            progress_percent: content.progress_percent,
            last_position: content.last_position,
            season: content.season,
            episode: content.episode,
            watched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            title: finalTitle,
            poster_path: finalPosterPath,
          })
          .eq('id', existingContent.id)
          .select()
          .single();
        if (error) throw error;
        return data as WatchedContent;
      } else {
        const { data, error } = await supabase
          .from('watched_content')
          .insert({
            content_id: content.content_id,
            content_type: content.content_type,
            title: finalTitle,
            poster_path: finalPosterPath,
            progress_percent: content.progress_percent,
            last_position: content.last_position,
            season: content.season,
            episode: content.episode,
            user_id: user.id,
            profile_id: currentProfile.id,
          })
          .select()
          .single();
        if (error) throw error;
        return data as WatchedContent;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchedContent'] });
      queryClient.invalidateQueries({ queryKey: ['continueWatching'] });
    },
  });
};

// Delete watched content item
export const useDeleteWatchedContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('watched_content')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchedContent'] });
      queryClient.invalidateQueries({ queryKey: ['continueWatching'] });
    },
  });
};

// Get specific watched content item
export const useWatchedContentItem = (contentId: string, contentType: 'movie' | 'tv') => {
  const { currentProfile } = useProfiles();
  return useQuery({
    queryKey: ['watchedContent', 'item', currentProfile?.id, contentId, contentType],
    queryFn: async () => {
      if (!currentProfile) return null;
      const { data, error } = await supabase
        .from('watched_content')
        .select('*')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .eq('profile_id', currentProfile.id)
        .maybeSingle();
      if (error) throw error;
      if (data && (!data.title || data.title === 'Título desconhecido' || /^(Filme|Série)\s+tt\d+$/.test(data.title) || !data.poster_path)) {
        const tmdbDetails = await fetchTMDBDetails(contentId, contentType);
        if (tmdbDetails) {
          data.title = tmdbDetails.title;
          data.poster_path = tmdbDetails.poster_path;
          await supabase.from('watched_content').update({ title: tmdbDetails.title, poster_path: tmdbDetails.poster_path }).eq('id', data.id);
        }
      }
      return data as WatchedContent | null;
    },
    enabled: !!currentProfile && !!contentId && !!contentType,
  });
};
