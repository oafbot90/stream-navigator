import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProfiles } from '@/contexts/ProfileContext';
import { useSubscription } from '@/hooks/useSubscription';
import { getAllProfileBackgrounds } from '@/services/profileCustomizationService';

/**
 * Renders the active profile's background image as a fixed full-screen layer
 * behind all content. Premium backgrounds are only shown for subscribers.
 */
const ProfileBackground: React.FC = () => {
  const { currentProfile } = useProfiles();
  const { isSubscribed } = useSubscription();
  const [allowed, setAllowed] = useState<string | null>(null);

  const backgroundUrl = currentProfile?.background_url ?? null;

  useEffect(() => {
    let mounted = true;
    if (!backgroundUrl) {
      setAllowed(null);
      return;
    }
    getAllProfileBackgrounds()
      .then((bgs) => {
        if (!mounted) return;
        const match = bgs.find((b) => b.url === backgroundUrl);
        // If unknown background (legacy/custom), allow it. If known and premium, gate it.
        if (match && match.is_premium && !isSubscribed) {
          setAllowed(null);
        } else {
          setAllowed(backgroundUrl);
        }
      })
      .catch(() => mounted && setAllowed(backgroundUrl));
    return () => {
      mounted = false;
    };
  }, [backgroundUrl, isSubscribed]);

  return (
    <AnimatePresence mode="wait">
      {allowed && (
        <motion.div
          key={allowed}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed inset-0 pointer-events-none z-0"
          aria-hidden
        >
          <img
            src={allowed}
            alt=""
            className="h-full w-full object-contain object-center"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileBackground;
