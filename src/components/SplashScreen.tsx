
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import flixhubLogo from '@/assets/flixhub-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
  videoSrc?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, videoSrc }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simular carregamento
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500); // Aguardar animação de saída
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-superflix-darker overflow-hidden"
        >
          {/* Vídeo de fundo se fornecido */}
          {videoSrc && (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          )}
          
          {/* Overlay escuro */}
          <div className="absolute inset-0 bg-black/50" />
          
          {/* Conteúdo do splash */}
          <div className="relative z-10 text-center">
            {/* Logo/Título */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-8"
            >
              <img src={flixhubLogo} alt="FlixHub" className="h-32 md:h-44 object-contain mx-auto mb-4" />
              <p className="text-xl md:text-2xl text-gray-300 font-light">
                Sua plataforma de streaming
              </p>
            </motion.div>
            
            {/* Barra de progresso */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="w-64 mx-auto"
            >
              <div className="bg-gray-700 rounded-full h-1 mb-4">
                <motion.div
                  className="bg-gradient-to-r from-superflix-primary to-superflix-secondary h-1 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <p className="text-gray-400 text-sm">
                Carregando... {progress}%
              </p>
            </motion.div>
            
            {/* Animação de pontos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="flex justify-center mt-8 space-x-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 bg-superflix-primary rounded-full"
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
