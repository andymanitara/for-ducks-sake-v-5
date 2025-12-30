import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { X, Clock, Trophy, Play, Lock, Calendar, Coins, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { soundSynth } from '@/game/SoundSynth';
import { cn, getTimeUntilNextDailyReset, getDailyMap } from '@/lib/utils';
import { DuckAvatar } from './DuckAvatar';
import { api } from '@/lib/api';
import { LeaderboardEntry } from '@/types/game';
import { MapPreview } from './MapPreview';
import { LoadingDuck } from '@/components/ui/loading-duck';
interface DailyChallengeModalProps {
  onClose: () => void;
}
export function DailyChallengeModal({ onClose }: DailyChallengeModalProps) {
  const profile = useGameStore(state => state.profile);
  const startDailyChallenge = useGameStore(state => state.startDailyChallenge);
  const checkDailyReset = useGameStore(state => state.checkDailyReset);
  const userRank = useGameStore(state => state.userRank);
  const [timeRemaining, setTimeRemaining] = useState(getTimeUntilNextDailyReset());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false); // New state for info view
  const today = new Date().toISOString().split('T')[0];
  // Determine daily map deterministically
  const dailyMap = getDailyMap(today);
  useEffect(() => {
    checkDailyReset();
    const timer = setInterval(() => {
      setTimeRemaining(getTimeUntilNextDailyReset());
    }, 60000);
    // Fetch daily leaderboard for the daily map
    const fetchDaily = async () => {
        setIsLoading(true);
        try {
            const res = await api.getLeaderboard(dailyMap.id, 'daily_challenge');
            if (res.success) {
                setLeaderboard(res.data);
            }
        } catch (e) {
            console.error("Failed to fetch daily leaderboard", e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchDaily();
    return () => clearInterval(timer);
  }, [checkDailyReset, dailyMap.id]);
  // Memoized display leaderboard with local injection
  const displayLeaderboard = useMemo(() => {
      let data = [...leaderboard];
      // Check if we have a relevant user rank update for the daily challenge
      if (userRank && userRank.mapId === dailyMap.id && userRank.category === 'daily_challenge') {
          const userEntryIndex = data.findIndex(e => e.userId === userRank.userId);
          if (userEntryIndex !== -1) {
              // Update existing entry if local score is better (or just update it as it's latest)
              if (userRank.score > data[userEntryIndex].score) {
                  data[userEntryIndex] = {
                      ...data[userEntryIndex],
                      score: userRank.score,
                      rank: userRank.rank // Rank might be approximate until refresh, but better than stale
                  };
              }
          } else {
              // Insert new entry
              data.push({
                  rank: userRank.rank,
                  name: profile?.displayName || 'You',
                  score: userRank.score,
                  skinId: profile?.equippedSkinId || 'default',
                  userId: userRank.userId,
                  date: Date.now()
              });
          }
      }
      // Sort by score descending
      data.sort((a, b) => b.score - a.score);
      // Re-assign ranks based on sorted order
      return data.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [leaderboard, userRank, dailyMap.id, profile]);
  const attempts = profile?.dailyAttempts || 0;
  const attemptsLeft = 3 - attempts;
  const handlePlay = () => {
      if (attemptsLeft > 0) {
          soundSynth.playClick();
          startDailyChallenge();
          onClose();
      } else {
          soundSynth.playDie();
      }
  };
  const toggleInfo = () => {
      soundSynth.playClick();
      setShowInfo(!showInfo);
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ opacity: 0 }}
      className="absolute inset-0 bg-white z-50 flex flex-col pointer-events-auto"
    >
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b-4 border-black bg-orange-500 shrink-0">
        <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-white drop-shadow-md stroke-[3px]" />
            <h2 className="text-2xl font-arcade text-white text-stroke-thick tracking-widest drop-shadow-md">
                DAILY CHALLENGE
            </h2>
        </div>
        <div className="flex gap-2">
            <Button
                onClick={toggleInfo}
                variant="ghost"
                size="icon"
                className={cn(
                    "h-12 w-12 border-4 border-black rounded-full shadow-hard active:translate-y-[2px] active:shadow-none transition-all",
                    showInfo ? "bg-yellow-400 hover:bg-yellow-300" : "bg-white hover:bg-orange-100"
                )}
            >
                <Info className="w-6 h-6 stroke-[3px]" />
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
      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-gray-50 flex flex-col">
        <AnimatePresence mode="wait">
            {showInfo ? (
                <InfoView key="info" onClose={() => setShowInfo(false)} />
            ) : (
                <MainView
                    key="main"
                    dailyMap={dailyMap}
                    timeRemaining={timeRemaining}
                    attempts={attempts}
                    attemptsLeft={attemptsLeft}
                    leaderboard={displayLeaderboard} // Use processed leaderboard
                    isLoading={isLoading}
                    profileId={profile?.playerId}
                    today={today}
                />
            )}
        </AnimatePresence>
      </div>
      {/* Footer Action - Only show on Main View or if we want it persistent */}
      {!showInfo && (
          <div className="p-6 pt-4 bg-white border-t-2 border-gray-100 shrink-0 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
              <Button
                  onClick={handlePlay}
                  disabled={attemptsLeft <= 0}
                  className={cn(
                      "w-full h-20 font-arcade border-4 border-black rounded-2xl shadow-hard-xl active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3 group relative overflow-hidden",
                      attemptsLeft > 0
                        ? "text-3xl bg-green-500 hover:bg-green-400 text-white"
                        : "text-xl bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
              >
                  {attemptsLeft > 0 ? (
                      <>
                          <Play className="w-8 h-8 fill-current" />
                          <span>PLAY ({attemptsLeft})</span>
                      </>
                  ) : (
                      <>
                          <Lock className="w-6 h-6" />
                          <span>DONE FOR TODAY</span>
                      </>
                  )}
              </Button>
              {attemptsLeft <= 0 && (
                  <p className="text-center text-xs font-bold text-gray-400 mt-3 uppercase">
                      Come back in {timeRemaining} for a new challenge!
                  </p>
              )}
          </div>
      )}
    </motion.div>
  );
}
// Sub-components to keep the main file clean
function MainView({ dailyMap, timeRemaining, attempts, attemptsLeft, leaderboard, isLoading, profileId, today }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col p-6 gap-6 overflow-hidden"
        >
            {/* Status Card with Map Preview */}
            <div className="bg-white border-4 border-black rounded-2xl shadow-hard relative overflow-hidden shrink-0">
                {/* Map Banner */}
                <div className="h-28 w-full relative bg-gray-200">
                    <MapPreview biome={dailyMap.id} className="absolute inset-0 w-full h-full object-cover" />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    {/* Timer Badge */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1 flex items-center gap-2 text-white shadow-sm z-10">
                        <Clock className="w-3 h-3 text-yellow-400" />
                        <span className="font-arcade text-xs tracking-widest">{timeRemaining}</span>
                    </div>
                    {/* Map Info Overlay */}
                    <div className="absolute bottom-3 left-4 right-4 z-10">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black uppercase text-yellow-400 tracking-widest mb-0.5 drop-shadow-md">
                                    Today's Challenge
                                </p>
                                <h3 className="text-2xl font-black uppercase text-white leading-none drop-shadow-lg">
                                    {dailyMap.name}
                                </h3>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-white/90 tracking-widest bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
                                SEED: {today}
                            </span>
                        </div>
                    </div>
                </div>
                {/* Attempts Section */}
                <div className="p-3 bg-white border-t-2 border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Attempts</span>
                        <span className={cn(
                            "text-xs font-black uppercase",
                            attemptsLeft > 0 ? "text-green-600" : "text-red-500"
                        )}>
                            {attemptsLeft} Remaining
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-3 flex-1 rounded-full border-2 border-black transition-all",
                                    i < attempts ? "bg-gray-300" : "bg-green-500 shadow-[0_2px_0_rgba(0,0,0,0.2)]"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
            {/* Leaderboard Preview - Now takes up remaining space */}
            <div className="flex-1 bg-white border-4 border-black rounded-2xl p-4 shadow-sm flex flex-col min-h-0">
                <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-3 flex items-center gap-2 shrink-0">
                    <Trophy className="w-4 h-4" /> Top Daily Scores
                </h3>
                <div className="flex-1 overflow-y-auto -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {isLoading ? (
                        <LoadingDuck text="Loading Daily Scores..." />
                    ) : leaderboard.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 font-bold space-y-2">
                            <Trophy className="w-12 h-12 opacity-20" />
                            <p>No scores yet today.</p>
                            <p className="text-xs opacity-70">Be the first to set a record!</p>
                        </div>
                    ) : (
                        <div className="space-y-2 pb-2">
                            {leaderboard.map((entry: any, index: number) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex items-center justify-between p-2 rounded-lg border-2 transition-colors",
                                        entry.userId === profileId
                                            ? "bg-yellow-50 border-yellow-200"
                                            : "bg-gray-50 border-gray-100"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={cn(
                                            "font-arcade w-6 text-center",
                                            index === 0 ? "text-yellow-500 text-lg" :
                                            index === 1 ? "text-gray-400 text-lg" :
                                            index === 2 ? "text-orange-400 text-lg" : "text-gray-400 text-sm"
                                        )}>
                                            #{entry.rank}
                                        </span>
                                        <div className="w-8 h-8 rounded-full border border-gray-300 overflow-hidden bg-white shrink-0">
                                            <DuckAvatar skinId={entry.skinId} emotion="idle" isStatic className="w-full h-full transform scale-150 translate-y-[10%]" />
                                        </div>
                                        <span className={cn("font-bold text-sm truncate max-w-[100px]", entry.userId === profileId && "text-blue-600")}>
                                            {entry.name}
                                        </span>
                                    </div>
                                    <span className="font-arcade text-sm">{(entry.score / 1000).toFixed(2)}s</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
function InfoView({ onClose }: { onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 overflow-y-auto p-6 bg-gray-50 pb-[calc(2.5rem+env(safe-area-inset-bottom))]"
        >
            <div className="space-y-6">
                {/* Rewards Section */}
                <div className="bg-yellow-50 border-4 border-yellow-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-black uppercase text-yellow-600 tracking-widest mb-4 flex items-center gap-2">
                        <Trophy className="w-4 h-4" /> Daily Prizes
                    </h3>
                    <div className="space-y-3">
                        <PrizeCard rank="1st Place" coins={1000} color="yellow" />
                        <PrizeCard rank="2nd Place" coins={750} color="gray" />
                        <PrizeCard rank="3rd Place" coins={500} color="orange" />
                    </div>
                </div>
                {/* Rules Section */}
                <div className="bg-blue-50 border-4 border-blue-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-black uppercase text-blue-600 tracking-widest mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Rules
                    </h3>
                    <ul className="space-y-3">
                        <RuleItem text="Everyone plays the exact same map seed." />
                        <RuleItem text="You have 3 attempts per day." />
                        <RuleItem text="Only your best time counts." />
                        <RuleItem text="Rewards are distributed at midnight UTC." />
                    </ul>
                </div>
                <Button
                    onClick={onClose}
                    className="w-full h-14 font-black border-4 border-black rounded-xl bg-white hover:bg-gray-100 text-black shadow-sm active:translate-y-[2px] active:shadow-none transition-all"
                >
                    BACK TO CHALLENGE
                </Button>
            </div>
        </motion.div>
    );
}
function PrizeCard({ rank, coins, color }: { rank: string, coins: number, color: 'yellow' | 'gray' | 'orange' }) {
    const colors = {
        yellow: "bg-white border-yellow-200 text-yellow-600",
        gray: "bg-white border-gray-200 text-gray-500",
        orange: "bg-white border-orange-200 text-orange-500"
    };
    const iconColors = {
        yellow: "text-yellow-500 fill-yellow-200",
        gray: "text-gray-400 fill-gray-200",
        orange: "text-orange-500 fill-orange-200"
    };
    return (
        <div className={cn("flex items-center justify-between p-3 rounded-xl border-2 shadow-sm", colors[color])}>
            <div className="flex items-center gap-3">
                <Trophy className={cn("w-6 h-6", iconColors[color])} />
                <span className="font-black uppercase text-sm">{rank}</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                <Coins className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-arcade text-black">{coins}</span>
            </div>
        </div>
    );
}
function RuleItem({ text }: { text: string }) {
    return (
        <li className="flex items-start gap-3 text-sm font-bold text-blue-900">
            <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
            <span className="leading-tight">{text}</span>
        </li>
    );
}