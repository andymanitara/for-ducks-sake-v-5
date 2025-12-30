import React from 'react';
import { motion } from 'framer-motion';
import { DuckAvatar } from '@/components/game/DuckAvatar';
import { cn } from '@/lib/utils';
interface LoadingDuckProps {
  text?: string;
  className?: string;
}
export function LoadingDuck({ text = "Loading...", className }: LoadingDuckProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-4", className)}>
      <motion.div
        animate={{
          y: [0, -15, 0],
          scaleY: [1, 1.1, 0.9, 1]
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-16 h-16 mb-2"
      >
        <DuckAvatar skinId="default" emotion="excited" isStatic={true} className="w-full h-full" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className="font-arcade text-sm text-blue-400 uppercase tracking-widest"
      >
        {text}
      </motion.p>
    </div>
  );
}