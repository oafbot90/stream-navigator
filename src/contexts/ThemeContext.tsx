
import React, { createContext, useContext, useState, useEffect } from 'react';

// Theme definitions
export type ThemeType = 
  | 'darkNeon' // Default
  | 'classicCinema'
  | 'sciFiUI'
  | 'terror'
  | 'christmas'
  | 'anime'
  | 'matrix'
  | 'romancePastel'
  | 'chicGold'
  | 'candyPop'
  | 'floralVintage'
  | 'bossLady'
  | 'glamRock'
  | 'pinkHacker'
  | 'stitch';

interface ThemeContextType {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  getThemeLabel: (theme: ThemeType) => string;
  getThemeDescription: (theme: ThemeType) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get saved theme from localStorage or use default
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    const savedTheme = localStorage.getItem('flixhub-theme');
    return (savedTheme as ThemeType) || 'darkNeon';
  });

  // Apply theme classes when theme changes
  useEffect(() => {
    // Remove all theme classes
    document.documentElement.classList.forEach(className => {
      if (className.startsWith('theme-')) {
        document.documentElement.classList.remove(className);
      }
    });

    // Add new theme class
    document.documentElement.classList.add(`theme-${currentTheme}`);
    
    // Save to localStorage
    localStorage.setItem('flixhub-theme', currentTheme);
  }, [currentTheme]);

  // Function to set theme
  const setTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
  };

  // Get human-readable theme label in Portuguese
  const getThemeLabel = (theme: ThemeType): string => {
    const labels: Record<ThemeType, string> = {
      darkNeon: 'Neon Escuro',
      classicCinema: 'Cinema Clássico',
      sciFiUI: 'Interface Sci-Fi',
      terror: 'Terror',
      christmas: 'Modo Natal',
      anime: 'Anime/Otaku',
      matrix: 'Hacker (Matrix)',
      romancePastel: 'Romance Pastel',
      chicGold: 'Chique Dourado e Preto',
      candyPop: 'Doce Pop',
      floralVintage: 'Floral Vintage',
      bossLady: 'Chefe Poderosa',
      glamRock: 'Glam Rock',
      pinkHacker: 'Hacker Rosa',
      stitch: 'Stitch (Modo Ohana)',
    };
    
    return labels[theme];
  };

  // Get theme description in Portuguese
  const getThemeDescription = (theme: ThemeType): string => {
    const descriptions: Record<ThemeType, string> = {
      darkNeon: 'Tema escuro moderno com acentos neon',
      classicCinema: 'Estilo vintage de cinema clássico',
      sciFiUI: 'Interface futurística com elementos brilhantes',
      terror: 'Atmosfera escura e assustadora',
      christmas: 'Tema festivo de feriado',
      anime: 'Estilo colorido para fãs de anime',
      matrix: 'Interface digital estilo código',
      romancePastel: 'Cores suaves para conteúdo romântico',
      chicGold: 'Design elegante e luxuoso',
      candyPop: 'Cores brilhantes e alegres',
      floralVintage: 'Design clássico inspirado em flores',
      bossLady: 'Profissional e elegante',
      glamRock: 'Ousado e dramático com brilho',
      pinkHacker: 'Estilo Matrix com cores femininas',
      stitch: 'Inspirado em Lilo & Stitch',
    };
    
    return descriptions[theme];
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, getThemeLabel, getThemeDescription }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
