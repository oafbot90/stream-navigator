import { supabase } from '@/integrations/supabase/client';

export interface AppAvatar {
  id: string;
  url: string;
  name: string;
  color: string;
  position: number;
  is_premium: boolean;
}

export const avatarService = {
  async getAvatars(): Promise<AppAvatar[]> {
    const { data, error } = await supabase
      .from('app_avatars')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching avatars:', error);
      throw error;
    }
    return data || [];
  },

  async updateAvatar(id: string, updates: Partial<Pick<AppAvatar, 'name' | 'url' | 'color' | 'position' | 'is_premium'>>): Promise<void> {
    const { error } = await supabase
      .from('app_avatars')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async addAvatar(avatar: Omit<AppAvatar, 'id' | 'is_premium'> & { is_premium?: boolean }): Promise<AppAvatar> {
    const { data, error } = await supabase
      .from('app_avatars')
      .insert(avatar)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAvatar(id: string): Promise<void> {
    const { error } = await supabase
      .from('app_avatars')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
