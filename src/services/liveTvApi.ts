import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: number;
  name: string;
}

export interface Channel {
  id: string;
  image: string;
  name: string;
  categories: number[];
  url: string;
  status?: string;
}

export interface LiveTVResponse {
  categories: Category[];
  channels: Channel[];
}

export const fetchLiveTVChannels = async (): Promise<LiveTVResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('livetv-channels');
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as LiveTVResponse;
  } catch (error) {
    console.error('Error fetching live TV channels:', error);
    throw error;
  }
};
