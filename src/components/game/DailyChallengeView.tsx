import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Trophy, Play, Clock, Info, Gift, Coins } from 'lucide-react';
import { soundSynth } from '@/game/SoundSynth';
import { cn, getTimeUntilNextDailyReset, getDailyMap } from '@/lib/utils';
import { MapPreview } from './MapPreview';
import { LeaderboardTable } from './LeaderboardTable';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Confetti } from '@/components/ui/confetti';
export function DailyChallengeView() {
  const profile = useGameStore(state => state.profile);
  const startDailyChallenge = useGameStore(state => state.startDailyChallenge);
  const fetchDailyLeaderboard = useGameStore(state => state.fetchDailyLeaderboard);
  const dailyLeaderboard = useGameStore(state => state.dailyLeaderboard);
  const isLoading = useGameStore(state => state.isLoadingDailyLeaderboard);
  const error = useGameStore(state => state.dailyLeaderboardError);
  const userDailyRank = useGameStore(state => state.userDailyRank);
  const checkDailyReset = useGameStore(state => state.checkDailyReset);
  const pendingReward = useGameStore(state => state.pendingReward);
  const claimReward = useGameStore(state => state.claimReward);
  const [timeLeft, setTimeLeft] = useState(getTimeUntilNextDailyReset());
  const [showRules, setShowRules] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const dailyMap = getDailyMap(today);
  const attempts = profile?.dailyAttempts || 0;
  const maxAttempts = 3;
  const hasAttempts = attempts < maxAttempts;
  useEffect(() => {
    checkDailyReset();
    fetchDailyLeaderboard();
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilNextDailyReset());
    }, 60000);
    return () => clearInterval(timer);
  }, [checkDailyReset, fetchDailyLeaderboard]);
  const handlePlay = () => {
    if (!hasAttempts) {
      soundSynth.playDie();
      toast.error("No attempts left for today!");
      return;
    }
    soundSynth.playStart();
    startDailyChallenge();
  };
  const handleClaimReward = async () => {
      soundSynth.playClick();
      setShowConfetti(true);
      await claimReward();
      setTimeout(() => setShowConfetti(false), 2000);
  };
  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {showConfetti && <Confetti count={50} className="z-50" />}
      {/* Reward Card */}
      {pendingReward && (
          <div className="p-4 pb-0 shrink-0 animate-in slide-in-from-top-4 duration-500">
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-4 border-yellow-400 rounded-xl p-4 shadow-hard relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/40 to-transparent animate-pulse pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-black shadow-sm shrink-0">
                              <Gift className="w-6 h-6 text-white stroke-[3px]" />
                          </div>
                          <div>
                              <p className="font-black text-sm uppercase text-yellow-800">Daily Reward</p>
                              <p className="text-xs font-bold text-yellow-700">
                                  Rank #{pendingReward.rank} on {pendingReward.mapName}
                              </p>
                              <div className="flex items-center gap-1 mt-1 bg-white/50 px-2 py-0.5 rounded-full w-fit">
                                  <Coins className="w-3 h-3 text-yellow-600" />
                                  <span className="font-arcade text-xs text-yellow-800">+{pendingReward.coins}</span>
                              </div>
                          </div>
                      </div>
                      <Button
                          onClick={handleClaimReward}
                          className="h-10 bg-green-500 hover:bg-green-600 text-white font-black border-2 border-black rounded-lg shadow-sm active:translate-y-[1px] active:shadow-none animate-pulse"
                      >
                          CLAIM
                      </Button>
                  </div>
              </div>
          </div>
      )}
      {/* Hero Section */}
      <div className="p-4 bg-white border-b-2 border-gray-200 shrink-0">
        <div className="relative rounded-xl border-4 border-black overflow-hidden h-32 sm:h-40 bg-gray-800 shadow-sm">
           <MapPreview biome={dailyMap.id} className="w-full h-full object-cover opacity-80" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
           <div className="absolute bottom-3 left-3 text-white">
             <div className="flex items-center gap-2 mb-1">
               <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded border border-blue-400 uppercase">
                 {dailyMap.difficulty}
               </span>
               <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
                 <Clock className="w-3 h-3" /> {timeLeft} left
               </span>
             </div>
             <h3 className="text-2xl font-arcade leading-none text-stroke-thick drop-shadow-md">
               {dailyMap.name}
             </h3>
           </div>
           <div className="absolute top-3 right-3">
              <div className={cn(
                "flex flex-col items-center bg-black/60 backdrop-blur-md border-2 border-white/20 rounded-lg p-2 text-white",
                !hasAttempts && "border-red-500 bg-red-900/60"
              )}>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-80">ATTEMPTS</span>
                <span className={cn("text-xl font-arcade leading-none", !hasAttempts ? "text-red-400" : "text-green-400")}>
                  {maxAttempts - attempts}/{maxAttempts}
                </span>
              </div>
           </div>
        </div>
        <div className="mt-4 flex gap-2">
           <Button
             onClick={handlePlay}
             disabled={!hasAttempts}
             className={cn(
               "flex-1 h-12 text-lg font-arcade border-4 border-black rounded-xl shadow-hard active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2",
               hasAttempts
                 ? "bg-green-500 hover:bg-green-400 text-white"
                 : "bg-gray-300 text-gray-500 cursor-not-allowed"
             )}
           >
             {hasAttempts ? <><Play className="w-5 h-5 fill-current" /> PLAY DAILY</> : "NO ATTEMPTS"}
           </Button>
           <Button
             onClick={() => setShowRules(!showRules)}
             variant="outline"
             className="w-12 h-12 border-4 border-black rounded-xl shadow-sm bg-white hover:bg-gray-100 p-0 flex items-center justify-center"
           >
             <Info className="w-6 h-6 text-black" />
           </Button>
        </div>
      </div>
      {/* Rules Expandable */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-50 border-b-2 border-blue-200 overflow-hidden shrink-0"
          >
            <div className="p-4 text-sm text-blue-900 space-y-2">
              <p className="font-bold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-600" />
                Daily Rewards:
              </p>
              <ul className="list-disc list-inside text-xs font-medium space-y-1 pl-1">
                <li>Rank #1: <span className="font-black text-yellow-600">1000 Coins</span></li>
                <li>Rank #2: <span className="font-black text-gray-600">750 Coins</span></li>
                <li>Rank #3: <span className="font-black text-orange-600">500 Coins</span></li>
              </ul>
              <p className="text-xs italic opacity-80 mt-2">
                * Everyone plays the same seed. Map rotates daily at midnight UTC.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Leaderboard Section - Added padding to container */}
      <div className="flex-1 flex flex-col min-h-0 bg-white pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="p-2 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
          <span className="text-xs font-black uppercase text-gray-500 tracking-widest ml-2">Today's Top Ducks</span>
          {userDailyRank && (
            <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200">
              Your Rank: #{userDailyRank}
            </span>
          )}
        </div>
        <LeaderboardTable
          data={dailyLeaderboard}
          isLoading={isLoading}
          error={error}
          onRetry={() => { soundSynth.playClick(); fetchDailyLeaderboard(); }}
          profile={profile}
          emptyMessage="Be the first to set a score today!"
        />
      </div>
    </div>
  );
}