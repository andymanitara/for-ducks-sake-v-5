import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { SKINS, UNLOCK_THRESHOLDS, MAPS } from '@/game/constants';
import { Button } from '@/components/ui/button';
import { Check, Lock, X, Shirt, Dice5, Info } from 'lucide-react';
import { cn, formatLargeTime } from '@/lib/utils';
import { DuckAvatar } from './DuckAvatar';
import { soundSynth } from '@/game/SoundSynth';
import { toast } from 'sonner';
import { Skin } from '@/types/game';
interface SkinSelectorProps {
  onClose: () => void;
  onOpenShop?: () => void;
}
// Rarity Configuration
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
export function SkinSelector({ onClose, onOpenShop }: SkinSelectorProps) {
  const profile = useGameStore(state => state.profile);
  const equipSkin = useGameStore(state => state.equipSkin);
  const equippedSkinId = profile?.equippedSkinId || 'default';
  const unlockedSkinIds = profile?.unlockedSkinIds || ['default'];
  // Sort skins by rarity then name
  const sortedSkins = useMemo(() => {
      const rarityOrder = { legendary: 3, epic: 2, rare: 1, common: 0 };
      return [...SKINS].sort((a, b) => {
          const rA = rarityOrder[a.rarity || 'common'];
          const rB = rarityOrder[b.rarity || 'common'];
          if (rA !== rB) return rA - rB; // Ascending rarity (Common -> Legendary)
          return a.name.localeCompare(b.name);
      });
  }, []);
  const handleEquip = (skinId: string) => {
      equipSkin(skinId);
      soundSynth.playClick();
  };
  const handleRandom = () => {
      const availableSkins = SKINS.filter(s => unlockedSkinIds.includes(s.id));
      if (availableSkins.length > 0) {
          const randomSkin = availableSkins[Math.floor(Math.random() * availableSkins.length)];
          handleEquip(randomSkin.id);
      }
  };
  const handleLockedClick = (skin: Skin) => {
      soundSynth.playClick();
      // Calculate Progress Logic
      let progressPercent = 0;
      let progressText = "";
      let progressSubtext = "";
      let isShopItem = !!skin.cost;
      if (isShopItem) {
          progressText = `Cost: ${skin.cost} Coins`;
          progressSubtext = "Available in the Shop";
          toast.info(skin.name, {
              description: `${progressSubtext} - ${progressText}`,
              action: onOpenShop ? {
                  label: 'SHOP',
                  onClick: () => {
                      soundSynth.playClick();
                      onOpenShop();
                  }
              } : undefined,
              duration: 3000
          });
          return;
      }
      const threshold = UNLOCK_THRESHOLDS[skin.id];
      if (threshold) {
          let current = 0;
          let target = threshold.value;
          if (threshold.type === 'games') {
              current = profile?.gamesPlayed || 0;
              progressText = `${current} / ${target} Games`;
          } else if (threshold.type === 'score') {
              current = profile?.bestTime || 0;
              progressText = `${(current / 1000).toFixed(0)}s / ${(target / 1000).toFixed(0)}s Best Run`;
          } else if (threshold.type === 'total_time') {
              current = profile?.totalTimeSurvived || 0;
              progressText = `${(current / 1000).toFixed(0)}s / ${(target / 1000).toFixed(0)}s Total`;
          }
          progressPercent = Math.min(100, (current / target) * 100);
          progressSubtext = threshold.description;
      } else if (skin.id === 'mother_ducker') {
          const standardMaps = MAPS.filter(m => !m.isSeasonal);
          const unlockedCount = standardMaps.filter(m => profile?.unlockedMapIds.includes(m.id)).length;
          const total = standardMaps.length;
          progressPercent = (unlockedCount / total) * 100;
          progressText = `${unlockedCount} / ${total} Maps`;
          progressSubtext = "Unlock all standard maps";
      } else if (skin.id === 'lafleur') {
          const isGymUnlocked = profile?.unlockedMapIds.includes('gym');
          if (isGymUnlocked) {
              progressPercent = 100;
              progressText = "Requirement Met";
              progressSubtext = "Play one more game to unlock!";
          } else {
              const gymMap = MAPS.find(m => m.id === 'gym');
              const currentTotal = profile?.totalAccumulatedSurvivalTime || 0;
              const targetTotal = gymMap?.totalSurvivalTimeRequired || 3600000; // Default fallback if map not found
              progressPercent = Math.min(100, (currentTotal / targetTotal) * 100);
              progressText = `${formatLargeTime(currentTotal)} / ${formatLargeTime(targetTotal)}`;
              progressSubtext = "Accumulate total survival time to unlock Gym";
          }
      } else if (skin.id === 'glitch_duck') {
          progressText = "SYSTEM ERROR...";
          progressSubtext = "Corrupted Data Detected";
      } else {
          progressText = "Locked";
          progressSubtext = skin.description || "Keep playing to unlock!";
      }
      // Show Toast
      toast.warning(`LOCKED: ${skin.name}`, {
          description: `${progressSubtext} (${Math.round(progressPercent)}%)`,
          duration: 3000
      });
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ opacity: 0 }}
      className="absolute inset-0 bg-white z-50 flex flex-col pointer-events-auto overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b-4 border-black bg-yellow-400 shrink-0">
        <div className="flex items-center gap-3">
            <Shirt className="w-8 h-8 text-black stroke-[3px]" />
            <h2 className="text-2xl font-arcade text-white text-stroke-thick tracking-widest drop-shadow-md">
                WARDROBE
            </h2>
        </div>
        <div className="flex gap-2">
            <Button
                onClick={handleRandom}
                variant="ghost"
                size="icon"
                className="h-12 w-12 border-4 border-black rounded-full bg-white hover:bg-yellow-100 shadow-hard active:translate-y-[2px] active:shadow-none transition-all"
                title="Random Skin"
            >
                <Dice5 className="w-6 h-6 stroke-[3px]" />
            </Button>
            <Button
            onClick={() => { soundSynth.playClick(); onClose(); }}
            variant="ghost"
            size="icon"
            className="h-12 w-12 border-4 border-black rounded-full bg-white hover:bg-red-100 shadow-hard active:translate-y-[2px] active:shadow-none transition-all"
            >
            <X className="w-6 h-6 stroke-[3px]" />
            </Button>
        </div>
      </div>
      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-4">
          {sortedSkins.map((skin) => {
            const isUnlocked = unlockedSkinIds.includes(skin.id);
            const isSelected = equippedSkinId === skin.id;
            const rarity = skin.rarity || 'common';
            const styles = RARITY_CONFIG[rarity];
            return (
              <div
                key={skin.id}
                onClick={() => isUnlocked ? handleEquip(skin.id) : handleLockedClick(skin)}
                className={cn(
                  "relative aspect-square rounded-3xl border-4 transition-all cursor-pointer flex flex-col items-center justify-center p-4 group overflow-hidden",
                  isSelected
                    ? "border-black bg-blue-50 shadow-hard translate-y-[-2px]"
                    : cn("bg-white hover:border-gray-500", styles.border, styles.glow),
                  !isUnlocked && "bg-gray-100 border-gray-300 hover:bg-gray-200 opacity-90"
                )}
              >
                {/* Rarity Badge */}
                <div className={cn(
                    "absolute top-2 left-2 text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase z-10",
                    styles.badge
                )}>
                    {styles.label}
                </div>
                {/* Preview Container */}
                <div className={cn(
                    "w-24 h-24 mb-2 relative transition-transform z-0",
                    isUnlocked && "group-hover:scale-110",
                    !isUnlocked && "opacity-50 grayscale"
                )}>
                    <DuckAvatar
                        skinId={skin.id}
                        emotion="idle"
                        isStatic={true}
                        className="w-full h-full drop-shadow-sm"
                    />
                </div>
                <span className={cn(
                    "font-black text-sm text-center leading-tight uppercase tracking-wide z-10",
                    !isUnlocked && "opacity-50"
                )}>
                    {skin.name}
                </span>
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 border-2 border-black shadow-sm z-10">
                    <Check className="w-4 h-4 stroke-[4px]" />
                  </div>
                )}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-2 text-center">
                    <div className="absolute bottom-2 right-2 bg-black/10 p-1.5 rounded-full backdrop-blur-sm">
                        <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                    {/* Info Hint */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Info className="w-4 h-4 text-blue-500" />
                    </div>
                  </div>
                )}
                {/* Legendary Shine Effect */}
                {rarity === 'legendary' && isUnlocked && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/10 via-transparent to-transparent pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}