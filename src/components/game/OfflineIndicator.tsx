import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="absolute top-0 left-0 right-0 z-[100] flex justify-center pt-4 pointer-events-none"
        >
          <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-hard border-2 border-black flex items-center gap-2 pointer-events-auto">
            <WifiOff className="w-4 h-4" />
            <span className="font-arcade text-xs tracking-widest">OFFLINE MODE</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}