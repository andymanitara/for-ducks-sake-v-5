import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Save, Trophy, Clock, Gamepad2, Trash2, Map as MapIcon, Lock, Star, User, Zap, Pencil, Cloud, AlertTriangle, Share2, CheckCircle2, LogOut, RefreshCw, Loader2, Medal, Shirt } from 'lucide-react';
import { soundSynth } from '@/game/SoundSynth';
import { haptics } from '@/game/Haptics';
import { toast } from 'sonner';
import { MAPS, ACHIEVEMENTS } from '@/game/constants';
import { DuckAvatar } from './DuckAvatar';
import { cn, getUnlockedAchievements, formatLargeTime } from '@/lib/utils';
import { SocialAuthButton } from '@/components/ui/social-auth-button';
import { api } from '@/lib/api';
import { Achievement } from '@/types/game';
import { MapPreview } from './MapPreview';
import { StatTile } from './StatTile';
import { MapStatCard } from './MapStatCard';
import { IconMap } from './AchievementIcons';
interface ProfileScreenProps {
  onClose: () => void;
}
export function ProfileScreen({ onClose }: ProfileScreenProps) {
  const profile = useGameStore(state => state.profile);
  const updateProfile = useGameStore(state => state.updateProfile);
  const resetProfile = useGameStore(state => state.resetProfile);
  const loginWithProvider = useGameStore(state => state.loginWithProvider);
  const logout = useGameStore(state => state.logout);
  const [name, setName] = useState(profile?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isLinking, setIsLinking] = useState<'google' | 'apple' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [duckEmotion, setDuckEmotion] = useState<'idle' | 'excited' | 'nervous'>('idle');
  // Calculate Mastery
  const masteredMaps = useMemo(() => {
      if (!profile) return [];
      const unlockedAchIds = new Set(getUnlockedAchievements(profile).map(a => a.id));
      return MAPS.filter(map => {
          const mapAchievements = ACHIEVEMENTS.filter(a => a.mapId === map.id);
          if (mapAchievements.length === 0) return false; // No achievements = no mastery badge
          return mapAchievements.every(a => unlockedAchIds.has(a.id));
      });
  }, [profile]);
  // Group Achievements by Map
  const groupedAchievements = useMemo(() => {
      if (!profile) return { general: [], byMap: {} as Record<string, Achievement[]> };
      const unlocked = getUnlockedAchievements(profile);
      const byMap: Record<string, Achievement[]> = {};
      const general: Achievement[] = [];
      unlocked.forEach(ach => {
          if (ach.mapId) {
              if (!byMap[ach.mapId]) byMap[ach.mapId] = [];
              byMap[ach.mapId].push(ach);
          } else {
              general.push(ach);
          }
      });
      return { general, byMap };
  }, [profile]);
  if (!profile) return null;
  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 15) {
      toast.error("Invalid name length (3-15 chars)");
      return;
    }
    updateProfile({ displayName: trimmed });
    setIsEditing(false);
    toast.success("Profile updated!");
    soundSynth.playClick();
  };
  const handleReset = () => {
    soundSynth.playDie();
    resetProfile();
    onClose(); // Will trigger Welcome Screen via UIOverlay
  };
  const handleLogout = () => {
    soundSynth.playClick();
    logout();
    onClose();
    toast.success("Signed out successfully");
  };
  const handleLinkAccount = async (provider: 'google' | 'apple') => {
    soundSynth.playClick();
    setIsLinking(provider);
    try {
      await loginWithProvider(provider);
    } catch (e) {
      toast.error("Failed to link account");
    } finally {
      setIsLinking(null);
    }
  };
  const handleSync = async () => {
      if (!profile.playerId) return;
      soundSynth.playClick();
      setIsSyncing(true);
      try {
          const { success, data } = await api.getUser(profile.playerId);
          if (success && data) {
              // Manually update store with fetched data
              useGameStore.setState({ profile: data });
              toast.success("Profile synced with server!");
          } else {
              toast.error("Failed to sync profile.");
          }
      } catch (e) {
          toast.error("Sync failed. Check connection.");
      } finally {
          setIsSyncing(false);
      }
  };
  const handleDuckClick = () => {
      soundSynth.playQuack();
      haptics.medium();
      setDuckEmotion('excited');
      setTimeout(() => setDuckEmotion('idle'), 500);
  };
  const handleBadgeClick = (mapName: string) => {
      soundSynth.playClick();
      toast.success(`Master of ${mapName}`, {
          description: "You have unlocked and claimed all achievements for this map!",
          icon: '👑'
      });
  };
  const formatTime = (ms: number) => (ms / 1000).toFixed(2) + 's';
  const unlockedMapsCount = profile.unlockedMapIds?.length || 1;
  // Filter maps to show only unlocked ones, maintaining the order from MAPS constant
  const unlockedMaps = MAPS.filter(m => (profile.unlockedMapIds || []).includes(m.id));
  const standardMaps = MAPS.filter(m => !m.isSeasonal);
  const totalStandardMaps = standardMaps.length;
  // Progression Logic (Cumulative)
  // Find the first locked map in the standard sequence
  const nextLockedMapIndex = standardMaps.findIndex(m => !(profile.unlockedMapIds || []).includes(m.id));
  const nextLockedMap = nextLockedMapIndex !== -1 ? standardMaps[nextLockedMapIndex] : null;
  let progressPercent = 100;
  let remainingTime = 0;
  let unlockDescription = "ALL MAPS UNLOCKED!";
  if (nextLockedMap) {
      const currentTotal = profile.totalAccumulatedSurvivalTime || 0;
      const targetTotal = nextLockedMap.totalSurvivalTimeRequired;
      if (targetTotal > 0) {
          progressPercent = Math.min(100, (currentTotal / targetTotal) * 100);
          remainingTime = Math.max(0, targetTotal - currentTotal);
          unlockDescription = `Accumulate ${formatLargeTime(targetTotal)} total survival`;
      } else {
          progressPercent = 100;
          remainingTime = 0;
          unlockDescription = "Ready to Unlock";
      }
  }
  const handleShareStats = async () => {
    soundSynth.playClick();
    const shareText = `🦆 For Ducks Sake Stats 🦆\n\n👤 ${profile.displayName}\n🏆 Best Time: ${formatTime(profile.bestTime)}\n⏱ Total Survived: ${formatTime(profile.totalTimeSurvived)}\n🎮 Games Played: ${profile.gamesPlayed}\n\nCan you beat my high score?`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Duck Stats',
          text: shareText,
        });
        toast.success("Stats shared!");
      } catch (err) {
        console.warn("Share failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("Stats copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy stats");
      }
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ opacity: 0 }} // Explicit initialization
      className="absolute inset-0 bg-yellow-50 z-50 flex flex-col pointer-events-auto"
    >
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b-4 border-black bg-white">
        <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-black stroke-[3px]" />
            <h2 className="text-2xl font-arcade text-black text-stroke-1 tracking-widest drop-shadow-sm">
                PROFILE
            </h2>
        </div>
        <Button onClick={onClose} variant="ghost" size="icon" className="h-12 w-12 border-4 border-black rounded-full hover:bg-red-100 shadow-hard active:translate-y-[2px] active:shadow-none transition-all">
          <X className="w-6 h-6 stroke-[3px]" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-8 relative pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {/* Hero Section: Duck Avatar */}
        <div className="flex flex-col items-center justify-center pt-4">
            <motion.div
                whileTap={{ scale: 0.9 }}
                onClick={handleDuckClick}
                className="w-48 h-48 relative cursor-pointer"
            >
                <DuckAvatar
                    skinId={profile.equippedSkinId}
                    emotion={duckEmotion}
                    isStatic={false}
                    className="w-full h-full drop-shadow-2xl"
                />
                {/* Cloud Sync Badge */}
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white px-3 py-1 rounded-full border-2 border-black shadow-sm flex items-center gap-1.5 animate-in fade-in zoom-in duration-500 delay-300 pointer-events-none">
                    <Cloud className="w-3 h-3 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Synced</span>
                </div>
            </motion.div>
            {/* Name Section */}
            <div className="mt-6 flex items-center justify-center gap-3 w-full max-w-xs">
                {isEditing ? (
                    <div className="flex gap-2 w-full animate-in fade-in zoom-in duration-200">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-12 text-xl font-black border-4 border-black rounded-xl bg-white text-center font-arcade uppercase"
                            autoFocus
                        />
                        <Button onClick={handleSave} size="icon" className="h-12 w-12 bg-green-500 hover:bg-green-600 text-white border-4 border-black rounded-xl shrink-0 shadow-sm">
                            <Save className="w-5 h-5 stroke-[3px]" />
                        </Button>
                        <Button onClick={() => setIsEditing(false)} size="icon" className="h-12 w-12 bg-red-500 hover:bg-red-600 text-white border-4 border-black rounded-xl shrink-0 shadow-sm">
                            <X className="w-5 h-5 stroke-[3px]" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 group cursor-pointer w-full justify-center" onClick={() => setIsEditing(true)}>
                        <h1 className="text-xl sm:text-2xl font-arcade text-black text-stroke-1 tracking-wider text-center break-words line-clamp-2">
                            {profile.displayName}
                        </h1>
                        <div className="bg-white p-2 rounded-full border-2 border-black shadow-sm group-hover:scale-110 transition-transform shrink-0">
                            <Pencil className="w-4 h-4 text-black" />
                        </div>
                    </div>
                )}
            </div>
        </div>
        {/* Account Status Section */}
        <div className="bg-white p-5 rounded-2xl border-4 border-black shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Account Status</h3>
          {profile.authProvider === 'guest' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200 mb-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-bold leading-tight">
                  You are playing as a Guest. Link an account to save your progress permanently!
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <SocialAuthButton
                  provider="google"
                  onClick={() => handleLinkAccount('google')}
                  isLoading={isLinking === 'google'}
                  className={cn("h-10 text-sm", isLinking === 'apple' && "opacity-50 pointer-events-none")}
                />
                <SocialAuthButton
                  provider="apple"
                  onClick={() => handleLinkAccount('apple')}
                  isLoading={isLinking === 'apple'}
                  className={cn("h-10 text-sm", isLinking === 'google' && "opacity-50 pointer-events-none")}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl border-2 border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-green-200 shadow-sm">
                  {profile.authProvider === 'google' ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  ) : (
                    <svg className="w-5 h-5 fill-black" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-.98-.42-2.08-.45-3.08.02-1.05.5-2.18.6-3.25-.45-4.4-4.4-3.75-11.5 1.2-11.5 1.35.05 2.3.8 3.05.8 1.05-.05 2.35-1.05 3.9-.9 1.6.15 2.8.75 3.55 1.85-3.1 1.6-2.55 5.85.5 7.1-.65 1.65-1.5 3.25-2.8 4.65zM12.9 5.28c-.25-1.7 1.1-3.3 2.6-3.55.3 1.8-1.35 3.55-2.6 3.55z" /></svg>
                  )}
                </div>
                <div>
                  <p className="font-black text-sm text-green-800 uppercase">Connected</p>
                  <p className="text-xs font-bold text-green-600">{profile.email || 'Linked Account'}</p>
                </div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
          )}
        </div>
        {/* Next Goal Section - Cumulative Progression */}
        {nextLockedMap ? (
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-5 rounded-2xl text-white shadow-hard border-4 border-black relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Lock className="w-24 h-24" />
                </div>
                <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-300 fill-current animate-pulse" />
                            <span className="font-black uppercase tracking-widest text-sm text-blue-100">Next Mission</span>
                        </div>
                        {remainingTime > 0 && (
                            <span className="text-xs font-bold bg-black/20 px-2 py-1 rounded text-white/80">
                                {formatLargeTime(remainingTime)} left
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-end justify-between">
                            <h3 className="text-xl font-black italic leading-none">Unlock {nextLockedMap.name}</h3>
                            <span className="text-xs font-bold">{Math.round(progressPercent)}%</span>
                        </div>
                        <p className="text-xs font-bold text-blue-100 opacity-90">{unlockDescription}</p>
                    </div>
                    <div className="h-4 w-full bg-black/30 rounded-full overflow-hidden border-2 border-black/50">
                        <div
                            className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(255,215,0,0.5)] border-r-2 border-black"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-green-500 p-5 rounded-2xl text-white shadow-hard border-4 border-black text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent animate-pulse" />
                <div className="relative z-10 flex items-center justify-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-300 drop-shadow-md" />
                    <div>
                        <h3 className="text-xl font-black italic leading-none">ALL MAPS UNLOCKED!</h3>
                        <p className="font-bold text-green-100 text-xs mt-1">You are a true survivor.</p>
                    </div>
                </div>
            </div>
        )}
        {/* Stats Grid - Compact Tiles */}
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            icon={Trophy}
            label="Best Time"
            value={formatTime(profile.bestTime)}
            color="yellow"
          />
          <StatTile
            icon={Gamepad2}
            label="Games"
            value={profile.gamesPlayed.toString()}
            color="blue"
          />
          <StatTile
            icon={MapIcon}
            label="Maps"
            value={`${unlockedMapsCount}/${totalStandardMaps}`}
            color="green"
          />
          <StatTile
            icon={Clock}
            label="Total Time"
            value={formatLargeTime(profile.totalTimeSurvived)}
            color="purple"
          />
          <StatTile
            icon={Zap}
            label="Close Calls"
            value={(profile.totalNearMisses || 0).toString()}
            color="red"
          />
          <StatTile
            icon={Shirt}
            label="Skins"
            value={(profile.unlockedSkinIds?.length || 1).toString()}
            color="orange"
          />
        </div>
        {/* Map Mastery Section */}
        {masteredMaps.length > 0 && (
            <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-2">
                    <Medal className="w-3 h-3" /> Map Mastery
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                    {masteredMaps.map(map => (
                        <div
                            key={map.id}
                            onClick={() => handleBadgeClick(map.name)}
                            className="flex flex-col items-center gap-2 bg-yellow-50 border-2 border-yellow-200 p-3 rounded-xl min-w-[100px] shrink-0 cursor-pointer hover:scale-105 transition-transform shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                        >
                            <div className="w-12 h-12 rounded-full border-2 border-yellow-400 overflow-hidden relative shadow-sm">
                                <MapPreview biome={map.id} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                                    <Medal className="w-6 h-6 text-yellow-600 drop-shadow-sm" />
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase text-yellow-800 text-center leading-tight">
                                {map.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}
        {/* Map Records & Achievements */}
        <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Map Records</h3>
            <div className="grid grid-cols-1 gap-3">
                {unlockedMaps.map(map => (
                    <MapStatCard
                        key={map.id}
                        map={map}
                        stats={profile.mapStats?.[map.id] || { bestTime: 0, gamesPlayed: 0, totalTimeSurvived: 0 }}
                        achievements={groupedAchievements.byMap[map.id] || []}
                    />
                ))}
            </div>
        </div>
        {/* General Achievements */}
        {groupedAchievements.general.length > 0 && (
            <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">General Achievements</h3>
                <div className="grid grid-cols-2 gap-2">
                    {groupedAchievements.general.map(ach => {
                        const Icon = IconMap[ach.icon] || Trophy;
                        return (
                            <div key={ach.id} className="flex items-center gap-2 p-2 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                                <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200 shrink-0">
                                    <Icon className="w-4 h-4 text-gray-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-[10px] uppercase truncate">{ach.title}</p>
                                    <p className="text-[9px] text-gray-500 font-bold truncate">{ach.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
        {/* Actions Section */}
        <div className="pt-4 pb-8 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Actions</h3>
            <div className="grid grid-cols-2 gap-3">
                <Button
                    onClick={handleShareStats}
                    className="h-14 font-black border-4 border-black rounded-xl shadow-hard active:translate-y-[4px] active:shadow-none transition-all bg-cyan-400 text-black hover:bg-cyan-300 flex items-center justify-center gap-2"
                >
                    <Share2 className="w-5 h-5" /> SHARE STATS
                </Button>
                {profile.authProvider !== 'guest' ? (
                    <Button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="h-14 font-black border-4 border-black rounded-xl shadow-hard active:translate-y-[4px] active:shadow-none transition-all bg-indigo-100 text-indigo-700 hover:bg-indigo-200 flex items-center justify-center gap-2"
                    >
                        {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        SYNC
                    </Button>
                ) : (
                    <Button
                        onClick={() => setShowConfirmReset(true)}
                        variant="destructive"
                        className="h-14 font-black border-4 border-black rounded-xl shadow-hard active:translate-y-[4px] active:shadow-none transition-all bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-5 h-5" /> RESET
                    </Button>
                )}
                {profile.authProvider !== 'guest' && (
                    <Button
                        onClick={handleLogout}
                        className="col-span-2 h-12 font-black border-4 border-black rounded-xl shadow-sm active:translate-y-[2px] transition-all bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" /> SIGN OUT
                    </Button>
                )}
            </div>
        </div>
        {/* Custom Confirmation Overlay */}
        <AnimatePresence>
            {showConfirmReset && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ opacity: 0 }} // Explicit initialization
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white rounded-[2rem] p-6 border-4 border-black shadow-hard-xl w-full max-w-sm text-center"
                    >
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-200">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-2xl font-black font-arcade mb-2">ARE YOU SURE?</h3>
                        <p className="font-bold text-gray-600 mb-6 text-sm">
                            This will permanently delete your profile, stats, and unlocked skins. This action cannot be undone.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleReset}
                                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white border-4 border-black font-black rounded-xl shadow-hard active:translate-y-[2px] active:shadow-none transition-all"
                            >
                                YES, DELETE EVERYTHING
                            </Button>
                            <Button
                                onClick={() => setShowConfirmReset(false)}
                                className="w-full h-12 bg-white hover:bg-gray-100 text-black border-4 border-black font-black rounded-xl shadow-sm active:translate-y-[2px] transition-all"
                            >
                                CANCEL
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}