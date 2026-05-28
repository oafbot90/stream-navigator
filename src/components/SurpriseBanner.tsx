
import React from 'react';
import { Shuffle, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import SurpriseMeButton from './SurpriseMeButton';

const SurpriseBanner: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-r from-purple-900/80 via-pink-800/80 to-purple-900/80 backdrop-blur-sm border border-purple-500/20 rounded-lg mx-4 my-6 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-2 -right-2 w-20 h-20 bg-pink-500/20 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 -left-4 w-16 h-16 bg-purple-500/20 rounded-full animate-bounce"></div>
        <div className="absolute bottom-2 right-1/3 w-12 h-12 bg-yellow-400/20 rounded-full animate-ping"></div>
      </div>
      
      <div className="relative z-10 px-6 py-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-yellow-400 mr-2 animate-pulse" />
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Não sabe o que assistir?
          </h2>
          <Sparkles className="h-8 w-8 text-yellow-400 ml-2 animate-pulse" />
        </div>
        
        <p className="text-superflix-text-light mb-6 text-lg">
          Deixe que escolhemos algo incrível para você! Filmes, séries ou animes - a surpresa está a um clique de distância.
        </p>
        
        <div className="flex justify-center">
          <SurpriseMeButton />
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-superflix-text-muted">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Filmes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Séries</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Animes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurpriseBanner;
