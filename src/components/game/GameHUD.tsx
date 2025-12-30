import React from 'react';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Pause, Volume2, VolumeX, Hand } from 'lucide-react';
import { soundSynth } from '@/game/SoundSynth';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
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
    const challengeTarget = useGameStore(state => state.challengeTarget);
    const gameMode = useGameStore(state => state.gameMode);
    if (gameMode !== 'challenge' || challengeTarget === null) return null;
    return (
        <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none">
            <div className={cn(
                "bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border-2 transition-colors duration-300 shadow-lg",
                score > challengeTarget ? "border-green-400 bg-green-900/60" : "border-purple-400"
            )}>
                <span className={cn(
                    "font-arcade text-sm tracking-widest drop-shadow-sm",
                    score > challengeTarget ? "text-green-400" : "text-purple-300"
                )}>
                    TARGET: {(challengeTarget / 1000).toFixed(2)}s
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