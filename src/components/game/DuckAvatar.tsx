import React, { useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { SKINS } from '@/game/constants';
import { cn } from '@/lib/utils';
interface DuckAvatarProps {
  skinId: string;
  emotion: 'idle' | 'excited' | 'nervous' | 'dizzy';
  isStatic?: boolean;
  className?: string;
}
export function DuckAvatar({ skinId, emotion, isStatic = false, className }: DuckAvatarProps) {
  const skin = useMemo(() => SKINS.find(s => s.id === skinId) || SKINS[0], [skinId]);
  // Animation variants based on emotion
  const variants: Variants = {
    static: {
      y: 0,
      scaleY: 1,
      rotate: 0,
      x: 0,
      opacity: 1,
      scale: 1
    },
    idle: {
      y: [0, 2, 0],
      scaleY: [1, 0.98, 1], // Subtle breathing
      rotate: 0,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    excited: {
      y: [0, -10, 0],
      scale: [1, 1.1, 0.95, 1],
      rotate: [0, -3, 3, 0],
      x: 0,
      opacity: 1,
      scaleY: 1,
      transition: {
        duration: 0.4,
        ease: "backOut"
      }
    },
    nervous: {
      x: [-2, 2, -2, 2, 0], // The "Tick" - quick shake
      y: [0, 1, 0],
      rotate: [-2, 2, -1, 1, 0],
      scaleY: 1,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "linear"
      }
    },
    dizzy: {
      y: [0, 2, 0],
      rotate: [-10, 10, -10], // Exaggerated wobble for dizzy
      scaleY: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
  // Eye variants - Subtle widening for nervous
  const eyeVariants: Variants = {
    static: { scale: 1, opacity: 1 },
    idle: { scale: 1, opacity: 1 },
    excited: { scale: 1.1, opacity: 1 },
    nervous: { scale: 1.15, opacity: 1 }, // Wide eyed
    dizzy: { scale: 1, opacity: 1 }
  };
  // Pupil variants - Darting for nervous + Dilation
  const pupilVariants: Variants = {
    static: { x: 0, y: 0, opacity: 1, scale: 1 },
    idle: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 }
    },
    excited: {
      x: 0,
      y: -2,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.2 }
    },
    nervous: {
      x: [0, 3, -3, 0], // Darting eyes
      y: [0, 1, -1, 0],
      opacity: 1,
      scale: 1.4, // Dilated pupils
      transition: {
        scale: { duration: 0.2 }, // Scale happens quickly
        x: {
            duration: 0.4,
            times: [0, 0.2, 0.6, 1],
            repeat: 1, // Do it twice during the tick
            repeatDelay: 0.1
        },
        y: {
            duration: 0.4,
            times: [0, 0.2, 0.6, 1],
            repeat: 1, // Do it twice during the tick
            repeatDelay: 0.1
        }
      }
    },
    dizzy: { x: 0, y: 0, opacity: 1, scale: 1 }
  };
  // Sweat variants - Play once per trigger
  const sweatVariants: Variants = {
    static: { opacity: 0, y: 0 },
    idle: {
      opacity: 0,
      y: 0,
      transition: { duration: 0.1 }
    },
    excited: {
      opacity: [0, 1, 0],
      y: [0, 10, 20],
      transition: {
        duration: 0.6,
        times: [0, 0.2, 1],
        ease: "easeOut"
      }
    },
    nervous: {
      opacity: [0, 1, 0],
      y: [0, 15, 25],
      transition: {
        duration: 0.8,
        times: [0, 0.1, 1],
        ease: "easeOut"
      }
    },
    dizzy: {
      opacity: 0,
      y: 0
    }
  };
  // Geometry Constants (R=70)
  const R = 70;
  const EYE_OFFSET_X = R / 3;
  const EYE_OFFSET_Y = -R / 4;
  const EYE_RADIUS = R / 3;
  const PUPIL_RADIUS = EYE_RADIUS / 2.5;
  const BEAK_OFFSET_Y = R / 4;
  const BEAK_RX = R / 2;
  const BEAK_RY = R / 3;
  const HIGHLIGHT_OFFSET = -R / 3;
  const HIGHLIGHT_RX = R / 3;
  const HIGHLIGHT_RY = R / 5;
  const leftEyeCx = 100 - EYE_OFFSET_X;
  const leftEyeCy = 100 + EYE_OFFSET_Y;
  const rightEyeCx = 100 + EYE_OFFSET_X;
  const rightEyeCy = 100 + EYE_OFFSET_Y;
  const xSize = 15;
  return (
    <motion.div
      className={cn("flex items-center justify-center drop-shadow-2xl", className)}
      variants={variants}
      animate={isStatic ? 'static' : emotion}
      initial={isStatic ? 'static' : 'idle'}
      style={{ opacity: 1 }} // Explicit initialization to prevent runtime warning
    >
      <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
        {/* Shadow */}
        <ellipse cx="100" cy="185" rx="55" ry="12" fill="rgba(0,0,0,0.4)" />
        {/* Body Group */}
        <g transform="translate(0, 15) rotate(5, 100, 100)">
          {/* Main Body */}
          <circle cx="100" cy="100" r={R} fill={skin.color} stroke="black" strokeWidth="10" />
          {/* Highlight */}
          <ellipse
            cx={100 + HIGHLIGHT_OFFSET}
            cy={100 + HIGHLIGHT_OFFSET}
            rx={HIGHLIGHT_RX}
            ry={HIGHLIGHT_RY}
            fill="rgba(255,255,255,0.6)"
            transform={`rotate(-45, ${100 + HIGHLIGHT_OFFSET}, ${100 + HIGHLIGHT_OFFSET})`}
          />
          {/* La Fleur Specifics */}
          {skinId === 'lafleur' && (
            <>
                {/* Hair - Short Black */}
                <path
                    d="M 30 80 Q 100 20 170 80 L 170 100 Q 100 40 30 100 Z"
                    fill="black"
                />
                {/* Clothing - Gold with NO outline */}
                <path
                  d="M 35 120 Q 100 180 165 120 A 70 70 0 0 1 35 120"
                  fill="#FFD700" // Gold
                />
                {/* Red Trim */}
                <path
                  d="M 35 120 Q 100 180 165 120"
                  fill="none"
                  stroke="#FF0000"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
            </>
          )}
          {/* Sir Quacks A Lot Specifics */}
          {skinId === 'sir_quacks_alot' && (
            <>
                {/* Chestplate */}
                <path
                  d="M 35 120 Q 100 180 165 120 A 70 70 0 0 1 35 120"
                  fill="#C0C0C0"
                  stroke="#808080"
                  strokeWidth="6"
                />
                {/* Rivet */}
                <circle cx="100" cy="150" r="5" fill="#606060" />
            </>
          )}
          {/* Quackers Specifics */}
          {skinId === 'quackers' && (
            <>
                {/* White Vest */}
                <path
                  d="M 50 120 Q 100 180 150 120 L 150 90 Q 100 140 50 90 Z"
                  fill="#FFFFFF"
                  stroke="#E0E0E0"
                  strokeWidth="4"
                />
            </>
          )}
          {/* Glitch Specifics */}
          {skinId === 'glitch_duck' && (
            <g>
              <text x="90" y="90" fill="#00FF00" fontSize="16" fontFamily="monospace" fontWeight="bold" textAnchor="middle" style={{ userSelect: 'none' }}>
                1
                <animate attributeName="opacity" values="1;0;1" dur="0.1s" repeatCount="indefinite" />
              </text>
              <text x="115" y="115" fill="#00FF00" fontSize="16" fontFamily="monospace" fontWeight="bold" textAnchor="middle" style={{ userSelect: 'none' }}>
                0
                <animate attributeName="opacity" values="0;1;0" dur="0.15s" repeatCount="indefinite" />
              </text>
              <text x="85" y="120" fill="#00FF00" fontSize="16" fontFamily="monospace" fontWeight="bold" textAnchor="middle" style={{ userSelect: 'none' }}>
                1
                <animate attributeName="x" values="85;88;85" dur="0.05s" repeatCount="indefinite" />
              </text>
              {/* Glitch Bar */}
              <rect x="50" y="80" width="100" height="8" fill="rgba(0, 255, 0, 0.4)">
                 <animate attributeName="y" values="70;130;60;110" dur="1.5s" repeatCount="indefinite" calcMode="discrete" />
                 <animate attributeName="opacity" values="0;0.8;0;0;0.8;0" dur="0.4s" repeatCount="indefinite" />
              </rect>
            </g>
          )}
          {/* Eyes Group */}
          <g>
            {emotion !== 'dizzy' && skinId !== 'quackers' && skin.accessory !== 'visor' && (
              <>
                {/* Left Eye */}
                <motion.g
                  variants={eyeVariants}
                  animate={isStatic ? 'static' : emotion}
                  initial={isStatic ? 'static' : 'idle'}
                  style={{ x: leftEyeCx, y: leftEyeCy, opacity: 1 }}
                >
                  <circle cx={0} cy={0} r={EYE_RADIUS} fill="white" stroke="black" strokeWidth="6" />
                  <motion.circle
                    cx={0} cy={0} r={PUPIL_RADIUS}
                    fill="black"
                    variants={pupilVariants}
                    animate={isStatic ? 'static' : emotion}
                    initial={isStatic ? 'static' : 'idle'}
                    style={{ opacity: 1 }}
                  />
                  <circle cx={PUPIL_RADIUS/2} cy={-PUPIL_RADIUS/2} r={PUPIL_RADIUS/3} fill="white" />
                </motion.g>
                {/* Right Eye */}
                <motion.g
                  variants={eyeVariants}
                  animate={isStatic ? 'static' : emotion}
                  initial={isStatic ? 'static' : 'idle'}
                  style={{ x: rightEyeCx, y: rightEyeCy, opacity: 1 }}
                >
                  <circle cx={0} cy={0} r={EYE_RADIUS} fill="white" stroke="black" strokeWidth="6" />
                  <motion.circle
                    cx={0} cy={0} r={PUPIL_RADIUS}
                    fill="black"
                    variants={pupilVariants}
                    animate={isStatic ? 'static' : emotion}
                    initial={isStatic ? 'static' : 'idle'}
                    style={{ opacity: 1 }}
                  />
                  <circle cx={PUPIL_RADIUS/2} cy={-PUPIL_RADIUS/2} r={PUPIL_RADIUS/3} fill="white" />
                </motion.g>
              </>
            )}
            {/* Quackers Crazy Eyes - Animated */}
            {skinId === 'quackers' && (
              <>
                {/* Left Eye - Big */}
                <motion.g
                  variants={eyeVariants}
                  animate={isStatic ? 'static' : emotion}
                  initial={isStatic ? 'static' : 'idle'}
                  style={{ x: leftEyeCx, y: leftEyeCy, opacity: 1 }}
                >
                  <circle cx={0} cy={0} r={EYE_RADIUS * 1.2} fill="white" stroke="black" strokeWidth="6" />
                  {/* Loopy Ring */}
                  <circle cx={5} cy={-5} r={PUPIL_RADIUS * 1.2} fill="none" stroke="black" strokeWidth="2" />
                  <motion.circle
                    cx={5} cy={-5} r={PUPIL_RADIUS * 0.5}
                    fill="black"
                    variants={pupilVariants}
                    animate={isStatic ? 'static' : emotion}
                    initial={isStatic ? 'static' : 'idle'}
                    style={{ opacity: 1 }}
                  />
                </motion.g>
                {/* Right Eye - Small */}
                <motion.g
                  variants={eyeVariants}
                  animate={isStatic ? 'static' : emotion}
                  initial={isStatic ? 'static' : 'idle'}
                  style={{ x: rightEyeCx, y: rightEyeCy, opacity: 1 }}
                >
                  <circle cx={0} cy={0} r={EYE_RADIUS * 0.8} fill="white" stroke="black" strokeWidth="6" />
                  {/* Loopy Ring */}
                  <circle cx={-2} cy={2} r={PUPIL_RADIUS * 1.0} fill="none" stroke="black" strokeWidth="2" />
                  <motion.circle
                    cx={-2} cy={2} r={PUPIL_RADIUS * 0.4}
                    fill="black"
                    variants={pupilVariants}
                    animate={isStatic ? 'static' : emotion}
                    initial={isStatic ? 'static' : 'idle'}
                    style={{ opacity: 1 }}
                  />
                </motion.g>
              </>
            )}
            {emotion === 'dizzy' && skinId !== 'quackers' && skin.accessory !== 'visor' && (
              <g>
                {/* Left X */}
                <path d={`M ${leftEyeCx - xSize} ${leftEyeCy - xSize} L ${leftEyeCx + xSize} ${leftEyeCy + xSize}`} stroke="black" strokeWidth="6" strokeLinecap="round" />
                <path d={`M ${leftEyeCx + xSize} ${leftEyeCy - xSize} L ${leftEyeCx - xSize} ${leftEyeCy + xSize}`} stroke="black" strokeWidth="6" strokeLinecap="round" />
                {/* Right X */}
                <path d={`M ${rightEyeCx - xSize} ${rightEyeCy - xSize} L ${rightEyeCx + xSize} ${rightEyeCy + xSize}`} stroke="black" strokeWidth="6" strokeLinecap="round" />
                <path d={`M ${rightEyeCx + xSize} ${rightEyeCy - xSize} L ${rightEyeCx - xSize} ${rightEyeCy + xSize}`} stroke="black" strokeWidth="6" strokeLinecap="round" />
              </g>
            )}
          </g>
          {/* Beak */}
          <ellipse
            cx="100"
            cy={100 + BEAK_OFFSET_Y}
            rx={BEAK_RX}
            ry={BEAK_RY}
            fill="#FF8C00"
            stroke="black"
            strokeWidth="6"
          />
          <circle cx={100 - 10} cy={100 + BEAK_OFFSET_Y - 5} r="2" fill="black" opacity="0.6" />
          <circle cx={100 + 10} cy={100 + BEAK_OFFSET_Y - 5} r="2" fill="black" opacity="0.6" />
          {/* Accessories */}
          {skin.accessory === 'tophat' && (
            <g transform="translate(100, 30)">
              <rect x="-40" y="-50" width="80" height="60" fill="#222" stroke="black" strokeWidth="5" />
              <rect x="-60" y="10" width="120" height="15" rx="5" fill="#222" stroke="black" strokeWidth="5" />
              <rect x="-40" y="0" width="80" height="10" fill="#C00" />
            </g>
          )}
          {skin.accessory === 'sunglasses' && (
            <g transform="translate(100, 82.5)">
              <path d="M -55 0 L 55 0 L 50 30 Q 25 40 0 10 Q -25 40 -50 30 Z" fill="black" stroke="black" strokeWidth="3" />
              <line x1="-55" y1="0" x2="-75" y2="-15" stroke="black" strokeWidth="5" />
              <line x1="55" y1="0" x2="75" y2="-15" stroke="black" strokeWidth="5" />
              <path d="M -40 5 L -20 5 L -30 15 Z" fill="rgba(255,255,255,0.4)" />
            </g>
          )}
          {skin.accessory === 'headband' && (
            <g transform="translate(100, 50)">
              <path d="M -70 0 Q 0 -25 70 0 L 70 18 Q 0 -5 -70 18 Z" fill="#D32F2F" stroke="black" strokeWidth="4" />
              <circle cx="68" cy="5" r="12" fill="#D32F2F" stroke="black" strokeWidth="4" />
              <path d="M 75 5 L 95 -5 L 95 25 Z" fill="#D32F2F" stroke="black" strokeWidth="4" />
            </g>
          )}
          {skin.accessory === 'headband_simple' && (
            <g transform="translate(100, 50)">
              <path d="M -70 0 Q 0 -25 70 0 L 70 18 Q 0 -5 -70 18 Z" fill="#D32F2F" stroke="black" strokeWidth="4" />
            </g>
          )}
          {skin.accessory === 'headband_striped' && (
            <g transform="translate(100, 50)">
              <path d="M -70 0 Q 0 -25 70 0 L 70 18 Q 0 -5 -70 18 Z" fill="white" stroke="black" strokeWidth="4" />
              <path d="M -40 2 L -30 2 L -30 12 L -40 12 Z" fill="#D32F2F" />
              <path d="M -10 0 L 0 0 L 0 10 L -10 10 Z" fill="#D32F2F" />
              <path d="M 20 0 L 30 0 L 30 10 L 20 10 Z" fill="#D32F2F" />
              <circle cx="68" cy="5" r="12" fill="white" stroke="black" strokeWidth="4" />
            </g>
          )}
          {skin.accessory === 'helmet' && (
            <g transform="translate(100, 30)">
              <path d="M -78 70 A 78 78 0 1 1 78 70" fill="none" stroke="#9E9E9E" strokeWidth="10" />
              <path d="M -78 70 A 78 78 0 1 1 78 70" fill="rgba(135, 206, 235, 0.2)" />
              <ellipse cx="0" cy="20" rx="20" ry="10" fill="rgba(255,255,255,0.5)" transform="rotate(-30)" />
            </g>
          )}
          {skin.accessory === 'cap_cigar' && (
            <g>
                {/* Cap Group - Sideways Blue */}
                <g transform="translate(100, 100)">
                    {/* Cap Dome */}
                    <path d="M -75 -40 A 75 65 0 0 1 75 -40 L 75 -20 L -75 -20 Z" fill="#1976D2" stroke="#0D47A1" strokeWidth="4" />
                    {/* Visor (Right Side) */}
                    <path d="M 60 -40 L 130 -40 Q 140 -30 130 -20 L 60 -20 Z" fill="#0D47A1" stroke="#0D47A1" strokeWidth="4" />
                </g>
                {/* Cigar Group - Positioned near beak (y ~ 120) */}
                <g transform="translate(130, 125) rotate(15)">
                    {/* Cigar Body */}
                    <rect x="0" y="0" width="40" height="12" fill="#795548" stroke="black" strokeWidth="2" />
                    {/* Ash */}
                    <rect x="40" y="0" width="10" height="12" fill="#BDBDBD" stroke="black" strokeWidth="2" />
                    {/* Ember */}
                    <rect x="48" y="2" width="2" height="8" fill="#FF5722" opacity="0.8">
                        <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
                    </rect>
                </g>
                {/* Smoke Animation */}
                <motion.g transform="translate(180, 120)">
                     <motion.circle
                        cx="0" cy="0" r="4"
                        fill="rgba(255,255,255,0.6)"
                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 0.8, 0], y: -40, scale: 2 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                     />
                     <motion.circle
                        cx="5" cy="10" r="3"
                        fill="rgba(255,255,255,0.5)"
                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 0.6, 0], y: -30, scale: 1.5 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
                     />
                </motion.g>
            </g>
          )}
          {skin.accessory === 'knight' && (
            <g transform="translate(100, 30)">
              {/* Plume */}
              <path d="M 0 -10 Q 60 -40 80 20 Q 50 -10 0 10 Z" fill="#D32F2F" />
              {/* Helmet Dome */}
              <path d="M -80 70 A 80 80 0 1 1 80 70" fill="#C0C0C0" stroke="#606060" strokeWidth="5" />
              {/* Visor */}
              <rect x="-60" y="40" width="120" height="20" rx="5" fill="#404040" />
            </g>
          )}
          {skin.accessory === 'visor' && (
            <g transform="translate(100, 80)">
              {/* Visor Band */}
              <path d="M -70 -10 Q 0 -30 70 -10 L 70 20 Q 0 40 -70 20 Z" fill="#222" stroke="#000" strokeWidth="3" />
              {/* Glowing Strip */}
              <path d="M -60 5 Q 0 -10 60 5" fill="none" stroke="#00FFFF" strokeWidth="4" strokeLinecap="round" opacity="0.8">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
              </path>
            </g>
          )}
          {skin.accessory === 'flames' && (
            <g transform="translate(100, 30)">
              {/* Flame 1 */}
              <motion.path
                d="M -20 20 Q -30 -20 0 -50 Q 30 -20 20 20 Z"
                fill="#FF4500"
                stroke="#FFD700"
                strokeWidth="2"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Flame 2 */}
              <motion.path
                d="M -40 30 Q -50 0 -30 -30 Q -10 0 -20 30 Z"
                fill="#FF8C00"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
              />
              {/* Flame 3 */}
              <motion.path
                d="M 20 30 Q 10 0 30 -30 Q 50 0 40 30 Z"
                fill="#FF8C00"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              />
            </g>
          )}
          {/* Sweat Drops */}
          <g>
            <motion.path
              d="M 165 50 Q 170 40 175 50 A 6 6 0 1 1 165 50"
              fill="#4FC3F7"
              stroke="black"
              strokeWidth="2"
              variants={sweatVariants}
              initial="static"
              animate={isStatic ? 'static' : emotion}
              style={{ opacity: 0 }} // Explicit initial opacity
            />
            <motion.path
              d="M 25 60 Q 30 50 35 60 A 6 6 0 1 1 25 60"
              fill="#4FC3F7"
              stroke="black"
              strokeWidth="2"
              variants={sweatVariants}
              initial="static"
              animate={isStatic ? 'static' : emotion}
              style={{ opacity: 0 }} // Explicit initial opacity
            />
          </g>
        </g>
      </svg>
    </motion.div>
  );
}