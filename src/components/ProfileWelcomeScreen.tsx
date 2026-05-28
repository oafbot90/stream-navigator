import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileAvatar from '@/components/ProfileAvatar';

const BG_IMAGES = [
  'https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
  'https://image.tmdb.org/t/p/original/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg',
  'https://image.tmdb.org/t/p/original/ym1dxyOk4jFcSl4Q2zmRrA5BEEN.jpg',
  'https://image.tmdb.org/t/p/original/628Dep6AxEtDxjZoGP78TsOxYbK.jpg',
  'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  if (hour >= 18 && hour < 24) return 'Boa noite';
  return 'Boa madrugada';
}

interface ProfileWelcomeScreenProps {
  profileName: string;
  avatarUrl?: string;
  onComplete: () => void;
}

const ProfileWelcomeScreen: React.FC<ProfileWelcomeScreenProps> = ({
  profileName,
  avatarUrl,
  onComplete,
}) => {
  const [visible, setVisible] = useState(true);
  const greeting = getGreeting();
  const bgImage = BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)];

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
        >
          {/* Background with zoom effect */}
          <motion.div
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 3.5, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <img src={bgImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
          </motion.div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-6">
            {/* Avatar with glow ring */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.7, type: 'spring', stiffness: 180, damping: 15 }}
              className="relative"
            >
              {/* Glow ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.6, 0.3], scale: [0.8, 1.1, 1.05] }}
                transition={{ delay: 0.5, duration: 1.5 }}
                className="absolute -inset-3 rounded-full bg-primary/20 blur-xl"
              />
              <ProfileAvatar
                avatarUrl={avatarUrl}
                name={profileName}
                size="lg"
                className="w-28 h-28 sm:w-36 sm:h-36 ring-[3px] ring-primary/60 shadow-2xl shadow-primary/20 relative z-10"
              />
            </motion.div>

            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-7 text-lg sm:text-xl text-white/50 font-medium tracking-wide"
            >
              {greeting},
            </motion.p>

            <motion.h1
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="mt-1 text-3xl sm:text-5xl font-bold text-white tracking-tight"
            >
              {profileName}
            </motion.h1>

            {/* Subtle loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.3 }}
              className="mt-8 w-32 h-1 rounded-full bg-white/10 overflow-hidden"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-full h-full bg-gradient-to-r from-transparent via-primary/60 to-transparent"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileWelcomeScreen;
