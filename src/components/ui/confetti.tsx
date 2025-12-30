import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
const COLORS = ['#FFD700', '#FF69B4', '#00BFFF', '#32CD32', '#FF4500', '#9370DB'];
interface ConfettiProps {
  count?: number;
  className?: string;
}
export function Confetti({ count = 50, className }: ConfettiProps) {
  const [particles, setParticles] = useState<any[]>([]);
  useEffect(() => {
    // Generate particles only on mount to ensure consistent animation start
    const newParticles = Array.from({ length: count }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        // Random velocity for explosion effect
        const velocity = 150 + Math.random() * 300;
        return {
            id: i,
            x: Math.cos(angle) * velocity,
            y: Math.sin(angle) * velocity,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: Math.random() * 720,
            scale: 0.4 + Math.random() * 0.6,
            shape: Math.random() > 0.5 ? 'circle' : 'square',
            delay: Math.random() * 0.1
        };
    });
    setParticles(newParticles);
  }, [count]);
  if (particles.length === 0) return null;
  return (
    <div className={`absolute inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden ${className || ''}`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: p.x,
            y: p.y + 300, // Add gravity effect (falling down)
            rotate: p.rotation,
            opacity: [1, 1, 0], // Fade out at the end
            scale: p.scale
          }}
          transition={{
            duration: 2,
            ease: "easeOut",
            delay: p.delay
          }}
          style={{
            position: 'absolute',
            width: 12,
            height: 12,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      ))}
    </div>
  );
}