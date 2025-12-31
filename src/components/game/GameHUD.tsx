import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Pause, Volume2, VolumeX, Hand, CheckCircle2, Target } from 'lucide-react';
import { soundSynth } from '@/game/SoundSynth';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CHALLENGE_TIERS } from '@/game/constants';
import { haptics } from '@/game/Haptics';
// Extracted Timer Component to isolate re-renders
function GameTimer() {
    const score = useGameStore(state => state.score);
    const profile = useGameStore(state => state.profile);
    const biome = useGameStore(state => state.biome);
    const gameMode = useGameStore(state => state.gameMode);
    const mapStats = profile?.mapStats?.[biome];
    const bestTime = mapStats?.bestTime || 0;
    const isNewRecord = score > bestTime && bestTime > 0;
    const formatTime = (ms: number) => {
        const seconds = (ms / 1000).toFixed(2);
        return `${seconds}s`;
    };
    return (
        <div className={cn(
            "relative bg-black border-4 border-white rounded-2xl px-6 py-2 shadow-hard transform -skew-x-6 transition-colors duration-300",
            isNewRecord ? "border-yellow-400" : "border-white"
        )}>
            <span className={cn(
                "text-2xl sm:text-3xl font-arcade tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] transition-colors duration-300",
                isNewRecord ? "text-yellow-400 animate-pulse" : "text-yellow-400"
            )}>
                {formatTime(score)}
            </span>
            {/* PB Display */}
            {bestTime > 0 && gameMode !== 'challenge' && (
                <div className="absolute top-full left-0 right-0 mt-1 text-center">
                    <span className="text-[10px] font-black text-white/80 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                        BEST: {formatTime(bestTime)}
                    </span>
                </div>
            )}
        </div>
    );
}
// Extracted Challenge Target Component
function ChallengeTarget() {
    const score = useGameStore(state => state.score);
    const gameMode = useGameStore(state => state.gameMode);
    const [highestTierReached, setHighestTierReached] = useState<number>(-1);
    // Reset on new run
    useEffect(() => {
        if (score === 0) setHighestTierReached(-1);
    }, [score]);
    // Check tiers
    useEffect(() => {
        if (gameMode !== 'challenge') return;
        let currentTierIndex = -1;
        for (let i = 0; i < CHALLENGE_TIERS.length; i++) {
            if (score >= CHALLENGE_TIERS[i].time) {
                currentTierIndex = i;
            }
        }
        if (currentTierIndex > highestTierReached) {
            setHighestTierReached(currentTierIndex);
            soundSynth.playUnlock();
            haptics.success();
        }
    }, [score, gameMode, highestTierReached]);
    if (gameMode !== 'challenge') return null;
    // Find the next unachieved tier
    const nextTierIndex = CHALLENGE_TIERS.findIndex(t => score < t.time);
    const nextTier = nextTierIndex !== -1 ? CHALLENGE_TIERS[nextTierIndex] : null;
    // Determine display properties based on the next tier
    let label = "MAX TIER!";
    let colorClass = "text-green-400";
    let borderClass = "border-green-400";
    let bgClass = "bg-green-900/80";
    let icon = <CheckCircle2 className="w-4 h-4 text-green-400 animate-bounce" />;
    if (nextTier) {
        const tierName = nextTier.id === 'tier1' ? 'BRONZE' : nextTier.id === 'tier2' ? 'SILVER' : 'GOLD';
        label = `NEXT: ${tierName} ${(nextTier.time / 1000).toFixed(0)}s`;
        icon = <Target className="w-4 h-4 animate-pulse" />;
        if (nextTier.id === 'tier1') {
            colorClass = "text-orange-400";
            borderClass = "border-orange-400";
            bgClass = "bg-black/60";
        } else if (nextTier.id === 'tier2') {
            colorClass = "text-slate-300";
            borderClass = "border-slate-300";
            bgClass = "bg-black/60";
        } else {
            colorClass = "text-yellow-400";
            borderClass = "border-yellow-400";
            bgClass = "bg-black/60";
        }
    }
    return (
        <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none">
            <div className={cn(
                "backdrop-blur-md px-4 py-1 rounded-full border-2 transition-all duration-300 shadow-lg flex items-center gap-2",
                borderClass, bgClass
            )}>
                <span className={cn(colorClass)}>{icon}</span>
                <span className={cn(
                    "font-arcade text-sm tracking-widest drop-shadow-sm",
                    colorClass
                )}>
                    {label}
                </span>
            </div>
        </div>
    );
}
// Extracted Tutorial Hint Component
function TutorialHint() {
    const score = useGameStore(state => state.score);
    const status = useGameStore(state => state.status);
    return (
        <AnimatePresence>
            {status === 'playing' && score < 4000 && (
                <motion.div
                    key="tutorial-hint"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    style={{ opacity: 0 }} // Explicit initialization
                    className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none"
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                            {/* Hand Animation */}
                            <motion.div
                                animate={{
                                    x: [0, 30, 0, -30, 0],
                                    y: [0, -10, 0, -10, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Hand className="w-12 h-12 text-white drop-shadow-lg stroke-[3px]" />
                            </motion.div>
                            {/* Touch Ripple Effect */}
                            <motion.div
                                initial={{ scale: 1, opacity: 0.5 }}
                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/30 rounded-full -z-10"
                            />
                        </div>
                        <div className="bg-black/60 backdrop-blur-sm px-4 py-1 rounded-full border border-white/30 shadow-lg">
                            <span className="font-arcade text-xs text-white tracking-widest">
                                DRAG TO MOVE
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
export function GameHUD() {
  const status = useGameStore(state => state.status);
  const isAudioEnabled = useGameStore(state => state.isAudioEnabled);
  const togglePause = useGameStore(state => state.togglePause);
  const toggleAudio = useGameStore(state => state.toggleAudio);
  const opponentName = useGameStore(state => state.opponentName);
  const handleToggleAudio = () => {
      toggleAudio();
      if (!isAudioEnabled) {
          soundSynth.playClick();
      }
  };
  // Only show HUD in playing or paused states
  if (status !== 'playing' && status !== 'paused') return null;
  return (
    <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between pointer-events-none z-20">
        {/* Top HUD */}
        <div className="flex justify-between items-start w-full pointer-events-auto">
            {/* Audio Toggle */}
            <Button
            onClick={handleToggleAudio}
            variant="ghost"
            size="icon"
            className="w-12 h-12 bg-white border-2 border-black rounded-xl shadow-hard hover:translate-y-[2px] hover:shadow-none active:translate-y-[4px] transition-all"
            >
            {isAudioEnabled ? <Volume2 className="w-6 h-6 text-black" /> : <VolumeX className="w-6 h-6 text-red-500" />}
            </Button>
            {/* Timer - Isolated Component */}
            <GameTimer />
            {/* Pause Button */}
            <Button
            onClick={() => { soundSynth.playClick(); togglePause(); }}
            variant="ghost"
            size="icon"
            className="w-12 h-12 bg-yellow-400 border-2 border-black rounded-xl shadow-hard hover:translate-y-[2px] hover:shadow-none active:translate-y-[4px] transition-all"
            >
            <Pause className="w-6 h-6 text-black fill-current" />
            </Button>
        </div>
        {/* Challenge Target Display - Isolated Component */}
        <ChallengeTarget />
        {/* Opponent Name Badge */}
        {opponentName && (
            <div className="absolute top-28 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-red-500/80 backdrop-blur-md px-4 py-1 rounded-full border-2 border-red-400 shadow-sm animate-pulse">
                    <span className="font-arcade text-xs text-white tracking-widest uppercase">
                        VS {opponentName}
                    </span>
                </div>
            </div>
        )}
        {/* Footer hint - Isolated Component */}
        <TutorialHint />
    </div>
  );
}