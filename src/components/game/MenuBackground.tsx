/**
 * DYNAMIC MENU THEMES
 *
 * This component implements the "Dynamic Menu Themes" feature requested by users.
 * Instead of a static background, the main menu now adapts to the currently selected
 * biome (map). It renders distinct geometric layers and particle effects that match
 * the in-game environment, providing immediate visual feedback and immersion.
 *
 * Supported Themes:
 * - Pond: Drifting lily pads
 * - Glacier: Static ice cracks with shimmer
 * - City: Moving road markings
 * - Gym: Wood floor pattern
 * - Glitch: Digital corruption blocks
 * - Christmas: Snow piles
 * - Bathtub: Tiled grid
 * - Billiards: Green felt with pockets
 */
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BiomeType } from '@/types/game';
import { cn } from '@/lib/utils';
interface MenuBackgroundProps {
  biome?: BiomeType;
}
interface BiomeTheme {
  gradient: string;
  particleType: 'feather' | 'snow' | 'bubble' | 'dust' | 'binary' | 'leaf' | 'sparkle';
  particleColor: string;
}
const BIOME_THEMES: Record<string, BiomeTheme> = {
  pond: {
    gradient: 'bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-600',
    particleType: 'bubble',
    particleColor: 'rgba(255, 255, 255, 0.6)'
  },
  glacier: {
    gradient: 'bg-gradient-to-b from-cyan-200 via-cyan-400 to-blue-500',
    particleType: 'snow',
    particleColor: '#FFFFFF'
  },
  city: {
    gradient: 'bg-gradient-to-b from-gray-300 via-gray-400 to-gray-600',
    particleType: 'dust',
    particleColor: 'rgba(255, 255, 255, 0.4)'
  },
  gym: {
    gradient: 'bg-gradient-to-b from-orange-300 via-orange-400 to-red-500',
    particleType: 'dust',
    particleColor: 'rgba(255, 255, 255, 0.3)'
  },
  glitch: {
    gradient: 'bg-gradient-to-b from-gray-900 via-purple-900 to-black',
    particleType: 'binary',
    particleColor: '#00FF00'
  },
  christmas: {
    gradient: 'bg-gradient-to-b from-red-500 via-green-600 to-blue-900',
    particleType: 'snow',
    particleColor: '#FFFFFF'
  },
  bathtub: {
    gradient: 'bg-gradient-to-b from-cyan-100 via-white to-cyan-200',
    particleType: 'bubble',
    particleColor: 'rgba(100, 200, 255, 0.5)'
  },
  billiards: {
    gradient: 'bg-gradient-to-b from-green-700 via-green-800 to-green-900',
    particleType: 'dust',
    particleColor: 'rgba(255, 255, 255, 0.2)'
  },
  default: {
    gradient: 'bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-600',
    particleType: 'feather',
    particleColor: 'white'
  }
};
// --- Pattern Components ---
const PondPattern = () => (
  <div className="absolute inset-0 overflow-hidden opacity-30">
    {Array.from({ length: 6 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        initial={{ x: Math.random() * 100 + '%', y: Math.random() * 100 + '%' }}
        animate={{
          x: [null, Math.random() * 100 + '%'],
          y: [null, Math.random() * 100 + '%'],
          rotate: [0, 360]
        }}
        transition={{
          duration: 20 + Math.random() * 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear"
        }}
      >
        <svg width="60" height="60" viewBox="0 0 100 100" fill="currentColor" className="text-green-400">
          <path d="M50 0 C22.4 0 0 22.4 0 50 C0 77.6 22.4 100 50 100 C77.6 100 100 77.6 100 50 C100 45 99 40 97 36 L50 50 L85 15 C75 5 63 0 50 0 Z" />
        </svg>
      </motion.div>
    ))}
  </div>
);
const GlacierPattern = () => (
  <div className="absolute inset-0 overflow-hidden opacity-30">
    <svg className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ice-shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 0 L100 100 M200 0 L0 200 M300 0 L0 300" stroke="white" strokeWidth="2" strokeOpacity="0.2" vectorEffect="non-scaling-stroke" />
      <path d="M0 100 L100 0 M0 200 L200 0 M0 300 L300 0" stroke="white" strokeWidth="2" strokeOpacity="0.2" vectorEffect="non-scaling-stroke" />
    </svg>
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-pulse" />
  </div>
);
const GymPattern = () => (
  <div className="absolute inset-0 bg-wood-pattern opacity-30" />
);
const BathtubPattern = () => (
  <div className="absolute inset-0">
    <div className="absolute inset-0 bg-grid-pattern opacity-30" />
    <div className="absolute inset-4 border-4 border-white/20 rounded-[3rem] pointer-events-none" />
  </div>
);
const CityPattern = () => (
  <div className="absolute inset-0 flex justify-center opacity-20">
    <div className="w-4 h-full border-l-4 border-dashed border-white/50" />
    <div className="w-4 h-full border-r-4 border-dashed border-white/50 ml-4" />
    <motion.div
      className="absolute top-0 w-2 h-20 bg-white/30"
      animate={{ top: ['-10%', '110%'] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    />
  </div>
);
const GlitchPattern = () => (
  <div className="absolute inset-0 overflow-hidden">
    {Array.from({ length: 5 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute bg-green-500/20"
        initial={{
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          width: Math.random() * 100 + 50,
          height: Math.random() * 20 + 5
        }}
        animate={{
          opacity: [0, 1, 0],
          x: [0, (Math.random() - 0.5) * 20]
        }}
        transition={{
          duration: 0.2 + Math.random() * 0.5,
          repeat: Infinity,
          repeatDelay: Math.random() * 2
        }}
      />
    ))}
  </div>
);
const BilliardsPattern = () => (
  <div className="absolute inset-0">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] opacity-50" />
    {/* Pockets */}
    <div className="absolute top-0 left-0 w-16 h-16 bg-black rounded-br-full opacity-40" />
    <div className="absolute top-0 right-0 w-16 h-16 bg-black rounded-bl-full opacity-40" />
    <div className="absolute bottom-0 left-0 w-16 h-16 bg-black rounded-tr-full opacity-40" />
    <div className="absolute bottom-0 right-0 w-16 h-16 bg-black rounded-tl-full opacity-40" />
  </div>
);
const ChristmasPattern = () => (
  <div className="absolute inset-0 overflow-hidden">
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute bg-white/20 rounded-full blur-md"
        style={{
          width: 40 + Math.random() * 60,
          height: 40 + Math.random() * 60,
          left: Math.random() * 100 + '%',
          bottom: -20
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3 + Math.random() * 2, repeat: Infinity }}
      />
    ))}
  </div>
);
// --- Main Component ---
export function MenuBackground({ biome = 'pond' }: MenuBackgroundProps) {
  const theme = BIOME_THEMES[biome] || BIOME_THEMES.default;
  // Generate speed lines - Memoized to prevent re-generation on every render
  const speedLines = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    width: Math.random() * 4 + 2,
    height: Math.random() * 100 + 50,
    delay: Math.random() * 2,
    duration: 0.5 + Math.random() * 0.5,
    opacity: 0.1 + Math.random() * 0.2
  })), []);
  // Generate thematic particles - Memoized and dependent on biome
  const particles = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 10 + Math.random() * 20,
    rotation: Math.random() * 360,
    delay: Math.random() * 5,
    duration: 4 + Math.random() * 4,
    // For glitch biome, use binary 0/1
    text: theme.particleType === 'binary' ? (Math.random() > 0.5 ? '1' : '0') : undefined
  })), [theme.particleType]);
  return (
    <div className={`absolute inset-0 overflow-hidden z-0 select-none pointer-events-none transition-colors duration-1000 bg-black`}>
      {/* Base Gradient */}
      <div className={`absolute inset-0 ${theme.gradient} transition-all duration-1000`} />
      {/* Dynamic Biome Pattern Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={biome}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {biome === 'pond' && <PondPattern />}
          {biome === 'glacier' && <GlacierPattern />}
          {biome === 'gym' && <GymPattern />}
          {biome === 'bathtub' && <BathtubPattern />}
          {biome === 'city' && <CityPattern />}
          {biome === 'glitch' && <GlitchPattern />}
          {biome === 'billiards' && <BilliardsPattern />}
          {biome === 'christmas' && <ChristmasPattern />}
        </motion.div>
      </AnimatePresence>
      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.4)_100%)]" />
      {/* Speed Lines Layer */}
      <div className="absolute inset-0 opacity-30">
        {speedLines.map((line) => (
          <div
            key={`line-${line.id}`}
            className="absolute bg-white animate-speed-line"
            style={{
              left: line.left,
              width: `${line.width}px`,
              height: `${line.height}px`,
              animationDuration: `${line.duration}s`,
              animationDelay: `${line.delay}s`,
              opacity: line.opacity,
              top: '-100px' // Start above screen
            }}
          />
        ))}
      </div>
      {/* Thematic Particles */}
      {particles.map((p) => (
        <motion.div
          key={`particle-${p.id}-${biome}`} // Re-mount on biome change
          className="absolute"
          style={{ left: p.left, top: p.top, opacity: 0 }}
          initial={{ y: 0, rotate: p.rotation, opacity: 0 }}
          animate={{
            y: [0, -200],
            rotate: [p.rotation, p.rotation + 45],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay
          }}
        >
          {theme.particleType === 'binary' ? (
             <span className="font-mono font-bold text-green-400 text-opacity-60 text-lg">{p.text}</span>
          ) : theme.particleType === 'bubble' ? (
             <div className="rounded-full border border-white/40 bg-white/10" style={{ width: p.size, height: p.size }} />
          ) : theme.particleType === 'snow' ? (
             <div className="rounded-full bg-white blur-[1px]" style={{ width: p.size/2, height: p.size/2 }} />
          ) : theme.particleType === 'dust' ? (
             <div className="rounded-full bg-white/30 blur-[2px]" style={{ width: p.size/3, height: p.size/3 }} />
          ) : (
            // Default Feather/Leaf Shape
            <svg width={p.size} height={p.size * 1.5} viewBox="0 0 24 36" fill={theme.particleColor}>
              <path d="M12 2C6 2 2 8 2 12C2 18 8 22 12 34C16 22 22 18 22 12C22 8 18 2 12 2ZM12 4C15 4 18 8 18 12C18 15 15 19 12 19C9 19 6 15 6 12C6 8 9 4 12 4Z" opacity="0.6"/>
            </svg>
          )}
        </motion.div>
      ))}
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.05] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')] pointer-events-none mix-blend-overlay" />
    </div>
  );
}