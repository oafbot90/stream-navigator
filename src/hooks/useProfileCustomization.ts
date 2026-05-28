import { useEffect, useState } from 'react';
import {
  getProfileCustomizationAssets,
  type ProfileBannerAsset,
  type ProfileDecorationAsset,
} from '@/services/profileCustomizationService';
import { useSubscription } from '@/hooks/useSubscription';

interface ProfileCustomizationState {
  banner: ProfileBannerAsset | null;
  decoration: ProfileDecorationAsset | null;
}

export function useProfileCustomization(
  bannerId?: string | null,
  decorationId?: string | null,
): ProfileCustomizationState {
  const { isSubscribed } = useSubscription();
  const [assets, setAssets] = useState<ProfileCustomizationState>({
    banner: null,
    decoration: null,
  });

  useEffect(() => {
    let isMounted = true;

    getProfileCustomizationAssets(bannerId, decorationId)
      .then((nextAssets) => {
        if (!isMounted) return;
        // Gate premium assets — only subscribers can use them
        const banner = nextAssets.banner && (nextAssets.banner as any).is_premium && !isSubscribed
          ? null
          : nextAssets.banner;
        const decoration = nextAssets.decoration && (nextAssets.decoration as any).is_premium && !isSubscribed
          ? null
          : nextAssets.decoration;
        setAssets({ banner, decoration });
      })
      .catch(() => {
        if (isMounted) {
          setAssets({ banner: null, decoration: null });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [bannerId, decorationId, isSubscribed]);

  return assets;
}
