import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { X, Trophy, Calendar, Globe, Crown, ChevronDown, Lock, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { LeaderboardCategory, LeaderboardEntry } from '@/types/game';
import { soundSynth } from '@/game/SoundSynth';
import { DuckAvatar } from './DuckAvatar';
import { formatDistanceToNow } from 'date-fns';
import { MAPS } from '@/game/constants';
import { cn, getTimeUntilNextDailyReset } from '@/lib/utils';
import { MapPreview } from './MapPreview';
import { LoadingDuck } from '@/components/ui/loading-duck';
interface LeaderboardProps {
  onClose: () => void;
}
export function Leaderboard({ onClose }: LeaderboardProps) {
  const activeTab = useGameStore(state => state.activeLeaderboardTab);
  const setTab = useGameStore(state => state.setLeaderboardTab);
  const profile = useGameStore(state => state.profile);
  const leaderboardData = useGameStore(state => state.leaderboardData);
  const userRank = useGameStore(state => state.userRank);
  const isLoading = useGameStore(state => state.isLoadingLeaderboard);
  const leaderboardError = useGameStore(state => state.leaderboardError);
  const fetchLeaderboard = useGameStore(state => state.fetchLeaderboard);
  const viewUserProfile = useGameStore(state => state.viewUserProfile);
  // Local state for map selection within leaderboard (independent of game biome)
  const [selectedMapId, setSelectedMapId] = useState<string>(useGameStore.getState().biome);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(getTimeUntilNextDailyReset());
  // Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeUntilNextDailyReset());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  // Fetch data when tab or map changes
  useEffect(() => {
    const type = activeTab === 'daily' ? 'daily' : 'global';
    fetchLeaderboard(selectedMapId, type);
  }, [activeTab, selectedMapId, fetchLeaderboard]);
  // Memoized data merging logic
  const displayData = useMemo(() => {
    // If no profile, just return raw data
    if (!profile) return leaderboardData;
    // Clone data to avoid mutation
    let data = [...leaderboardData];
    // Check if user is already in the list
    const userEntryIndex = data.findIndex(e => e.userId === profile.playerId);
    // Determine the score to use for the user
    // Priority:
    // 1. userRank.score (if available and matches current context)
    // 2. 0 (fallback)
    // FIX: Strictly check if userRank matches the current map and category
    // This prevents showing a score from a different map or mode
    const scoreToInject = (userRank?.mapId === selectedMapId && userRank?.category === activeTab)
        ? userRank.score
        : 0;
    // Only inject if we have a valid score > 0 and user isn't already in the list
    if (userEntryIndex === -1 && scoreToInject > 0) {
        const localEntry: LeaderboardEntry = {
            rank: 0, // Will be calculated
            name: profile.displayName,
            score: scoreToInject,
            skinId: profile.equippedSkinId,
            userId: profile.playerId,
            date: Date.now()
        };
        data.push(localEntry);
    } else if (userEntryIndex !== -1) {
        // If user is in list, ensure their name/skin is up to date locally
        data[userEntryIndex] = {
            ...data[userEntryIndex],
            name: profile.displayName,
            skinId: profile.equippedSkinId
        };
    }
    // Sort by score descending
    data.sort((a, b) => b.score - a.score);
    // Re-calculate ranks
    return data.map((entry, index) => ({
        ...entry,
        rank: index + 1
    }));
  }, [leaderboardData, profile, userRank, selectedMapId, activeTab]);
  const selectedMap = MAPS.find(m => m.id === selectedMapId) || MAPS[0];
  const unlockedMapIds = profile?.unlockedMapIds || ['pond'];
  const handleMapSelect = (mapId: string) => {
      if (!unlockedMapIds.includes(mapId)) return;
      soundSynth.playClick();
      setSelectedMapId(mapId);
      setIsMapPickerOpen(false);
  };
  const handleTabChange = (tab: LeaderboardCategory) => {
    soundSynth.playClick();
    setTab(tab);
  };
  const handleRetry = () => {
      soundSynth.playClick();
      const type = activeTab === 'daily' ? 'daily' : 'global';
      fetchLeaderboard(selectedMapId, type);
  };
  const handleUserClick = (userId: string) => {
      soundSynth.playClick();
      viewUserProfile(userId);
  };
  const renderTable = () => {
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[200px]">
                <LoadingDuck text="Fetching Ranks..." />
            </div>
        );
    }
    if (leaderboardError) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4 p-8 text-center min-h-[200px]">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2 border-2 border-red-200">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div className="max-w-[240px]">
                    <p className="font-black uppercase text-lg text-gray-600">Connection Failed</p>
                    <p className="text-xs font-bold text-gray-400 mt-1 break-words px-2 leading-tight">{leaderboardError}</p>
                </div>
                <Button
                    onClick={handleRetry}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-black border-2 border-black shadow-hard active:translate-y-[2px] active:shadow-none"
                >
                    <RefreshCw className="w-4 h-4 mr-2" /> RETRY
                </Button>
            </div>
        );
    }
    if (displayData.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4 p-8 text-center min-h-[200px]">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <DuckAvatar skinId="default" emotion="dizzy" isStatic className="w-20 h-20 opacity-50 grayscale" />
                </div>
                <div>
                    <p className="font-black uppercase text-xl text-gray-500">No scores yet</p>
                    <p className="text-sm font-bold">Be the first to conquer the {selectedMap.name}!</p>
                </div>
            </div>
        );
    }
    return (
      <div className="flex-1 overflow-hidden relative bg-white rounded-t-2xl border-x-4 border-t-4 border-black shadow-hard mx-1 flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent p-0">
            <div className="divide-y-2 divide-gray-100">
                {displayData.map((entry, index) => {
                    const isMe = entry.userId === profile?.playerId;
                    const timeAgo = entry.date ? formatDistanceToNow(entry.date, { addSuffix: true }) : '';
                    const isTop3 = index < 3;
                    return (
                        <div
                            key={`${entry.rank}-${entry.userId}`}
                            onClick={() => handleUserClick(entry.userId)}
                            className={cn(
                                "flex items-center p-3 gap-3 transition-colors cursor-pointer",
                                isMe ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-gray-50"
                            )}
                        >
                            {/* Rank */}
                            <div className="w-8 flex justify-center shrink-0">
                                {index === 0 ? (
                                    <Crown className="w-6 h-6 text-yellow-500 fill-yellow-200" />
                                ) : (
                                    <span className={cn(
                                        "font-black font-arcade text-lg",
                                        isTop3 ? "text-black" : "text-gray-400"
                                    )}>
                                        {entry.rank}
                                    </span>
                                )}
                            </div>
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full border-2 border-black/10 overflow-hidden bg-gray-100 shrink-0 relative">
                                <DuckAvatar skinId={entry.skinId} emotion="idle" isStatic className="w-full h-full transform scale-150 translate-y-[10%]" />
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={cn("font-black truncate text-sm", isMe && "text-blue-600")}>
                                        {entry.name} {isMe && "(You)"}
                                    </span>
                                </div>
                                {timeAgo && (
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1">
                                        {timeAgo}
                                    </span>
                                )}
                            </div>
                            {/* Score */}
                            <div className="text-right shrink-0">
                                <span className="font-arcade font-black text-lg text-black">
                                    {(entry.score / 1000).toFixed(2)}s
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    );
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ opacity: 0 }}
      className="absolute inset-0 bg-gray-50 z-50 flex flex-col pointer-events-auto"
    >
      {/* Header */}
      <div className="p-4 bg-blue-500 border-b-4 border-black flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-300 drop-shadow-md stroke-[3px]" />
          <h2 className="text-2xl font-arcade text-white text-stroke-thick tracking-widest drop-shadow-md">
            RANKING
          </h2>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-12 w-12 border-4 border-black rounded-full bg-white hover:bg-red-100 shadow-hard active:translate-y-[2px] active:shadow-none transition-all"
        >
          <X className="w-6 h-6 stroke-[3px]" />
        </Button>
      </div>
      {/* Map Selector */}
      <div className="px-4 pt-4 pb-2 shrink-0 z-20 relative">
          <button
            onClick={() => setIsMapPickerOpen(!isMapPickerOpen)}
            className="w-full bg-white border-4 border-black rounded-xl p-3 flex items-center justify-between shadow-sm active:translate-y-[2px] transition-all"
          >
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-200 relative">
                      <MapPreview biome={selectedMapId} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Current Map</span>
                      <span className="font-black text-lg uppercase leading-none">{selectedMap.name}</span>
                  </div>
              </div>
              <ChevronDown className={cn("w-6 h-6 transition-transform", isMapPickerOpen && "rotate-180")} />
          </button>
          {/* Dropdown */}
          <AnimatePresence>
              {isMapPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ opacity: 0 }}
                    className="absolute top-full left-4 right-4 mt-2 bg-white border-4 border-black rounded-xl shadow-hard-lg overflow-hidden z-30 max-h-[300px] overflow-y-auto"
                  >
                      {MAPS.map(map => {
                          const isUnlocked = unlockedMapIds.includes(map.id);
                          return (
                              <button
                                key={map.id}
                                onClick={() => handleMapSelect(map.id)}
                                disabled={!isUnlocked}
                                className={cn(
                                    "w-full p-3 flex items-center gap-3 border-b-2 border-gray-100 last:border-0 text-left transition-colors",
                                    selectedMapId === map.id ? "bg-blue-50" : "hover:bg-gray-50",
                                    !isUnlocked && "opacity-50 cursor-not-allowed bg-gray-100"
                                )}
                              >
                                  <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-200 relative shrink-0">
                                      <MapPreview biome={map.id} className="w-full h-full object-cover" />
                                      {!isUnlocked && (
                                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                              <Lock className="w-4 h-4 text-white" />
                                          </div>
                                      )}
                                  </div>
                                  <span className="font-black uppercase flex-1">{map.name}</span>
                                  {selectedMapId === map.id && <div className="w-3 h-3 bg-blue-500 rounded-full" />}
                              </button>
                          );
                      })}
                  </motion.div>
              )}
          </AnimatePresence>
      </div>
      {/* Custom Tabs */}
      <div className="flex-1 flex flex-col min-h-0 px-4 pb-4">
        <div className="grid w-full grid-cols-2 mb-4 border-4 border-black bg-white p-1 h-auto rounded-xl shadow-hard shrink-0 gap-1">
            <button
                onClick={() => handleTabChange('daily')}
                className={cn(
                    "font-black py-2 rounded-lg border-2 transition-all flex flex-col items-center leading-none gap-1",
                    activeTab === 'daily'
                        ? "bg-yellow-400 text-black border-black"
                        : "bg-transparent text-gray-500 border-transparent hover:bg-gray-100"
                )}
            >
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> <span>DAILY</span>
                </div>
                <span className="text-[8px] opacity-60 font-bold flex items-center gap-1">
                    <Clock className="w-2 h-2" /> ENDS IN {timeRemaining}
                </span>
            </button>
            <button
                onClick={() => handleTabChange('global')}
                className={cn(
                    "font-black py-2 rounded-lg border-2 transition-all flex flex-col items-center leading-none gap-1",
                    activeTab === 'global'
                        ? "bg-gray-800 text-white border-black"
                        : "bg-transparent text-gray-500 border-transparent hover:bg-gray-100"
                )}
            >
                <div className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3" /> <span>GLOBAL</span>
                </div>
                <span className="text-[8px] opacity-60 font-bold">ALL-TIME</span>
            </button>
        </div>
        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
            {renderTable()}
        </div>
      </div>
      {/* Sticky User Rank Footer */}
      {(() => {
          const myEntry = displayData.find(e => e.userId === profile?.playerId);
          if (!myEntry || leaderboardError) return null;
          return (
            <div className="border-t-4 border-black bg-white p-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] shrink-0 z-20">
                <div className="flex items-center justify-between bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center w-10">
                            <span className="text-[8px] font-black uppercase text-blue-400">RANK</span>
                            <span className="font-black font-arcade text-xl text-blue-600">#{myEntry.rank}</span>
                        </div>
                        <div className="w-px h-8 bg-blue-200" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full border border-blue-200 overflow-hidden bg-white">
                                <DuckAvatar skinId={profile?.equippedSkinId || 'default'} emotion="idle" isStatic className="w-full h-full transform scale-150 translate-y-[10%]" />
                            </div>
                            <span className="font-black text-sm">YOU</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[8px] font-black uppercase text-blue-400 block">BEST SCORE</span>
                        <span className="font-arcade font-black text-xl text-black">{(myEntry.score / 1000).toFixed(2)}s</span>
                    </div>
                </div>
            </div>
          );
      })()}
    </motion.div>
  );
}