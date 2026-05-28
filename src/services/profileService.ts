
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/profile.types';

export const profileService = {
  async getProfiles(userId: string): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }

    return data || [];
  },

  async createProfile(userId: string, profileData: Omit<UserProfile, 'id' | 'user_id' | 'created_at'>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        name: profileData.name,
        avatar_url: profileData.avatar_url,
        pin: profileData.pin,
        is_kids_profile: profileData.is_kids_profile,
        banner_id: profileData.banner_id,
        decoration_id: profileData.decoration_id,
        background_url: profileData.background_url,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      throw error;
    }

    return data;
  },

  async updateProfile(id: string, profileData: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at'>>): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('id', id);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async deleteProfile(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }
};
