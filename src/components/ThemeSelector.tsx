import React, { useState } from 'react';
import { ThemeType, useTheme } from '@/contexts/ThemeContext';
import { Brush, Palette, Sparkles, Film, Rocket, Skull, Gift, HeartHandshake, Code, Heart, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ThemeCardProps {
  value: ThemeType;
  label: string;
  description: string;
  icon: React.ReactNode;
  colors: string[];
  isSelected: boolean;
  onSelect: (value: ThemeType) => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  value,
  label,
  description,
  icon,
  colors,
  isSelected,
  onSelect,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative group rounded-2xl p-5 cursor-pointer transition-all duration-300 border-2 overflow-hidden",
        isSelected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "border-border bg-card hover:border-primary/40 hover:shadow-md"
      )}
      onClick={() => onSelect(value)}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      {/* Color preview bar */}
      <div className="flex gap-1 mb-4 rounded-lg overflow-hidden h-3">
        {colors.map((color, index) => (
          <div
            key={index}
            className="flex-1 first:rounded-l-lg last:rounded-r-lg"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Icon + Label */}
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          "p-2 rounded-xl transition-colors",
          isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:text-primary"
        )}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">{label}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();
  
  const themeOptions: Array<{
    value: ThemeType;
    label: string;
    description: string;
    icon: React.ReactNode;
    colors: string[];
    category: string;
  }> = [
    { value: 'darkNeon', label: 'Dark Neon', description: 'Escuro moderno com neon', icon: <Palette size={18} />, colors: ['#0d0d0d', '#9D00FF', '#ff1e56', '#2d00f7'], category: 'popular' },
    { value: 'classicCinema', label: 'Cinema Clássico', description: 'Estilo vintage de cinema', icon: <Film size={18} />, colors: ['#111111', '#FFD700', '#a77e58', '#8c3c02'], category: 'popular' },
    { value: 'sciFiUI', label: 'Sci-Fi', description: 'Interface futurística', icon: <Rocket size={18} />, colors: ['#020c1b', '#00d9ff', '#0082c8', '#003366'], category: 'popular' },
    { value: 'terror', label: 'Terror', description: 'Atmosfera sombria', icon: <Skull size={18} />, colors: ['#1a1a1a', '#FF1E1E', '#8a0303', '#380000'], category: 'mood' },
    { value: 'christmas', label: 'Natal', description: 'Tema festivo natalino', icon: <Gift size={18} />, colors: ['#0a2342', '#d42426', '#13793d', '#efd780'], category: 'mood' },
    { value: 'anime', label: 'Anime/Otaku', description: 'Estilo colorido para fãs', icon: <Sparkles size={18} />, colors: ['#231942', '#ffb3c1', '#9d65c9', '#5d54a4'], category: 'style' },
    { value: 'matrix', label: 'Hacker (Matrix)', description: 'Interface digital código', icon: <Code size={18} />, colors: ['#000000', '#00ff00', '#003b00', '#001e00'], category: 'style' },
    { value: 'romancePastel', label: 'Romance Pastel', description: 'Cores suaves e românticas', icon: <Heart size={18} />, colors: ['#ffe5ec', '#d4a5d1', '#ffb6c1', '#ffd1dc'], category: 'elegant' },
    { value: 'chicGold', label: 'Chique Dourado', description: 'Luxuoso e elegante', icon: <Sparkles size={18} />, colors: ['#0d0d0d', '#ffd700', '#b8860b', '#585123'], category: 'elegant' },
    { value: 'candyPop', label: 'Candy Pop', description: 'Cores alegres e brilhantes', icon: <Sparkles size={18} />, colors: ['#e8e8ff', '#ff5da2', '#91a6ff', '#ff88dc'], category: 'style' },
    { value: 'floralVintage', label: 'Floral Vintage', description: 'Design clássico floral', icon: <Palette size={18} />, colors: ['#f9f7f7', '#6b705c', '#c18c8c', '#ddbea9'], category: 'elegant' },
    { value: 'bossLady', label: 'Chefe Poderosa', description: 'Profissional e elegante', icon: <Brush size={18} />, colors: ['#f5f5f5', '#7d2941', '#a13e65', '#c55469'], category: 'elegant' },
    { value: 'glamRock', label: 'Glam Rock', description: 'Ousado com brilho', icon: <Sparkles size={18} />, colors: ['#000000', '#ff0080', '#c900ff', '#00d0ff'], category: 'style' },
    { value: 'pinkHacker', label: 'Hacker Rosa', description: 'Matrix feminino', icon: <Code size={18} />, colors: ['#0d0d0d', '#ff69b4', '#ff3399', '#cc0066'], category: 'style' },
    { value: 'stitch', label: 'Stitch (Ohana)', description: 'Inspirado em Lilo & Stitch', icon: <HeartHandshake size={18} />, colors: ['#0f5ea5', '#8cd4f3', '#ff80ab', '#8e44ad'], category: 'mood' },
  ];

  const categories = [
    { key: 'popular', label: '⭐ Populares' },
    { key: 'mood', label: '🎭 Humor' },
    { key: 'style', label: '🎨 Estilo' },
    { key: 'elegant', label: '✨ Elegantes' },
  ];

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const filtered = activeCategory 
    ? themeOptions.filter(t => t.category === activeCategory) 
    : themeOptions;

  return (
    <div className="space-y-6">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            !activeCategory 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeCategory === cat.key 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Theme grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((theme) => (
          <ThemeCard
            key={theme.value}
            value={theme.value}
            label={theme.label}
            description={theme.description}
            icon={theme.icon}
            colors={theme.colors}
            isSelected={currentTheme === theme.value}
            onSelect={setTheme}
          />
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
