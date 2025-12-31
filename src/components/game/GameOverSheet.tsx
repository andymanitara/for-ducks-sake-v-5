import React, { useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { RotateCcw, Share2, Home, Trophy, Loader2, Eye, Swords, Skull, BookOpen, Zap, Coins, Bomb, Lock, TrendingUp, Waves, Activity, CircleDot, Gift, CheckCircle2, Crown } from 'lucide-react';
import { soundSynth } from '@/game/SoundSynth';
import { haptics } from '@/game/Haptics';
import { toast } from 'sonner';
import { GameEngine } from '@/game/GameEngine';
import { DuckAvatar } from './DuckAvatar';
import { HAZARD_INFO, MAPS, CHALLENGE_TIERS, MAP_CHALLENGE_REWARDS } from '@/game/constants';
import { cn, formatLargeTime } from '@/lib/utils';
import { HazardPreview } from './HazardPreview';
interface GameOverSheetProps {
    onWatchReplay?: () => void;
    onOpenStrategy?: (hazardType: string) => void;
    onOpenChallenges?: () => void;
}
export function GameOverSheet({ onWatchReplay, onOpenStrategy, onOpenChallenges }: GameOverSheetProps) {
  const score = useGameStore(state => state.score);
  const profile = useGameStore(state => state.profile);
  const lastRunStats = useGameStore(state => state.lastRunStats);
  const resetGame = useGameStore(state => state.resetGame);
  const setStatus = useGameStore(state => state.setStatus);
  const startReplayGeneration = useGameStore(state => state.startReplayGeneration);
  const replayState = useGameStore(state => state.replayState);
  const replayVideo = useGameStore(state => state.replayVideo);
  const resetReplayState = useGameStore(state => state.resetReplayState);
  const replayViewMode = useGameStore(state => state.replayViewMode);
  const shareRequested = useGameStore(state => state.shareRequested);
  const setShareRequested = useGameStore(state => state.setShareRequested);
  const gameMode = useGameStore(state => state.gameMode);
  const biome = lastRunStats?.biome || 'pond';
  // Get map-specific best time
  const mapStats = profile?.mapStats?.[biome];
  const bestTime = mapStats?.bestTime || 0;
  // Use explicit flag from run stats if available, otherwise fallback to comparison
  const isNewRecord = lastRunStats?.isNewRecord ?? (gameMode === 'normal' && score > bestTime && bestTime > 0);
  const coinsEarned = lastRunStats?.coinsEarned || 0;
  const explosionsTriggered = lastRunStats?.explosionsTriggered || 0;
  const showerPushes = lastRunStats?.showerPushes || 0;
  const wrenchDodges = lastRunStats?.wrenchDodges || 0;
  const ballsPocketed = lastRunStats?.ballsPocketed || 0;
  const challengeBonus = lastRunStats?.challengeBonus || 0;
  // Progression Stats
  const multiplier = lastRunStats?.multiplier || 1;
  const adjustedTime = lastRunStats?.adjustedSurvivalTime || 0;
  const formatTime = (ms: number) => (ms / 1000).toFixed(2) + 's';
  const isVideoSupported = useMemo(() => GameEngine.isVideoSupported(), []);
  // Mode Logic
  const isChallenge = gameMode === 'challenge';
  const isDaily = gameMode === 'daily';
  // Conditional Retry Logic
  const showRetry = true; // Always allow retry
  // Show Rank Button Logic
  const isChallengeOrDaily = isChallenge || isDaily;
  const showRankButton = isChallengeOrDaily && !!onOpenChallenges;
  // Challenge Rewards Calculation (Visual Only)
  const challengeRewards = useMemo(() => {
      if (!isChallenge) return [];
      const rewards = [];
      // Tier 1
      if (score >= CHALLENGE_TIERS[0].time) {
          rewards.push({ label: "Tier 1", icon: Coins, color: "text-yellow-600", bg: "bg-yellow-100" });
      }
      // Tier 2
      if (score >= CHALLENGE_TIERS[1].time) {
          rewards.push({ label: "Tier 2", icon: Coins, color: "text-yellow-600", bg: "bg-yellow-100" });
      }
      // Tier 3
      if (score >= CHALLENGE_TIERS[2].time) {
          rewards.push({ label: "Tier 3", icon: Crown, color: "text-purple-600", bg: "bg-purple-100" });
      }
      return rewards;
  }, [isChallenge, score]);
  // Progression Logic (Next Map Unlock)
  const nextUnlockInfo = useMemo(() => {
      if (!profile || gameMode !== 'normal') return null;
      const standardMaps = MAPS.filter(m => !m.isSeasonal);
      const unlockedIds = new Set(profile.unlockedMapIds);
      // Find the first locked map in the sequence
      const nextLockedMap = standardMaps.find(m => !unlockedIds.has(m.id));
      if (!nextLockedMap) return null; // All maps unlocked
      const currentTotal = profile.totalAccumulatedSurvivalTime || 0;
      const targetTotal = nextLockedMap.totalSurvivalTimeRequired;
      if (targetTotal <= 0) return null; // Should be unlocked or special condition
      const progress = Math.min(100, (currentTotal / targetTotal) * 100);
      const remaining = Math.max(0, targetTotal - currentTotal);
      return {
          mapName: nextLockedMap.name,
          progress,
          remaining,
          targetTotal
      };
  }, [profile, gameMode]);
  const shareVideo = useCallback(async (blob: Blob) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let extension = 'webm';
      if (blob.type.includes('mp4')) {
          extension = 'mp4';
      }
      const fileName = `for-ducks-sake-replay-${timestamp}.${extension}`;
      const file = new File([blob], fileName, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
              await navigator.share({
                  files: [file],
                  title: 'For Ducks Sake Replay',
                  text: `I survived ${formatTime(score)}! #ForDucksSake`
              });
              toast.success("Replay shared!");
          } catch (err) {
              console.error("Share failed", err);
          }
      } else {
          // Fallback to download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Replay downloaded!");
      }
  }, [score]);
  // One-Tap Share Logic: Watch for ready state if share was requested
  useEffect(() => {
      if (shareRequested && replayState === 'ready' && replayVideo) {
          // Small delay to ensure UI is ready and prevent race conditions
          const timer = setTimeout(() => {
              shareVideo(replayVideo).finally(() => {
                  setShareRequested(false);
              });
          }, 100);
          return () => clearTimeout(timer);
      }
  }, [shareRequested, replayState, replayVideo, shareVideo, setShareRequested]);
  const handleRetry = () => {
    soundSynth.playClick();
    resetReplayState();
    resetGame();
  };
  const handleMenu = () => {
    soundSynth.playClick();
    resetReplayState();
    setStatus('menu');
  };
  const handleShare = async () => {
    soundSynth.playClick();
    // If video is already ready, share it immediately
    if (replayState === 'ready' && replayVideo) {
        await shareVideo(replayVideo);
        return;
    }
    // If generating or idle, request share when ready
    setShareRequested(true);
    // If idle (failed or reset), try generating again
    if (replayState === 'idle') {
        startReplayGeneration();
    }
  };
  const handleDuckClick = () => {
      soundSynth.playQuack();
      haptics.soft();
  };
  const killerType = lastRunStats?.killerHazardType;
  const killerInfo = killerType ? HAZARD_INFO[killerType] : null;
  // Only render if in default mode (sheet visible)
  if (replayViewMode !== 'default') return null;
  // Header Text Logic
  let headerText = "SURVIVED";
  let headerColor = "text-gray-600";
  let scoreColor = "text-black";
  if (isDaily) {
      headerText = "DAILY RUN";
      headerColor = "text-blue-600 font-black";
      scoreColor = "text-blue-600";
  } else if (isChallenge) {
      headerText = "CHALLENGE RUN";
      headerColor = "text-purple-600 font-black";
      scoreColor = "text-purple-600";
  } else if (isNewRecord) {
      headerText = "NEW RECORD!";
      headerColor = "text-orange-500 font-black";
      scoreColor = "text-orange-500 drop-shadow-sm";
  }
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      style={{ opacity: 0 }} // Explicit initialization to fix runtime warning
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute bottom-0 left-0 right-0 z-50 pointer-events-auto"
    >
      {/* Compact Sheet Container */}
      <div className={cn(
          "rounded-t-3xl border-t-2 border-x-2 border-black/80 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] p-4 flex flex-col gap-2 relative overflow-hidden max-h-[85vh]",
          // Safe area padding to prevent cutoff on mobile devices
          "pb-[calc(3.5rem+env(safe-area-inset-bottom))]",
          isChallenge ? "bg-purple-50" : (isDaily ? "bg-blue-50" : "bg-white")
      )}>
        {/* Decorative Top Handle */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-black/10 rounded-full" />
        {/* Header Row: Avatar | Time | Best */}
        <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
                {/* Small Duck Avatar */}
                <motion.div
                    whileTap={{ scale: 0.9, rotate: 5 }}
                    onClick={handleDuckClick}
                    className="cursor-pointer"
                >
                    <DuckAvatar
                        skinId={profile?.equippedSkinId || 'default'}
                        emotion={isNewRecord ? 'excited' : 'dizzy'}
                        className="w-10 h-10 drop-shadow-sm"
                    />
                </motion.div>
                {/* Time Display */}
                <div className="flex flex-col">
                    <span className={cn(
                        "font-arcade text-[8px] uppercase tracking-widest leading-none mb-0.5",
                        headerColor
                    )}>
                        {headerText}
                    </span>
                    <span className={cn(
                        "text-2xl font-arcade tracking-tighter leading-none",
                        scoreColor
                    )}>
                        {formatTime(score)}
                    </span>
                </div>
            </div>
            {/* Best Time / Target Badge */}
            <div className="flex flex-col items-end gap-1">
                {isChallenge ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md border shadow-sm bg-purple-200 border-purple-400 text-purple-800">
                        <Swords className="w-3 h-3 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-wide">
                            CHALLENGE
                        </span>
                    </div>
                ) : isDaily ? (
                    // Hide PB for Daily Mode
                    null
                ) : (
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-md border shadow-sm transition-colors",
                        isNewRecord
                            ? "bg-orange-400 border-black text-white animate-pulse"
                            : "bg-yellow-300/80 border-black/20 text-yellow-900"
                    )}>
                        {isNewRecord ? (
                            <Trophy className="w-3 h-3 fill-current" />
                        ) : (
                            <Trophy className="w-3 h-3 text-yellow-800" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-wide">
                            {isNewRecord ? "PB!" : "BEST"}
                        </span>
                    </div>
                )}
                {/* Challenge Bonus Badge */}
                {challengeBonus > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-purple-400 bg-purple-100 text-purple-800 shadow-sm animate-pulse-subtle">
                        <Gift className="w-3 h-3 fill-purple-500 text-purple-600" />
                        <span className="text-[10px] font-black uppercase tracking-wide">
                            BONUS +{challengeBonus}
                        </span>
                    </div>
                )}
                {/* Coins Earned Badge */}
                {coinsEarned > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-yellow-400 bg-yellow-100 text-yellow-800 shadow-sm">
                        <Coins className="w-3 h-3 fill-yellow-500 text-yellow-600" />
                        <span className="text-[10px] font-black uppercase tracking-wide">
                            +{coinsEarned}
                        </span>
                    </div>
                )}
            </div>
        </div>
        {/* Challenge Tiers Progress */}
        {isChallenge && (
            <div className="flex gap-2 mt-2">
                {CHALLENGE_TIERS.map((tier, idx) => {
                    const isMet = score >= tier.time;
                    return (
                        <div key={tier.id} className={cn(
                            "flex-1 h-2 rounded-full border border-black/10 overflow-hidden",
                            isMet ? "bg-green-500" : "bg-gray-200"
                        )} />
                    );
                })}
            </div>
        )}
        {/* Progression Bar (Next Unlock) */}
        {nextUnlockInfo && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-2 mt-1 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] font-black uppercase text-blue-700 tracking-wide">
                            Next: {nextUnlockInfo.mapName}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-500">
                        {Math.round(nextUnlockInfo.progress)}%
                    </span>
                </div>
                <div className="h-2 w-full bg-blue-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${nextUnlockInfo.progress}%` }}
                    />
                </div>
                <div className="text-right mt-1">
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">
                        {formatLargeTime(nextUnlockInfo.remaining)} more to unlock
                    </span>
                </div>
                {/* Progression Breakdown */}
                {adjustedTime > 0 && (
                     <div className="mt-2 pt-2 border-t border-blue-200/50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="bg-green-100 p-1 rounded-md border border-green-200">
                                <TrendingUp className="w-3 h-3 text-green-600" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-[8px] font-bold text-green-600 uppercase">Earned</span>
                                <span className="text-[10px] font-black text-green-700 uppercase tracking-wide">
                                    +{formatLargeTime(adjustedTime)}
                                </span>
                            </div>
                        </div>
                        {multiplier > 1.0 && (
                            <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg border border-yellow-300 shadow-sm animate-pulse-subtle">
                                <Zap className="w-3 h-3 text-yellow-600 fill-current" />
                                <span className="text-[9px] font-black text-yellow-800">
                                    {multiplier}x BONUS
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
        {/* Run Report / Killer Info */}
        {killerInfo && killerType && (
            <div className="bg-red-50 border-2 border-red-100 rounded-xl p-2 mt-1">
                <div className="flex gap-3">
                    {/* Left: Image */}
                    <div className="w-16 h-16 bg-white rounded-lg border-2 border-red-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                         <HazardPreview type={killerType} className="w-full h-full" />
                    </div>
                    {/* Right: Info & Stats */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                         {/* Header: Killed By + Strategy */}
                         <div className="flex justify-between items-start">
                             <div>
                                 <div className="flex items-center gap-1 text-red-500 mb-0.5">
                                     <Skull className="w-3 h-3" />
                                     <span className="text-[10px] font-black uppercase tracking-widest">KILLED BY</span>
                                 </div>
                                 <div className="font-black text-sm text-red-900 uppercase leading-none truncate max-w-[120px]">
                                     {killerInfo.name}
                                 </div>
                             </div>
                             {onOpenStrategy && (
                                 <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onOpenStrategy(killerType)}
                                    className="h-6 px-2 text-[10px] border-red-200 text-red-600 hover:bg-red-100 bg-white font-bold"
                                 >
                                     <BookOpen className="w-3 h-3 mr-1" /> TIPS
                                 </Button>
                             )}
                         </div>
                         {/* Mini Stats Row */}
                         <div className="flex gap-2 mt-1.5 flex-wrap">
                             <div className="flex items-center gap-1.5 bg-white/60 px-2 py-0.5 rounded border border-red-100">
                                 <Zap className="w-3 h-3 text-yellow-400 fill-current" />
                                 <span className="text-[8px] font-black uppercase text-yellow-900/60 tracking-wider mr-1">CLOSE CALLS</span>
                                 <span className="font-arcade text-xs text-black">{lastRunStats?.nearMisses || 0}</span>
                             </div>
                             {explosionsTriggered > 0 && (
                                 <div className="flex items-center gap-1.5 bg-white/60 px-2 py-0.5 rounded border border-red-100">
                                     <Bomb className="w-3 h-3 text-orange-500 fill-current" />
                                     <span className="text-[8px] font-black uppercase text-orange-900/60 tracking-wider mr-1">BOOMS</span>
                                     <span className="font-arcade text-xs text-black">{explosionsTriggered}</span>
                                 </div>
                             )}
                             {biome === 'bathtub' && showerPushes > 0 && (
                                 <div className="flex items-center gap-1.5 bg-white/60 px-2 py-0.5 rounded border border-blue-100">
                                     <Waves className="w-3 h-3 text-blue-500" />
                                     <span className="text-[8px] font-black uppercase text-blue-900/60 tracking-wider mr-1">SLIPS</span>
                                     <span className="font-arcade text-xs text-black">{showerPushes}</span>
                                 </div>
                             )}
                             {biome === 'gym' && wrenchDodges > 0 && (
                                 <div className="flex items-center gap-1.5 bg-white/60 px-2 py-0.5 rounded border border-gray-200">
                                     <Activity className="w-3 h-3 text-gray-500" />
                                     <span className="text-[8px] font-black uppercase text-gray-900/60 tracking-wider mr-1">DODGES</span>
                                     <span className="font-arcade text-xs text-black">{wrenchDodges}</span>
                                 </div>
                             )}
                             {biome === 'billiards' && ballsPocketed > 0 && (
                                 <div className="flex items-center gap-1.5 bg-white/60 px-2 py-0.5 rounded border border-green-100">
                                     <CircleDot className="w-3 h-3 text-green-600" />
                                     <span className="text-[8px] font-black uppercase text-green-900/60 tracking-wider mr-1">POCKETS</span>
                                     <span className="font-arcade text-xs text-black">{ballsPocketed}</span>
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
            </div>
        )}
        {/* Action Buttons Grid - Compact Icon Only */}
        <div className={cn("grid gap-2 mt-1", showRetry ? (showRankButton ? "grid-cols-5" : "grid-cols-4") : "grid-cols-3")}>
            <Button
                onClick={handleMenu}
                className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-black border-2 border-black/10 shadow-sm active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center"
                title="Menu"
            >
                <Home className="w-5 h-5 text-gray-600" />
            </Button>
            {onWatchReplay && (
                <Button
                    onClick={() => { soundSynth.playClick(); onWatchReplay(); }}
                    className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-black border-2 border-black/10 shadow-sm active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center"
                    title="Watch Replay"
                >
                    <Eye className="w-5 h-5 text-gray-600" />
                </Button>
            )}
            {isVideoSupported ? (
                <Button
                    onClick={handleShare}
                    disabled={shareRequested}
                    className="h-12 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200 shadow-sm active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center disabled:opacity-100 disabled:cursor-wait"
                    title="Share Replay"
                >
                    {shareRequested || replayState === 'generating' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Share2 className="w-5 h-5" />
                    )}
                </Button>
            ) : (
                <div className="h-12 rounded-xl bg-gray-50 border-2 border-gray-100 flex items-center justify-center opacity-50">
                    <Share2 className="w-5 h-5 text-gray-300" />
                </div>
            )}
            {showRankButton && (
                <Button
                    onClick={() => { soundSynth.playClick(); onOpenChallenges?.(); }}
                    className="h-12 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 border-2 border-purple-300 shadow-sm active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center"
                    title="View Rank"
                >
                    <Trophy className="w-5 h-5" />
                </Button>
            )}
            {showRetry && (
                <Button
                    onClick={handleRetry}
                    className="h-12 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black rounded-xl shadow-[0_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center"
                    title="Retry"
                >
                    <RotateCcw className="w-6 h-6 stroke-[3px]" />
                </Button>
            )}
        </div>
      </div>
    </motion.div>
  );
}