import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SKINS, MAPS } from '@/game/constants';
import { soundSynth } from '@/game/SoundSynth';
import { Check, Star } from 'lucide-react';
import { MapPreview } from './MapPreview';
import { cn } from '@/lib/utils';
import { Confetti } from '@/components/ui/confetti';
import { DuckAvatar } from './DuckAvatar';
interface UnlockModalProps {
  skinIds: string[]; // Contains both skin IDs and map IDs
  onClose: () => void;
}
export function UnlockModal({ skinIds, onClose }: UnlockModalProps) {
  useEffect(() => {
    soundSynth.playUnlock();
  }, []);
  // Filter unlocked items
  const unlockedSkins = SKINS.filter(s => skinIds.includes(s.id));
  const unlockedMaps = MAPS.filter(m => skinIds.includes(m.id));
  // Combine them into a unified list for rendering
  const items = [
    ...unlockedSkins.map(s => ({ type: 'skin' as const, data: s })),
    ...unlockedMaps.map(m => ({ type: 'map' as const, data: m }))
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ opacity: 0 }} // Explicit initialization
      className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 pointer-events-auto pb-safe"
    >
      {/* Confetti Burst on Mount */}
      <Confetti count={60} />
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        style={{ opacity: 0 }} // Explicit initialization
        className="relative max-w-sm w-full text-center flex flex-col max-h-[90vh]"
      >
        {/* Label */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 bg-yellow-400 px-8 py-3 rounded-xl border-4 border-black shadow-hard transform -rotate-2">
            <h2 className="text-xl font-arcade text-black tracking-widest uppercase flex items-center gap-2 whitespace-nowrap">
                <Star className="w-6 h-6 fill-black animate-spin-slow" /> UNLOCKED!
            </h2>
        </div>
        {/* Card Body */}
        <div className="bg-white rounded-[2.5rem] border-4 border-black shadow-hard-xl relative overflow-hidden z-10 flex flex-col w-full">
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
            {/* Scrollable Content */}
            <div className="overflow-y-auto p-8 pt-12 space-y-8 relative z-10 max-h-[60vh]">
                {items.map((item, index) => (
                    <div key={`${item.type}-${item.data.id}`} className="flex flex-col items-center">
                        {item.type === 'skin' ? (
                            // Skin Preview - High Fidelity DuckAvatar
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 20,
                                    delay: index * 0.2 + 0.1
                                }}
                                className="w-40 h-40 mb-4 relative flex items-center justify-center"
                            >
                                <DuckAvatar
                                    skinId={item.data.id}
                                    emotion="excited"
                                    isStatic={false}
                                    className="w-full h-full drop-shadow-2xl"
                                />
                            </motion.div>
                        ) : (
                            // Map Preview
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: [0.9, 1, 0.9] }}
                                transition={{ repeat: Infinity, duration: 3, delay: index * 0.2 }}
                                className="w-32 h-32 rounded-full border-4 border-black shadow-hard mb-4 relative overflow-hidden bg-gray-200"
                            >
                                <MapPreview biome={item.data.id} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 ring-4 ring-black/10 rounded-full pointer-events-none" />
                            </motion.div>
                        )}
                        <div className="flex flex-col items-center gap-1">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-2 border-black/10",
                                item.type === 'skin' ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                            )}>
                                {item.type === 'skin' ? 'NEW SKIN' : 'NEW MAP'}
                            </span>
                            <h3 className="text-2xl font-arcade text-black text-stroke-1 leading-tight text-center">
                                {item.data.name}
                            </h3>
                            <p className="text-gray-500 font-bold text-xs bg-gray-100 px-3 py-1 rounded-lg border-2 border-gray-200 inline-block max-w-[200px]">
                                {item.data.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            {/* Footer */}
            <div className="p-8 pt-4 relative z-20 bg-white shrink-0">
                <Button
                  onClick={onClose}
                  className="w-full h-16 text-2xl font-arcade bg-green-500 hover:bg-green-400 text-white border-4 border-black rounded-2xl shadow-hard active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  AWESOME! <Check className="w-8 h-8 stroke-[4px]" />
                </Button>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
}