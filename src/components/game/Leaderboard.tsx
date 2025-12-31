import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { X, Trophy, Globe, Lock, Users } from 'lucide-react';
import { LeaderboardCategory, LeaderboardEntry } from '@/types/game';
import { soundSynth } from '@/game/SoundSynth';
import { DuckAvatar } from './DuckAvatar';
import { MAPS } from '@/game/constants';
import { cn } from '@/lib/utils';
import { MapPreview } from './MapPreview';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LeaderboardTable } from './LeaderboardTable';
interface LeaderboardProps {
  onClose: () => void;
}
export function Leaderboard({ onClose }: LeaderboardProps) {
  const {
    activeTab,
    setTab,
    profile,
    leaderboardData,
    userRank,
    isLoading,
    leaderboardError,
    fetchLeaderboard,
    viewUserProfile,
    fetchFriendsLeaderboard,
    friendsLeaderboard,
    isLoadingFriendsLeaderboard,
    friendsLeaderboardError
  } = useGameStore(useShallow(state => ({
    activeTab: state.activeLeaderboardTab,
    setTab: state.setLeaderboardTab,
    profile: state.profile,
    leaderboardData: state.leaderboardData,
    userRank: state.userRank,
    isLoading: state.isLoadingLeaderboard,
    leaderboardError: state.leaderboardError,
    fetchLeaderboard: state.fetchLeaderboard,
    viewUserProfile: state.viewUserProfile,
    fetchFriendsLeaderboard: state.fetchFriendsLeaderboard,
    friendsLeaderboard: state.friendsLeaderboard,
    isLoadingFriendsLeaderboard: state.isLoadingFriendsLeaderboard,
    friendsLeaderboardError: state.friendsLeaderboardError
  })));
  // Local state for map selection
  const [selectedMapId, setSelectedMapId] = useState<string>(
    profile?.lastPlayedMapId || MAPS[0].id
  );
  // Fetch data when tab or map changes
  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriendsLeaderboard(selectedMapId);
    } else {
      // Default to global for non-friends tabs in this modal
      fetchLeaderboard(selectedMapId, 'global');
    }
  }, [activeTab, selectedMapId, fetchLeaderboard, fetchFriendsLeaderboard]);
  // Memoized data merging logic
  const displayData = useMemo(() => {
    // Select base data
    const rawData = activeTab === 'friends' ? friendsLeaderboard : leaderboardData;
    // If no profile, just return raw data
    if (!profile) return rawData;
    // Clone data to avoid mutation
    let data = [...rawData];
    // Check if user is already in the list
    const userEntryIndex = data.findIndex(e => e.userId === profile.playerId);
    // Determine the score to use for the user
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
            date: Date.now(),
            playerName: profile.displayName
        };
        data.push(localEntry);
    } else if (userEntryIndex !== -1) {
        // If user is in list, ensure their name/skin is up to date locally
        data[userEntryIndex] = {
            ...data[userEntryIndex],
            name: profile.displayName,
            skinId: profile.equippedSkinId,
            playerName: profile.displayName
        };
    }
    // Sort by score descending
    data.sort((a, b) => b.score - a.score);
    // Re-calculate ranks
    return data.map((entry, index) => ({
        ...entry,
        rank: index + 1
    }));
  }, [leaderboardData, friendsLeaderboard, profile, userRank, selectedMapId, activeTab]);
  const unlockedMapIds = profile?.unlockedMapIds || ['pond'];
  const handleMapSelect = (mapId: string) => {
      soundSynth.playClick();
      setSelectedMapId(mapId);
  };
  const handleTabChange = (tab: string) => {
    soundSynth.playClick();
    setTab(tab as LeaderboardCategory);
  };
  const handleRetry = () => {
      soundSynth.playClick();
      if (activeTab === 'friends') {
        fetchFriendsLeaderboard(selectedMapId);
      } else {
        fetchLeaderboard(selectedMapId, 'global');
      }
  };
  const handleUserClick = (userId: string) => {
      soundSynth.playClick();
      viewUserProfile(userId);
  };
  // Determine current loading/error state
  const currentIsLoading = activeTab === 'friends' ? isLoadingFriendsLeaderboard : isLoading;
  const currentError = activeTab === 'friends' ? friendsLeaderboardError : leaderboardError;
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
      {/* Map Selector - Horizontal Scroll */}
      <div className="pt-4 pb-2 shrink-0 z-20 relative bg-white border-b-2 border-gray-100">
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex w-max space-x-4 px-4">
            {MAPS.map((map) => {
              const isUnlocked = unlockedMapIds.includes(map.id);
              const isSelected = selectedMapId === map.id;
              return (
                <button
                  key={map.id}
                  onClick={() => handleMapSelect(map.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-all relative group",
                    !isUnlocked && "opacity-70"
                  )}
                >
                  <div className={cn(
                    "w-20 h-20 rounded-xl overflow-hidden border-4 transition-all relative",
                    isSelected ? "border-blue-500 shadow-hard scale-105" : "border-black/20 group-hover:border-black/40"
                  )}>
                    <MapPreview biome={map.id} className="w-full h-full object-cover" />
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-black uppercase tracking-wide",
                    isSelected ? "text-blue-600" : "text-gray-400"
                  )}>
                    {map.name}
                  </span>
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      {/* Tabs & Content */}
      <div className="flex-1 flex flex-col min-h-0 px-4 pb-4 pt-2">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4 border-4 border-black bg-white p-1 h-auto rounded-xl shadow-hard shrink-0 gap-1">
            <TabsTrigger
              value="global"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white font-black py-2 rounded-lg border-2 border-transparent data-[state=active]:border-black transition-all flex flex-col items-center leading-none gap-1"
            >
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> <span>GLOBAL</span>
              </div>
              <span className="text-[8px] opacity-60 font-bold">ALL-TIME</span>
            </TabsTrigger>
            <TabsTrigger
              value="friends"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white font-black py-2 rounded-lg border-2 border-transparent data-[state=active]:border-black transition-all flex flex-col items-center leading-none gap-1"
            >
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3" /> <span>FRIENDS</span>
              </div>
              <span className="text-[8px] opacity-60 font-bold">TOP SCORES</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="global" className="flex-1 min-h-0 mt-0">
            <LeaderboardTable
              data={displayData}
              isLoading={currentIsLoading}
              error={currentError}
              onRetry={handleRetry}
              profile={profile}
              selectedMapId={selectedMapId}
              onUserClick={handleUserClick}
              className="h-full"
            />
          </TabsContent>
          <TabsContent value="friends" className="flex-1 min-h-0 mt-0">
            <LeaderboardTable
              data={displayData}
              isLoading={currentIsLoading}
              error={currentError}
              onRetry={handleRetry}
              profile={profile}
              selectedMapId={selectedMapId}
              onUserClick={handleUserClick}
              className="h-full"
            />
          </TabsContent>
        </Tabs>
      </div>
      {/* Sticky User Rank Footer */}
      {(() => {
          const myEntry = displayData.find(e => e.userId === profile?.playerId);
          if (!myEntry || currentError) return null;
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