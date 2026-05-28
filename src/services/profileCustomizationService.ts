import { supabase } from '@/integrations/supabase/client';

export interface ProfileBannerAsset {
  id: string;
  name: string;
  url: string;
  is_animated: boolean;
  is_premium: boolean;
  position: number;
}

export interface ProfileDecorationAsset {
  id: string;
  name: string;
  url: string;
  is_animated: boolean;
  is_premium: boolean;
  type: string;
  position: number;
}

export interface ProfileBackgroundAsset {
  id: string;
  name: string;
  url: string;
  is_premium: boolean;
  position: number;
}

let bannersCache: ProfileBannerAsset[] | null = null;
let decorationsCache: ProfileDecorationAsset[] | null = null;
let backgroundsCache: ProfileBackgroundAsset[] | null = null;
let bannersPromise: Promise<ProfileBannerAsset[]> | null = null;
let decorationsPromise: Promise<ProfileDecorationAsset[]> | null = null;
let backgroundsPromise: Promise<ProfileBackgroundAsset[]> | null = null;

async function loadBanners(): Promise<ProfileBannerAsset[]> {
  if (bannersCache) return bannersCache;
  if (bannersPromise) return bannersPromise;

  bannersPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('profile_banners')
        .select('id, name, url, is_animated, is_premium, position')
        .order('position', { ascending: true });

      if (error || !data) {
        bannersCache = [];
        return [];
      }

      bannersCache = data as ProfileBannerAsset[];
      return bannersCache;
    } catch {
      bannersCache = [];
      return [];
    } finally {
      bannersPromise = null;
    }
  })();

  return bannersPromise;
}

async function loadDecorations(): Promise<ProfileDecorationAsset[]> {
  if (decorationsCache) return decorationsCache;
  if (decorationsPromise) return decorationsPromise;

  decorationsPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('profile_decorations')
        .select('id, name, url, is_animated, is_premium, type, position')
        .order('position', { ascending: true });

      if (error || !data) {
        decorationsCache = [];
        return [];
      }

      decorationsCache = data as ProfileDecorationAsset[];
      return decorationsCache;
    } catch {
      decorationsCache = [];
      return [];
    } finally {
      decorationsPromise = null;
    }
  })();

  return decorationsPromise;
}

async function loadBackgrounds(): Promise<ProfileBackgroundAsset[]> {
  if (backgroundsCache) return backgroundsCache;
  if (backgroundsPromise) return backgroundsPromise;

  backgroundsPromise = (async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('profile_backgrounds')
        .select('id, name, url, is_premium, position')
        .order('position', { ascending: true });

      if (error || !data) {
        backgroundsCache = [];
        return [];
      }

      backgroundsCache = data as ProfileBackgroundAsset[];
      return backgroundsCache;
    } catch {
      backgroundsCache = [];
      return [];
    } finally {
      backgroundsPromise = null;
    }
  })();

  return backgroundsPromise;
}

export async function getProfileCustomizationAssets(
  bannerId?: string | null,
  decorationId?: string | null,
) {
  const [banners, decorations] = await Promise.all([loadBanners(), loadDecorations()]);

  return {
    banner: bannerId ? banners.find((item) => item.id === bannerId) ?? null : null,
    decoration: decorationId ? decorations.find((item) => item.id === decorationId) ?? null : null,
  };
}

export async function getAllProfileBackgrounds(): Promise<ProfileBackgroundAsset[]> {
  return loadBackgrounds();
}
