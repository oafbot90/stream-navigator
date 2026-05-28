import { supabase } from '@/integrations/supabase/client';

export interface UserCoins {
  id: string;
  user_id: string;
  balance: number;
}

export interface Mission {
  id: string;
  type: string;
  title: string;
  description: string;
  reward: number;
  icon: string;
  target: number;
  category: 'daily' | 'social' | 'watch';
}

export const MISSIONS: Mission[] = [
  { id: 'daily_login', type: 'daily_login', title: 'Login Diário', description: 'Faça login todo dia', reward: 5, icon: '📅', target: 1, category: 'daily' },
  { id: 'join_room', type: 'join_room', title: 'Entrar em 1 Sala', description: 'Entre em uma sala de cinema', reward: 5, icon: '🚪', target: 1, category: 'daily' },
  { id: 'watch_20min', type: 'watch_20min', title: 'Assistir 20 Minutos', description: 'Assista 20 minutos de conteúdo', reward: 10, icon: '⏱️', target: 20, category: 'watch' },
  { id: 'send_5_messages', type: 'send_5_messages', title: 'Enviar 5 Mensagens', description: 'Envie 5 mensagens no chat', reward: 8, icon: '💬', target: 5, category: 'social' },
  { id: 'watch_movie', type: 'watch_movie', title: 'Assistir Filme Completo', description: 'Assista um filme até o final', reward: 15, icon: '🎬', target: 1, category: 'watch' },
  { id: 'invite_friend', type: 'invite_friend', title: 'Convidar Amigo', description: 'Convide um amigo para a plataforma', reward: 20, icon: '👥', target: 1, category: 'social' },
];

export const COIN_PACKAGES = [
  { id: 'pack_50', coins: 50, price: 4.99, label: '50 Moedas', popular: false },
  { id: 'pack_150', coins: 150, price: 9.99, label: '150 Moedas', popular: true },
  { id: 'pack_500', coins: 500, price: 24.99, label: '500 Moedas', popular: false },
];

export const ROOM_COST = 10;
export const DAILY_ROOM_LIMIT = 5;

export const coinService = {
  async getBalance(userId: string): Promise<number> {
    const { data } = await supabase
      .from('user_coins' as any)
      .select('balance')
      .eq('user_id', userId)
      .single();
    if (!data) {
      await supabase.from('user_coins' as any).insert({ user_id: userId, balance: 0 } as any);
      return 0;
    }
    return (data as any).balance || 0;
  },

  async addCoins(userId: string, amount: number, type: string, description: string): Promise<number> {
    const current = await this.getBalance(userId);
    const newBalance = current + amount;

    await supabase
      .from('user_coins' as any)
      .upsert({ user_id: userId, balance: newBalance } as any, { onConflict: 'user_id' });

    await supabase.from('coin_transactions' as any).insert({
      user_id: userId,
      amount,
      type,
      description,
    } as any);

    return newBalance;
  },

  async spendCoins(userId: string, amount: number, description: string): Promise<boolean> {
    const current = await this.getBalance(userId);
    if (current < amount) return false;

    const newBalance = current - amount;
    await supabase
      .from('user_coins' as any)
      .upsert({ user_id: userId, balance: newBalance } as any, { onConflict: 'user_id' });

    await supabase.from('coin_transactions' as any).insert({
      user_id: userId,
      amount: -amount,
      type: 'spend',
      description,
    } as any);

    return true;
  },

  async completeMission(userId: string, missionType: string): Promise<{ success: boolean; coins: number }> {
    const mission = MISSIONS.find(m => m.type === missionType);
    if (!mission) return { success: false, coins: 0 };

    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('user_missions' as any)
      .select('id')
      .eq('user_id', userId)
      .eq('mission_type', missionType)
      .gte('completed_at', today + 'T00:00:00Z')
      .limit(1);
    if (existing && (existing as any[]).length > 0) return { success: false, coins: 0 };

    await supabase.from('user_missions' as any).insert({
      user_id: userId,
      mission_type: missionType,
      coins_earned: mission.reward,
      progress: mission.target,
      target: mission.target,
    } as any);

    const newBalance = await this.addCoins(userId, mission.reward, 'mission', `Missão: ${mission.title}`);
    return { success: true, coins: newBalance };
  },

  async getMissionProgress(userId: string, missionType: string): Promise<{ completed: boolean; progress: number; target: number }> {
    const mission = MISSIONS.find(m => m.type === missionType);
    if (!mission) return { completed: false, progress: 0, target: 1 };

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('user_missions' as any)
      .select('*')
      .eq('user_id', userId)
      .eq('mission_type', missionType)
      .gte('completed_at', today + 'T00:00:00Z')
      .limit(1);

    if (data && (data as any[]).length > 0) {
      return { completed: true, progress: mission.target, target: mission.target };
    }
    return { completed: false, progress: 0, target: mission.target };
  },

  async getDailyLoginStatus(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('user_missions' as any)
      .select('id')
      .eq('user_id', userId)
      .eq('mission_type', 'daily_login')
      .gte('completed_at', today + 'T00:00:00Z')
      .limit(1);
    return !!(data && (data as any[]).length > 0);
  },

  async getDailyRoomCount(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_room_limits' as any)
      .select('rooms_created')
      .eq('user_id', userId)
      .eq('created_date', today)
      .single();
    return (data as any)?.rooms_created || 0;
  },

  async incrementDailyRoomCount(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const current = await this.getDailyRoomCount(userId);
    if (current >= DAILY_ROOM_LIMIT) return false;

    await supabase.from('daily_room_limits' as any).upsert({
      user_id: userId,
      created_date: today,
      rooms_created: current + 1,
    } as any, { onConflict: 'user_id,created_date' });
    return true;
  },
};
