import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { SKINS } from '@/game/constants';
import { Button } from '@/components/ui/button';
import { X, ShoppingBag, Coins, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DuckAvatar } from './DuckAvatar';
import { soundSynth } from '@/game/SoundSynth';
import { Confetti } from '@/components/ui/confetti';
import { toast } from 'sonner';
interface ShopModalProps {
  onClose: () => void;
}
// Rarity Configuration (Matching SkinSelector)
const RARITY_CONFIG = {
    common: {
        border: 'border-gray-300',
        badge: 'bg-gray-200 text-gray-600',
        label: 'COMMON',
        glow: ''
    },
    rare: {
        border: 'border-blue-400',
        badge: 'bg-blue-100 text-blue-600',
        label: 'RARE',
        glow: ''
    },
    epic: {
        border: 'border-purple-500',
        badge: 'bg-purple-100 text-purple-700',
        label: 'EPIC',
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]'
    },
    legendary: {
        border: 'border-yellow-500',
        badge: 'bg-yellow-100 text-yellow-700',
        label: 'LEGENDARY',
        glow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]'
    }
};
export function ShopModal({ onClose }: ShopModalProps) {
  const profile = useGameStore(state => state.profile);
  const purchaseSkin = useGameStore(state => state.purchaseSkin);
  const unlockedSkinIds = profile?.unlockedSkinIds || ['default'];
  const coins = profile?.coins || 0;
  const [showConfetti, setShowConfetti] = useState(false);
  // Filter and sort skins: Rarity (Ascending) -> Price (Ascending)
  const shopSkins = useMemo(() => {
      const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
      return SKINS
          .filter(s => s.cost !== undefined && s.cost > 0)
          .sort((a, b) => {
              const rarityA = rarityOrder[a.rarity || 'common'];
              const rarityB = rarityOrder[b.rarity || 'common'];
              // Primary Sort: Rarity
              if (rarityA !== rarityB) {
                  return rarityA - rarityB;
              }
              // Secondary Sort: Cost
              return (a.cost || 0) - (b.cost || 0);
          });
  }, []);
  const handlePurchase = (skin: any) => {
    soundSynth.playClick();
    if (coins >= (skin.cost || 0)) {
        purchaseSkin(skin.id);
        // Trigger visual celebration
        setShowConfetti(true);
        // Reset confetti after animation
        setTimeout(() => setShowConfetti(false), 2000);
    } else {
        const deficit = (skin.cost || 0) - coins;
        toast.error(`Not enough coins! Need ${deficit} more.`);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ opacity: 0 }}
      className="absolute inset-0 bg-white z-50 flex flex-col pointer-events-auto"
    >
      {/* Confetti Overlay */}
      {showConfetti && <Confetti count={50} />}
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b-4 border-black bg-green-500 shrink-0">
        <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-white drop-shadow-md stroke-[3px]" />
            <h2 className="text-2xl font-arcade text-white text-stroke-thick tracking-widest drop-shadow-md">
                SHOP
            </h2>
        </div>
        <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border-2 border-black/10">
            <Coins className="w-5 h-5 text-yellow-300 fill-yellow-500" />
            <span className="font-arcade text-white text-lg tracking-wider drop-shadow-sm">{coins}</span>
        </div>
        <Button
          onClick={() => { soundSynth.playClick(); onClose(); }}
          variant="ghost"
          size="icon"
          className="h-12 w-12 border-4 border-black rounded-full bg-white hover:bg-red-100 shadow-hard active:translate-y-[2px] active:shadow-none transition-all"
        >
          <X className="w-6 h-6 stroke-[3px]" />
        </Button>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {shopSkins.map((skin) => {
            const isOwned = unlockedSkinIds.includes(skin.id);
            const canAfford = coins >= (skin.cost || 0);
            const rarity = skin.rarity || 'common';
            const styles = RARITY_CONFIG[rarity];
            return (
              <div
                key={skin.id}
                className={cn(
                  "relative rounded-3xl border-4 p-4 flex flex-col items-center gap-4 transition-all bg-white overflow-hidden",
                  isOwned ? "border-gray-300 bg-gray-50" : cn(styles.border, styles.glow)
                )}
              >
                {/* Rarity Badge */}
                <div className={cn(
                    "absolute top-2 left-2 text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase z-10",
                    styles.badge
                )}>
                    {styles.label}
                </div>
                {/* Shine Effect for purchasable items */}
                {!isOwned && canAfford && (
                    <div className="absolute inset-0 pointer-events-none z-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
                    </div>
                )}
                {/* Preview */}
                <div className="w-32 h-32 relative flex items-center justify-center z-10">
                    <DuckAvatar
                        skinId={skin.id}
                        emotion="idle"
                        isStatic={false}
                        className={cn("w-full h-full drop-shadow-lg", !isOwned && "grayscale-[0.3]")}
                    />
                    {isOwned && (
                        <div className="absolute top-0 right-0 bg-green-500 text-white rounded-full p-1 border-2 border-black shadow-sm z-10">
                            <Check className="w-5 h-5 stroke-[4px]" />
                        </div>
                    )}
                </div>
                {/* Info */}
                <div className="text-center w-full z-10">
                    <h3 className="text-xl font-black uppercase leading-none mb-1">{skin.name}</h3>
                    <div className="flex items-center justify-center gap-1 text-yellow-600 font-black bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-200 mx-auto w-fit mb-3">
                        <Coins className="w-4 h-4 fill-current" />
                        <span>{skin.cost}</span>
                    </div>
                    {/* Action Button */}
                    {isOwned ? (
                        <Button
                            disabled
                            className="w-full h-12 bg-gray-200 text-gray-500 font-black border-2 border-gray-300 rounded-xl opacity-70"
                        >
                            OWNED
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handlePurchase(skin)}
                            className={cn(
                                "w-full h-12 font-black border-4 border-black rounded-xl shadow-sm active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2",
                                canAfford
                                    ? "bg-green-500 hover:bg-green-400 text-white"
                                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            )}
                        >
                            {canAfford ? (
                                <>BUY NOW</>
                            ) : (
                                <><Lock className="w-4 h-4" /> LOCKED</>
                            )}
                        </Button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
        {shopSkins.length === 0 && (
            <div className="text-center py-10 text-gray-400">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-black uppercase">Shop Empty</p>
                <p className="text-xs font-bold">Check back later for new items!</p>
            </div>
        )}
      </div>
    </motion.div>
  );
}