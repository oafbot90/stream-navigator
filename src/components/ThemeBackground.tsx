
import React, { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// Pre-generate fixed particle data to avoid Math.random() on every render
function generateParticles(count: number, seed: number = 1) {
  return Array.from({ length: count }, (_, i) => {
    const x = ((i * 137.508 * seed) % 100);
    const y = ((i * 97.321 * seed) % 100);
    const delay = (i * 0.3) % 3;
    const size = (i % 4) + 1;
    return { x, y, delay, size };
  });
}

const ThemeBackground: React.FC = () => {
  const { currentTheme } = useTheme();

  // Memoize particles so they never re-generate on re-render
  const particles = useMemo(() => ({
    small: generateParticles(20, 1),
    medium: generateParticles(15, 2),
    large: generateParticles(10, 3),
  }), []);

  if (currentTheme === 'darkNeon') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
        {particles.small.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-purple-500/10 animate-pulse"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              willChange: 'opacity',
            }}
          />
        ))}
      </div>
    );
  }

  if (currentTheme === 'classicCinema') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/10 via-black to-yellow-800/10" />
      </div>
    );
  }

  if (currentTheme === 'sciFiUI') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-blue-900/10 to-black" />
        {particles.small.map((p, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-cyan-400/30 animate-pulse"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDelay: `${p.delay}s`,
              willChange: 'opacity',
            }}
          />
        ))}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse" />
      </div>
    );
  }

  if (currentTheme === 'terror') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-gray-900/30" />
        {particles.medium.map((p, i) => (
          <div
            key={i}
            className="absolute bg-red-600/10 blur-sm animate-pulse"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size * 4 + 8}px`,
              height: `${p.size * 4 + 8}px`,
              borderRadius: '50%',
              animationDelay: `${p.delay}s`,
              willChange: 'opacity',
            }}
          />
        ))}
      </div>
    );
  }

  if (currentTheme === 'christmas') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-red-900/10 to-blue-900/20" />
        {particles.medium.map((p, i) => (
          <div
            key={i}
            className="absolute text-white/20 select-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.size * 4 + 10}px`,
              animationDelay: `${p.delay}s`,
            }}
          >
            ❄️
          </div>
        ))}
      </div>
    );
  }

  if (currentTheme === 'anime') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/30 via-purple-900/20 to-blue-900/20" />
        {particles.medium.map((p, i) => (
          <div
            key={i}
            className="absolute text-pink-300/20 select-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.size * 5 + 10}px`,
            }}
          >
            ✨
          </div>
        ))}
      </div>
    );
  }

  if (currentTheme === 'matrix' || currentTheme === 'pinkHacker') {
    const color = currentTheme === 'matrix' ? 'text-green-500/15' : 'text-pink-500/15';
    const char = currentTheme === 'matrix' ? ['1', '0'] : ['♡', '◆'];
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-black" />
        {particles.large.map((p, i) => (
          <div
            key={i}
            className={`absolute font-mono ${color} text-xs`}
            style={{ left: `${i * 10}%`, top: 0 }}
          >
            {Array.from({ length: 20 }, (_, j) => j % 2 === 0 ? char[0] : char[1]).join('')}
          </div>
        ))}
      </div>
    );
  }

  if (currentTheme === 'romancePastel') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/50 via-purple-100/30 to-blue-100/20" />
        {particles.medium.map((p, i) => (
          <div
            key={i}
            className="absolute text-pink-300/30 select-none"
            style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: `${p.size * 5 + 10}px` }}
          >
            💕
          </div>
        ))}
      </div>
    );
  }

  if (currentTheme === 'chicGold') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-black to-gray-900/30" />
        {particles.large.map((p, i) => (
          <div
            key={i}
            className="absolute bg-yellow-500/8 blur-sm"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size * 6 + 15}px`,
              height: `${p.size * 6 + 15}px`,
              borderRadius: '50%',
            }}
          />
        ))}
      </div>
    );
  }

  if (currentTheme === 'candyPop') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200/30 via-purple-200/20 to-blue-200/30" />
        {particles.medium.map((p, i) => (
          <div
            key={i}
            className="absolute text-pink-400/30 select-none"
            style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: `${p.size * 4 + 8}px` }}
          >
            🍭
          </div>
        ))}
      </div>
    );
  }

  if (currentTheme === 'floralVintage') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 via-yellow-100/20 to-pink-100/20" />
        {particles.medium.map((p, i) => (
          <div
            key={i}
            className="absolute text-green-400/20 select-none"
            style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: `${p.size * 6 + 15}px` }}
          >
            🌸
          </div>
        ))}
      </div>
    );
  }

  if (currentTheme === 'bossLady') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 via-purple-100/20 to-gray-200/30" />
      </div>
    );
  }

  if (currentTheme === 'glamRock') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/30 via-black to-purple-900/30" />
        {particles.small.map((p, i) => (
          <div
            key={i}
            className="absolute bg-pink-500/15 blur-sm"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size + 2}px`,
              height: `${p.size + 2}px`,
              borderRadius: '50%',
              willChange: 'opacity',
            }}
          />
        ))}
      </div>
    );
  }

  if (currentTheme === 'stitch') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 via-blue-600/20 to-purple-600/20" />
        {particles.medium.map((p, i) => (
          <div
            key={i}
            className="absolute text-blue-300/30 select-none"
            style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: `${p.size * 5 + 10}px` }}
          >
            🌺
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default ThemeBackground;
