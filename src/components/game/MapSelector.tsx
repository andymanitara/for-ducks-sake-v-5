import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { MAPS, ACHIEVEMENTS } from '@/game/constants';
import { Button } from '@/components/ui/button';
import { X, Check, Map as MapIcon, Lock, Snowflake, Clock, Dice5, Trophy, Crown, Zap } from 'lucide-react';
import { cn, getUnlockedAchievements, formatLargeTime } from '@/lib/utils';
import { soundSynth } from '@/game/SoundSynth';
import { toast } from 'sonner';
import { MapPreview } from './MapPreview';
interface MapSelectorProps {
  onClose: () => void;
}
export function MapSelector({ onClose }: MapSelectorProps) {
  const setBiome = useGameStore(state => state.setBiome);
  const setStatus = useGameStore(state => state.setStatus);
  const setGameMode = useGameStore(state => state.setGameMode);
  const profile = useGameStore(state => state.profile);
  const unlockedMapIds = profile?.unlockedMapIds || ['pond'];
  const mapStats = profile?.mapStats || {};
  const totalAccumulatedTime = profile?.totalAccumulatedSurvivalTime || 0;
  // Calculate unlocked achievements for mastery check
  const unlockedAchievements = useMemo(() => profile ? getUnlockedAchievements(profile) : [], [profile]);
  const unlockedAchIds = useMemo(() => new Set(unlockedAchievements.map(a => a.id)), [unlockedAchievements]);
  const handleSelect = (mapId: any, isUnlocked: boolean) => {
      if (!isUnlocked) {
          soundSynth.playDie(); // Error sound
          toast.error("Map Locked! Accumulate more survival time to unlock.");
          return;
      }
      soundSynth.playStart();
      setBiome(mapId);
      setGameMode('normal');
      setStatus('playing');
      onClose();
  };
  const handleRandom = () => {
      const availableMaps = MAPS.filter(m => unlockedMapIds.includes(m.id));
      if (availableMaps.length > 0) {
          const randomMap = availableMaps[Math.floor(Math.random() * availableMaps.length)];
          handleSelect(randomMap.id, true);
      }
  };
  const seasonalMaps = MAPS.filter(m => m.isSeasonal);
  const standardMaps = MAPS.filter(m => !m.isSeasonal);
  const formatTime = (ms: number) => (ms / 1000).toFixed(2) + 's';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ opacity: 0 }} // Explicit initialization
      className="absolute inset-0 bg-white z-50 flex flex-col pointer-events-auto"
    >
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b-4 border-black bg-purple-500">
        <div className="flex items-center gap-3">
            <MapIcon className="w-8 h-8 text-white drop-shadow-md stroke-[3px]" />
            <h2 className="text-2xl font-arcade text-white text-stroke-thick tracking-widest drop-shadow-md">
                WORLD MAP
            </h2>
        </div>
        <div className="flex gap-2">
            <Button
                onClick={handleRandom}
                variant="ghost"
                size="icon"
                className="h-12 w-12 border-4 border-black rounded-full bg-white hover:bg-purple-100 shadow-hard active:translate-y-[2px] active:shadow-none transition-all"
                title="Random Map"
            >
                <Dice5 className="w-6 h-6 stroke-[3px]" />
            </Button>
            <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-12 w-12 border-4 border-black rounded-full bg-white hover:bg-red-100 shadow-hard active:translate-y-[2px] active:shadow-none transition-all"
            >
            <X className="w-6 h-6 stroke-[3px]" />
            </Button>
        </div>
      </div>
      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-8 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {/* Seasonal Section */}
        {seasonalMaps.length > 0 && (
            <div className="space-y-4 bg-blue-50 p-4 rounded-3xl border-4 border-blue-200">
                <div className="flex items-center gap-2 px-2">
                    <Snowflake className="w-6 h-6 text-blue-500 animate-pulse" />
                    <h3 className="text-xl font-black text-blue-600 uppercase tracking-widest">Seasonal Events</h3>
                </div>
                <div className="grid grid-cols-1 gap-6">
                    {seasonalMaps.map((map) => {
                        const stats = mapStats[map.id];
                        const bestTime = stats?.bestTime || 0;
                        // Mastery Check
                        const mapAchievements = ACHIEVEMENTS.filter(a => a.mapId === map.id);
                        const isMastered = mapAchievements.length > 0 && mapAchievements.every(a => unlockedAchIds.has(a.id));
                        return (
                            <div
                                key={map.id}
                                onClick={() => handleSelect(map.id, true)}
                                className={cn(
                                "relative rounded-3xl border-4 transition-all cursor-pointer overflow-hidden group",
                                "border-blue-300 hover:border-blue-400 bg-white"
                                )}
                            >
                                {/* Map Preview Banner */}
                                <div className="h-28 w-full relative overflow-hidden bg-gray-200">
                                    <MapPreview biome={map.id} className="absolute inset-0 w-full h-full object-cover" />
                                    {/* Seasonal Badge */}
                                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full border-2 border-black shadow-sm flex items-center gap-1 z-10">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-xs font-black uppercase">Limited Time</span>
                                    </div>
                                    {/* Multiplier Badge - Increased Z-Index to 30 */}
                                    <div className="absolute bottom-4 right-4 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-md border-2 border-black shadow-sm flex items-center gap-1 z-30">
                                        <Zap className="w-3 h-3 fill-current" />
                                        <span className="text-[10px] font-black uppercase">{map.progressMultiplier}x Time</span>
                                    </div>
                                    {/* Mastery Badge (Bottom Left for Seasonal) */}
                                    {isMastered && (
                                        <div className="absolute bottom-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full border-2 border-black shadow-sm flex items-center gap-1 z-20">
                                            <Crown className="w-3 h-3 fill-current" />
                                            <span className="text-[10px] font-black uppercase tracking-wide">MASTERED</span>
                                        </div>
                                    )}
                                </div>
                                {/* Content */}
                                <div className="p-4 bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-2xl font-black text-black uppercase">{map.name}</h3>
                                        <span className="text-xs font-bold px-2 py-1 rounded-md border-2 border-blue-200 bg-blue-100 text-blue-800 uppercase">
                                            {map.seasonalDeadline}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 font-bold text-sm leading-tight mb-3">
                                        {map.description}
                                    </p>
                                    {/* Best Time Badge */}
                                    {bestTime > 0 && (
                                        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg w-fit">
                                            <Trophy className="w-3 h-3 text-yellow-600 fill-yellow-600" />
                                            <span className="text-xs font-black text-yellow-800 tracking-wide">
                                                BEST: {formatTime(bestTime)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
        {/* Standard Maps */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <MapIcon className="w-5 h-5 text-gray-500" />
                <h3 className="text-xl font-black text-gray-600 uppercase tracking-widest">Standard Maps</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
            {standardMaps.map((map, index) => {
                const isUnlocked = unlockedMapIds.includes(map.id);
                const stats = mapStats[map.id];
                const bestTime = stats?.bestTime || 0;
                // Mastery Check
                const mapAchievements = ACHIEVEMENTS.filter(a => a.mapId === map.id);
                const isMastered = mapAchievements.length > 0 && mapAchievements.every(a => unlockedAchIds.has(a.id));
                // Mastery Progress
                const totalMapAchievements = mapAchievements.length;
                const unlockedMapAchievements = mapAchievements.filter(a => unlockedAchIds.has(a.id)).length;
                const masteryPercent = totalMapAchievements > 0 ? (unlockedMapAchievements / totalMapAchievements) * 100 : 0;
                // Determine unlock progress based on cumulative time
                let progress = 0;
                const reqTimeShort = formatLargeTime(map.totalSurvivalTimeRequired);
                let remainingTime = 0;
                if (!isUnlocked) {
                    const threshold = map.totalSurvivalTimeRequired;
                    progress = Math.min(100, (totalAccumulatedTime / threshold) * 100);
                    remainingTime = Math.max(0, threshold - totalAccumulatedTime);
                }
                // Previous map for skill unlock display
                const previousMap = index > 0 ? standardMaps[index - 1] : null;
                return (
                <div
                    key={map.id}
                    onClick={() => handleSelect(map.id, isUnlocked)}
                    className={cn(
                    "relative rounded-3xl border-4 transition-all cursor-pointer overflow-hidden group",
                    isUnlocked
                        ? "border-gray-300 hover:border-gray-400 bg-white"
                        : "border-gray-200 bg-gray-100 opacity-90"
                    )}
                >
                    {/* Map Preview Banner */}
                    <div className="h-24 w-full relative overflow-hidden bg-gray-200">
                        <MapPreview biome={map.id} className="absolute inset-0 w-full h-full object-cover" />
                        {/* Multiplier Badge - Increased Z-Index to 30 to show above lock overlay */}
                        <div className="absolute bottom-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-md border-2 border-black shadow-sm flex items-center gap-1 z-30">
                            <Zap className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-black uppercase">{map.progressMultiplier}x Time</span>
                        </div>
                        {/* Mastery Badge (Top Left for Standard) */}
                        {isMastered && isUnlocked && (
                            <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full border-2 border-black shadow-sm flex items-center gap-1 z-20">
                                <Crown className="w-3 h-3 fill-current" />
                                <span className="text-[10px] font-black uppercase tracking-wide">MASTERED</span>
                            </div>
                        )}
                        {!isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20">
                                <Lock className="w-10 h-10 text-white drop-shadow-md" />
                            </div>
                        )}
                    </div>
                    {/* Content */}
                    <div className="p-4 bg-white">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className={cn("text-2xl font-black uppercase", !isUnlocked && "text-gray-500")}>{map.name}</h3>
                            <span className={cn(
                                "text-xs font-bold px-2 py-1 rounded-md border-2 uppercase",
                                !isUnlocked ? "bg-gray-200 text-gray-500 border-gray-300" :
                                map.difficulty === 'Easy' ? "bg-green-200 text-green-800 border-green-300" :
                                map.difficulty === 'Medium' ? "bg-yellow-200 text-yellow-800 border-yellow-300" :
                                map.difficulty === 'Hard' ? "bg-orange-200 text-orange-800 border-orange-300" :
                                "bg-red-200 text-red-800 border-red-300"
                            )}>
                                {map.difficulty}
                            </span>
                        </div>
                        {isUnlocked ? (
                            <div className="space-y-3">
                                <p className="text-gray-500 font-bold text-sm leading-tight">
                                    {map.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    {/* Best Time Badge */}
                                    {bestTime > 0 ? (
                                        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg w-fit">
                                            <Trophy className="w-3 h-3 text-yellow-600 fill-yellow-600" />
                                            <span className="text-xs font-black text-yellow-800 tracking-wide">
                                                BEST: {formatTime(bestTime)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg w-fit opacity-60">
                                            <Clock className="w-3 h-3 text-gray-400" />
                                            <span className="text-xs font-bold text-gray-400 tracking-wide">
                                                NOT PLAYED YET
                                            </span>
                                        </div>
                                    )}
                                    {/* Unlock Requirement Display for Unlocked Maps */}
                                    {map.totalSurvivalTimeRequired > 0 && (
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                            Unlock Req: {reqTimeShort}
                                        </span>
                                    )}
                                </div>
                                {/* Mastery Progress Bar */}
                                {totalMapAchievements > 0 && (
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                                                MASTERY: {unlockedMapAchievements}/{totalMapAchievements}
                                            </span>
                                            {isMastered && (
                                                <span className="text-[9px] font-black uppercase text-yellow-600 tracking-wider flex items-center gap-1">
                                                    <Crown className="w-3 h-3 fill-current" /> COMPLETE
                                                </span>
                                            )}
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-500",
                                                    isMastered ? "bg-yellow-400" : "bg-blue-400"
                                                )}
                                                style={{ width: `${masteryPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 shadow-sm mt-2">
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <Lock className="w-3 h-3 text-blue-500" />
                                        <span className="text-[10px] font-black uppercase text-blue-700 tracking-wide">
                                            UNLOCK PROGRESS
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-500">
                                        {Math.round(progress)}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-blue-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-1.5">
                                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">
                                        GOAL: {reqTimeShort}
                                    </span>
                                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">
                                        {formatLargeTime(remainingTime)} LEFT
                                    </span>
                                </div>
                                {/* Secondary Skill Unlock Condition */}
                                {map.bestTimeRequired && previousMap && (
                                    <div className="mt-2 pt-2 border-t border-blue-200/50">
                                        <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1">
                                            <Zap className="w-3 h-3 fill-current" />
                                            OR: Survive {map.bestTimeRequired / 1000}s in {previousMap.name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                );
            })}
            </div>
        </div>
      </div>
    </motion.div>
  );
}