import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundSynth } from '@/game/SoundSynth';
interface ResumeCountdownProps {
  onComplete: () => void;
}
export function ResumeCountdown({ onComplete }: ResumeCountdownProps) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    // Initial sound
    soundSynth.playCountdownTick();
    const timer = setInterval(() => {
      setCount((prev) => {
        const next = prev - 1;
        if (next > 0) {
          soundSynth.playCountdownTick();
        } else if (next === 0) {
          soundSynth.playCountdownGo();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (count < 0) {
      onComplete();
    }
  }, [count, onComplete]);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <AnimatePresence mode="wait">
        {count > 0 ? (
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4, ease: "backOut" }}
            className="font-arcade text-9xl text-white text-stroke-thick drop-shadow-[0_10px_0_rgba(0,0,0,0.5)]"
          >
            {count}
          </motion.div>
        ) : count === 0 ? (
          <motion.div
            key="go"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4, ease: "backOut" }}
            className="font-arcade text-8xl text-green-400 text-stroke-thick drop-shadow-[0_10px_0_rgba(0,0,0,0.5)]"
          >
            GO!
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}