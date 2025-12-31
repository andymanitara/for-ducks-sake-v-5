import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shirt, Trophy, Star, BookOpen, Settings, Cloud, Swords, Users, Coins, ShoppingBag } from 'lucide-react';
import { PlayerProfile } from '@/types/game';
import { DuckAvatar } from './DuckAvatar';
import { soundSynth } from '@/game/SoundSynth';
import { haptics } from '@/game/Haptics';
import { cn, getUnlockedAchievements, formatLargeTime } from '@/lib/utils';
import { useGameStore } from '@/lib/store';
import { SKINS } from '@/game/constants';
interface MainMenuProps {
  onStart: () => void;
  onSkins: () => void;
  onLeaderboard: () => void;
  onBiome: () => void;
  onProfile: () => void;
  onInfo: () => void;
  onAchievements: () => void;
  onSettings: () => void;
  onFriends: () => void;
  onShop: () => void;
  onDaily: () => void;
  onChallenges: () => void;
  profile: PlayerProfile | null;
}
export function MainMenu({
  onStart,
  onSkins,
  onLeaderboard,
  onBiome,
  onProfile,
  onInfo,
  onAchievements,
  onSettings,
  onFriends,
  onShop,
  onDaily,
  onChallenges,
  profile
}: MainMenuProps) {
  const [duckEmotion, setDuckEmotion] = useState<'idle' | 'excited' | 'nervous'>('idle');
  const tickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const friendRequests = useGameStore(state => state.friendRequests);
  const challenges = useGameStore(state => state.challenges);
  const unlockSkin = useGameStore(state => state.unlockSkin);
  const pendingReward = useGameStore(state => state.pendingReward);
  // Secret Unlock State
  const secretTapsRef = useRef(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Calculate notifications
  const pendingChallengesCount = challenges.filter(c =>
      c.toUserId === profile?.playerId && c.status === 'pending'
  ).length;
  const rewardCount = pendingReward ? 1 : 0;
  // Social Badge: Only Friend Requests
  const socialBadgeCount = friendRequests.length;
  // Challenges Badge: Pending Challenges + Daily Rewards
  const challengesBadgeCount = pendingChallengesCount + rewardCount;
  // Calculate affordable shop items for badge
  const coins = profile?.coins || 0;
  const unlockedSkinIds = profile?.unlockedSkinIds || [];
  const affordableCount = SKINS.filter(s =>
      (s.cost || 0) > 0 &&
      !unlockedSkinIds.includes(s.id) &&
      coins >= (s.cost || 0)
  ).length;
  // Mastery Calculation
  const unlockedAchievements = useMemo(() => profile ? getUnlockedAchievements(profile) : [], [profile]);
  // Calculate unclaimed achievements count
  const unclaimedCount = useMemo(() => {
      if (!profile) return 0;
      const claimedSet = new Set(profile.claimedAchievementIds || []);
      return unlockedAchievements.filter(ach =>
          (ach.rewardCoins || 0) > 0 && !claimedSet.has(ach.id)
      ).length;
  }, [profile, unlockedAchievements]);
  const safeSetEmotion = useCallback((emotion: 'idle' | 'excited' | 'nervous') => {
    if (isMountedRef.current) {
      setDuckEmotion(emotion);
    }
  }, []);
  const scheduleTick = useCallback(() => {
    if (!isMountedRef.current) return;
    const delay = Math.random() * 4000 + 3000;
    tickTimeoutRef.current = setTimeout(() => {
      safeSetEmotion('nervous');
      setTimeout(() => {
        if (isMountedRef.current && duckEmotion !== 'excited') {
          safeSetEmotion('idle');
          scheduleTick();
        }
      }, 1500);
    }, delay);
  }, [duckEmotion, safeSetEmotion]);
  useEffect(() => {
    isMountedRef.current = true;
    const initialTick = setTimeout(() => {
      safeSetEmotion('nervous');
      setTimeout(() => {
        safeSetEmotion('idle');
        scheduleTick();
      }, 1500);
    }, 500);
    return () => {
      isMountedRef.current = false;
      if (tickTimeoutRef.current) clearTimeout(tickTimeoutRef.current);
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      clearTimeout(initialTick);
    };
  }, [scheduleTick, safeSetEmotion]);
  const handleDuckClick = () => {
    soundSynth.resumeContext(); // Ensure audio context is active
    soundSynth.playQuack();
    haptics.medium();
    safeSetEmotion('excited');
    setTimeout(() => {
      if (isMountedRef.current) {
        safeSetEmotion('idle');
      }
    }, 500);
  };
  const handleSecretTap = () => {
      // Immediate feedback
      soundSynth.resumeContext();
      soundSynth.playClick();
      haptics.soft();
      // Visual feedback
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 150);
      // Logic
      secretTapsRef.current += 1;
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      if (secretTapsRef.current >= 7) {
          const isUnlocked = profile?.unlockedSkinIds.includes('glitch_duck');
          if (!isUnlocked) {
              unlockSkin('glitch_duck');
              soundSynth.playUnlock();
              haptics.impact();
          }
          secretTapsRef.current = 0;
      } else {
          tapTimeoutRef.current = setTimeout(() => {
              secretTapsRef.current = 0;
          }, 1000);
      }
  };
  const equippedSkinId = profile?.equippedSkinId || 'default';
  const totalTimeSurvived = profile?.totalTimeSurvived || 0;
  const isSynced = profile?.authProvider && profile.authProvider !== 'guest';
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-between overflow-hidden pointer-events-auto">
      {/* Top Bar: Profile (Left) + Coins & Settings (Right) */}
      <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
        {/* Profile Badge */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto"
        >
          <Button
            onClick={() => { soundSynth.resumeContext(); soundSynth.playClick(); onProfile(); }}
            aria-label="Player Profile"
            className="h-9 pl-0.5 pr-3 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-full shadow-sm transition-all flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden bg-blue-500/50 relative shrink-0">
               <DuckAvatar
                  skinId={equippedSkinId}
                  emotion="idle"
                  isStatic={true}
                  className="w-full h-full transform scale-[3.5] translate-y-[8%] drop-shadow-none"
               />
               {isSynced && (
                   <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black z-10" />
               )}
            </div>
            <div className="flex flex-col items-start justify-center leading-none">
              <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[7px] font-black text-white/60 uppercase tracking-widest">
                  TOTAL
                  </span>
                  {isSynced && <Cloud className="w-2 h-2 text-blue-400 fill-current" />}
              </div>
              <span className="text-yellow-400 font-arcade text-xs tracking-wide">
                {formatLargeTime(totalTimeSurvived)}
              </span>
            </div>
          </Button>
        </motion.div>
        {/* Right Side: Coins + Settings */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-2 pointer-events-auto"
        >
          {/* Coins */}
          <div
              aria-label="Coin Balance"
              className="h-9 px-3 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-full shadow-sm transition-all flex items-center gap-2 group cursor-default select-none"
          >
            <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center border border-yellow-300 shadow-inner shrink-0">
               <Coins className="w-3 h-3 text-yellow-900" />
            </div>
            <span className="text-yellow-400 font-arcade text-xs tracking-wide">
              {coins}
            </span>
          </div>
          {/* Settings Button */}
          <Button
            onClick={() => { soundSynth.resumeContext(); soundSynth.playClick(); onSettings(); }}
            className="h-9 w-9 p-0 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-full shadow-sm transition-all flex items-center justify-center group"
          >
            <Settings className="w-5 h-5 text-white/80 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
          </Button>
        </motion.div>
      </div>
      {/* Main Content */}
      <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center relative z-10 px-6 pt-12 pb-[calc(3rem+env(safe-area-inset-bottom))] min-h-0">
        {/* Title - Floating Animation */}
        <div className="mb-2 text-center relative w-full flex flex-col items-center justify-center transform -rotate-2 scale-90 sm:scale-100 shrink-0 animate-float">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="font-arcade text-5xl sm:text-6xl text-yellow-400 tracking-tighter leading-[0.85] text-stroke-thick drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] z-0"
          >
            FOR
          </motion.div>
          <motion.div
            initial={{ scale: 2, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            style={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
            className="font-arcade text-7xl sm:text-8xl text-red-600 tracking-tighter leading-[0.85] text-stroke-3 drop-shadow-[8px_8px_0px_rgba(0,0,0,1)] z-10"
          >
            DUCKS
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 }}
            className="font-arcade text-5xl sm:text-6xl text-yellow-400 tracking-tighter leading-[0.85] text-stroke-thick drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] z-0"
          >
            SAKE
          </motion.div>
        </div>
        {/* Mascot - Flexible height to prevent overflow */}
        <div className="flex-1 w-full flex items-center justify-center relative min-h-0 shrink-1">
          <motion.div
            whileTap={{ scale: 0.9 }}
            onClick={handleDuckClick}
            className="cursor-pointer"
          >
            <DuckAvatar
              skinId={equippedSkinId}
              emotion={duckEmotion}
              className="w-48 h-48 sm:w-64 sm:h-64 drop-shadow-2xl"
            />
          </motion.div>
        </div>
        {/* Primary Actions */}
        <div className="w-full space-y-2 mb-3 shrink-0">
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="w-full relative"
            onMouseEnter={() => soundSynth.playHover()}
          >
            <Button
                onClick={() => {
                    soundSynth.resumeContext();
                    soundSynth.playClick();
                    onBiome(); // Directly open Map Selector
                }}
                className="w-full h-20 text-4xl sm:text-5xl font-arcade bg-red-500 hover:bg-red-400 text-white border-4 border-black rounded-2xl shadow-hard-xl active:translate-y-[6px] active:shadow-none transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden animate-pulse-subtle"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                <span className="text-stroke-thick drop-shadow-md leading-none mt-2">PLAY</span>
            </Button>
          </motion.div>
          {/* Challenges Button */}
          <motion.div whileTap={{ scale: 0.95 }} className="w-full relative">
             <Button
                onClick={() => { soundSynth.resumeContext(); soundSynth.playClick(); onChallenges(); }}
                className="w-full h-12 text-xl font-arcade bg-purple-500 hover:bg-purple-400 text-white border-4 border-black rounded-xl shadow-hard active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                <Swords className="w-5 h-5 stroke-[3px]" />
                <span className="text-stroke-1 drop-shadow-sm">CHALLENGES</span>
                {challengesBadgeCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce z-20">
                        {challengesBadgeCount}
                    </div>
                )}
            </Button>
          </motion.div>
        </div>
        {/* Icon Grid - 1 Row x 6 Columns (Mobile Optimized) */}
        <div className="grid grid-cols-6 gap-1.5 w-full px-1 pb-2 relative z-10 shrink-0">
          <MenuIconButton
            icon={Shirt}
            onClick={() => { soundSynth.resumeContext(); soundSynth.playClick(); onSkins(); }}
            label="SKINS"
            ariaLabel="Open Skins Menu"
            color="yellow"
          />
          <MenuIconButton
            icon={ShoppingBag}
            onClick={() => { soundSynth.resumeContext(); soundSynth.playClick(); onShop(); }}
            label="SHOP"
            ariaLabel="Open Shop"
            color="green"
            badge={affordableCount > 0 ? affordableCount : undefined}
          />
          <MenuIconButton
            icon={Users}
            onClick={() => { soundSynth.resumeContext(); soundSynth.playClick(); onFriends(); }}
            label="SOCIAL"
            ariaLabel="Manage Friends"
            color="pink"
            badge={socialBadgeCount > 0 ? socialBadgeCount : undefined}
          />
          <MenuIconButton
            icon={Star}
            onClick={() => { soundSynth.resumeContext(); soundSynth.playClick(); onAchievements(); }}
            label="AWARDS"
            ariaLabel="View Achievements"
            color="purple"
            badge={unclaimedCount > 0 ? unclaimedCount : undefined}
          />
          <MenuIconButton
            icon={Trophy}
            onClick={() => { soundSynth.resumeContext(); soundSynth.playClick(); onLeaderboard(); }}
            label="RANK"
            ariaLabel="View Leaderboard"
            color="gold"
          />
          <MenuIconButton
            icon={BookOpen}
            onClick={() => { soundSynth.resumeContext(); soundSynth.playClick(); onInfo(); }}
            label="GUIDE"
            ariaLabel="View Game Guide"
            color="black"
          />
        </div>
        {/* Version Indicator - Moved inside flex container for safe area respect */}
        <div
            className="w-full flex justify-center mt-2 pointer-events-auto cursor-pointer select-none pb-safe"
            onClick={handleSecretTap}
        >
            <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-all duration-100 block",
                isGlitching ? "animate-glitch opacity-100 scale-125 text-green-400" : "text-white opacity-70 hover:opacity-100 hover:scale-105"
            )}>
                v1.9.0
            </span>
        </div>
      </div>
    </div>
  );
}
function MenuIconButton({ icon: Icon, onClick, label, color, badge, ariaLabel }: any) {
  const colorStyles: Record<string, string> = {
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100",
    blue: "bg-cyan-50 border-cyan-200 text-cyan-600 hover:bg-cyan-100",
    gold: "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100",
    orange: "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100",
    purple: "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100",
    gray: "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100",
    pink: "bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100",
    green: "bg-green-100 border-green-300 text-green-700 hover:bg-green-200",
    black: "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
  };
  return (
    <div className="flex flex-col items-center gap-0.5 group w-full">
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.9 }}
        aria-label={ariaLabel || label}
        className={cn(
          "w-full h-14 flex items-center justify-center border-b-4 rounded-xl shadow-sm transition-all relative z-10 p-1",
          colorStyles[color]
        )}
      >
        <Icon className="w-5 h-5 stroke-[2.5px]" />
        {badge > 0 && (
            <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
                {badge}
            </div>
        )}
      </motion.button>
      <span className="text-[7px] font-black uppercase text-white tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] relative z-10 group-hover:scale-105 transition-transform leading-none">
        {label}
      </span>
    </div>
  );
}