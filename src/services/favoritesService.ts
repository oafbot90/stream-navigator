
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { toast } from "@/components/ui/use-toast";

// Type for favorite items
export interface FavoriteItem {
  id: string;
  user_id: string;
  profile_id: string;
  content_id: string;
  content_type: 'movie' | 'tv';
  title: string;
  poster_path?: string;
  added_at: string;
}

// Check if content is favorite
export const useIsFavorite = (contentId: string, contentType: 'movie' | 'tv') => {
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  
  return useQuery({
    queryKey: ['favorites', 'is-favorite', user?.id, currentProfile?.id, contentId, contentType],
    queryFn: async () => {
      if (!user || !currentProfile) return false;
      
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('profile_id', currentProfile.id)
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking favorite status:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user && !!currentProfile && !!contentId && !!contentType,
  });
};

// Get user's favorite items
export const useFavorites = () => {
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  
  return useQuery({
    queryKey: ['favorites', 'list', user?.id, currentProfile?.id],
    queryFn: async () => {
      if (!user || !currentProfile) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', currentProfile.id)
        .order('added_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching favorites:', error);
        throw error;
      }
      
      return data as FavoriteItem[];
    },
    enabled: !!user && !!currentProfile,
  });
};

// Add a content to favorites
export const useAddToFavorites = () => {
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      contentId, 
      contentType, 
      title, 
      posterPath 
    }: { 
      contentId: string; 
      contentType: 'movie' | 'tv'; 
      title: string; 
      posterPath?: string; 
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      if (!currentProfile) {
        throw new Error('No profile selected');
      }
      
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          profile_id: currentProfile.id,
          content_id: contentId,
          content_type: contentType,
          title,
          poster_path: posterPath
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding to favorites:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

// Remove a content from favorites
export const useRemoveFromFavorites = () => {
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      contentId, 
      contentType 
    }: { 
      contentId: string; 
      contentType: 'movie' | 'tv'; 
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      if (!currentProfile) {
        throw new Error('No profile selected');
      }
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('profile_id', currentProfile.id)
        .eq('content_id', contentId)
        .eq('content_type', contentType);
      
      if (error) {
        console.error('Error removing from favorites:', error);
        throw error;
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};
