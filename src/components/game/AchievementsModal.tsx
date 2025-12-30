import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { ACHIEVEMENTS, MAPS } from '@/game/constants';
import { Button } from '@/components/ui/button';
import { X, Lock, Check, Trophy, Map as MapIcon, CheckCheck, Coins, Star } from 'lucide-react';
import { cn, getUnlockedAchievements, getAchievementProgress } from '@/lib/utils';
import { soundSynth } from '@/game/SoundSynth';
import { DuckAvatar } from './DuckAvatar';
import { Achievement } from '@/types/game';
import { IconMap } from './AchievementIcons';
interface AchievementsModalProps {
  onClose: () => void;
}
export function AchievementsModal({ onClose }: AchievementsModalProps) {
  const profile = useGameStore(state => state.profile);
  const claimAchievement = useGameStore(state => state.claimAchievement);
  const claimAllAchievements = useGameStore(state => state.claimAllAchievements);
  const [activeTab, setActiveTab] = useState<'general' | 'maps'>('general');
  const unlockedAchievements = useMemo(() => profile ? getUnlockedAchievements(profile) : [], [profile]);
  // Memoize sets to prevent recreation on every render
  const unlockedIds = useMemo(() => new Set(unlockedAchievements.map(a => a.id)), [unlockedAchievements]);
  const claimedIds = useMemo(() => new Set(profile?.claimedAchievementIds || []), [profile?.claimedAchievementIds]);
  // Calculate claimable count and total
  const claimableAchievements = useMemo(() => {
      return unlockedAchievements.filter(ach =>
          (ach.rewardCoins || 0) > 0 && !claimedIds.has(ach.id)
      );
  }, [unlockedAchievements, claimedIds]);
  const totalClaimableCoins = useMemo(() => {
      return claimableAchievements.reduce((sum, ach) => sum + (ach.rewardCoins || 0), 0);
  }, [claimableAchievements]);
  // Group achievements
  const groupedAchievements = useMemo(() => {
      const groups: Record<string, Achievement[]> = {
          'General': []
      };
      // Initialize map groups
      MAPS.forEach(m => {
          groups[m.name] = [];
      });
      ACHIEVEMENTS.forEach(ach => {
          if (ach.mapId) {
              const map = MAPS.find(m => m.id === ach.mapId);
              if (map) {
                  groups[map.name].push(ach);
              } else {
                  groups['General'].push(ach);
              }
          } else {
              groups['General'].push(ach);
          }
      });
      return groups;
  }, []);
  const handleClaim = (ach: Achievement) => {
      soundSynth.playClick();
      claimAchievement(ach.id);
  };
  const handleTabChange = (tab: 'general' | 'maps') => {
      soundSynth.playClick();
      setActiveTab(tab);
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ opacity: 0 }} // Explicit initialization
      className="absolute inset-0 bg-white z-50 flex flex-col pointer-events-auto overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 sm:p-6 flex justify-between items-center border-b-4 border-black bg-yellow-400 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-md stroke-[3px] shrink-0" />
            <h2 className="text-lg sm:text-2xl font-arcade text-white text-stroke-thick tracking-widest drop-shadow-md truncate">
                ACHIEVEMENTS
            </h2>
        </div>
        <div className="flex items-center gap-2">
            <Button
            onClick={() => { soundSynth.playClick(); onClose(); }}
            variant="ghost"
            size="icon"
            className="h-10 w-10 sm:h-12 sm:w-12 border-4 border-black rounded-full bg-white hover:bg-red-100 shadow-hard active:translate-y-[2px] active:shadow-none transition-all shrink-0 ml-2"
            >
            <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3px]" />
            </Button>
        </div>
      </div>
      {/* Tab Switcher */}
      <div className="px-4 sm:px-6 pt-4 pb-2 bg-gray-50 shrink-0">
          <div className="grid w-full grid-cols-2 border-4 border-black bg-white p-1 h-auto rounded-xl shadow-hard gap-1">
              <button
                  onClick={() => handleTabChange('general')}
                  className={cn(
                      "font-black py-2 rounded-lg border-2 transition-all flex items-center justify-center gap-2",
                      activeTab === 'general'
                          ? "bg-blue-500 text-white border-black"
                          : "bg-transparent text-gray-500 border-transparent hover:bg-gray-100"
                  )}
              >
                  <Trophy className="w-4 h-4" /> GENERAL
              </button>
              <button
                  onClick={() => handleTabChange('maps')}
                  className={cn(
                      "font-black py-2 rounded-lg border-2 transition-all flex items-center justify-center gap-2",
                      activeTab === 'maps'
                          ? "bg-purple-500 text-white border-black"
                          : "bg-transparent text-gray-500 border-transparent hover:bg-gray-100"
                  )}
              >
                  <MapIcon className="w-4 h-4" /> MAPS
              </button>
          </div>
      </div>
      {/* List - Scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div className="space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          {Object.entries(groupedAchievements).map(([groupName, achievements]) => {
              // Filter based on active tab
              if (activeTab === 'general' && groupName !== 'General') return null;
              if (activeTab === 'maps' && groupName === 'General') return null;
              if (achievements.length === 0) return null;
              return (
                  <div key={groupName} className="space-y-3">
                      {/* Only show header if in Maps tab to reduce clutter in General */}
                      {activeTab === 'maps' && (
                          <h3 className="font-black uppercase text-gray-400 text-sm tracking-widest ml-1 sticky top-0 bg-gray-50 py-2 z-10">
                              {groupName}
                          </h3>
                      )}
                      <div className="grid grid-cols-1 gap-3">
                          {achievements.map((ach) => {
                              const unlocked = unlockedIds.has(ach.id);
                              const claimed = claimedIds.has(ach.id);
                              const Icon = IconMap[ach.icon] || Trophy;
                              const hasReward = !!ach.rewardCoins;
                              // Calculate progress for locked items
                              const progress = !unlocked && profile ? getAchievementProgress(profile, ach) : null;
                              return (
                                  <div
                                      key={ach.id}
                                      className={cn(
                                          "relative rounded-2xl border-4 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 transition-all",
                                          unlocked
                                              ? "border-black bg-white shadow-hard"
                                              : "border-gray-300 bg-gray-100 opacity-80"
                                      )}
                                  >
                                      <div className="flex items-center gap-3 w-full sm:w-auto">
                                          {/* Icon Box */}
                                          <div className={cn(
                                              "w-12 h-12 sm:w-16 sm:h-16 rounded-xl border-4 border-black flex items-center justify-center shrink-0 overflow-hidden relative",
                                              unlocked ? "bg-yellow-300" : "bg-gray-200"
                                          )}>
                                              {ach.rewardSkinId ? (
                                                  <>
                                                      <DuckAvatar
                                                          skinId={ach.rewardSkinId}
                                                          emotion="idle"
                                                          isStatic={true}
                                                          className={cn(
                                                              "w-full h-full transform scale-125 translate-y-[10%]",
                                                              !unlocked && "grayscale opacity-50"
                                                          )}
                                                      />
                                                      {!unlocked && (
                                                          <div className="absolute inset-0 flex items-center justify-center">
                                                              <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 drop-shadow-md" />
                                                          </div>
                                                      )}
                                                  </>
                                              ) : (
                                                  unlocked ? (
                                                      <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-black stroke-[2px]" />
                                                  ) : (
                                                      <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                                                  )
                                              )}
                                          </div>
                                          {/* Text Content */}
                                          <div className="flex-1 min-w-0">
                                              <h3 className={cn(
                                                  "text-sm sm:text-lg font-black uppercase leading-tight mb-0.5 sm:mb-1 truncate",
                                                  unlocked ? "text-black" : "text-gray-500"
                                              )}>
                                                  {ach.title}
                                              </h3>
                                              <p className="text-xs sm:text-sm font-bold text-gray-500 leading-tight break-words">
                                                  {ach.description}
                                              </p>
                                              {/* Progress Bar for Locked Items */}
                                              {!unlocked && progress && (
                                                  <div className="mt-2 w-full max-w-[200px]">
                                                      <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase mb-1 tracking-wider">
                                                          <span>Progress</span>
                                                          <span>{progress.label}</span>
                                                      </div>
                                                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                                                          <div
                                                              className={cn("h-full transition-all duration-500", activeTab === 'maps' ? "bg-purple-400" : "bg-blue-400")}
                                                              style={{ width: `${progress.percent}%` }}
                                                          />
                                                      </div>
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                      {/* Action Area */}
                                      <div className="w-full sm:w-auto flex justify-end sm:justify-center mt-2 sm:mt-0">
                                          {unlocked ? (
                                              hasReward && !claimed ? (
                                                  <Button
                                                      onClick={() => handleClaim(ach)}
                                                      className="h-10 bg-green-500 hover:bg-green-600 text-white font-black border-2 border-black shadow-sm active:translate-y-[1px] active:shadow-none flex items-center gap-2 w-full sm:w-auto"
                                                  >
                                                      <Coins className="w-4 h-4 fill-current" />
                                                      CLAIM {ach.rewardCoins}
                                                  </Button>
                                              ) : (
                                                  <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-lg border-2 border-green-200 font-bold text-xs uppercase">
                                                      <Check className="w-4 h-4" />
                                                      {hasReward ? 'Claimed' : 'Unlocked'}
                                                  </div>
                                              )
                                          ) : (
                                              hasReward && (
                                                  <div className="flex items-center gap-1 text-gray-400 font-bold text-xs bg-gray-200 px-2 py-1 rounded border border-gray-300">
                                                      <Coins className="w-3 h-3" />
                                                      <span>{ach.rewardCoins}</span>
                                                  </div>
                                              )
                                          )}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              );
          })}
        </div>
      </div>
      {/* Footer - Claim All Button */}
      {claimableAchievements.length > 1 && (
        <div className="p-4 bg-white border-t-4 border-black shrink-0 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20">
            <Button
                onClick={() => { soundSynth.playClick(); claimAllAchievements(); }}
                className="w-full h-14 text-xl font-arcade bg-green-500 hover:bg-green-400 text-white border-4 border-black rounded-xl shadow-hard active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3"
            >
                <CheckCheck className="w-6 h-6 stroke-[3px]" />
                CLAIM ALL
                <span className="bg-black/20 px-3 py-1 rounded-lg text-sm font-black">+{totalClaimableCoins}</span>
            </Button>
        </div>
      )}
    </motion.div>
  );
}