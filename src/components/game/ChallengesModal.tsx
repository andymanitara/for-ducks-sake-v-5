import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { X, Trophy, Play, Lock, CheckCircle2, Coins, Crown, Calendar, Map as MapIcon, Globe, ChevronLeft, ArrowRight } from 'lucide-react';
import { soundSynth } from '@/game/SoundSynth';
import { cn, formatLargeTime } from '@/lib/utils';
import { MapPreview } from './MapPreview';
import { MAPS, CHALLENGE_SEEDS, CHALLENGE_TIERS, MAP_CHALLENGE_REWARDS } from '@/game/constants';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DuckAvatar } from './DuckAvatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DailyChallengeView } from './DailyChallengeView';
import { LeaderboardTable } from './LeaderboardTable';
import { api } from '@/lib/api';
import { LeaderboardEntry, GameMap } from '@/types/game';
import { LoadingDuck } from '@/components/ui/loading-duck';
interface ChallengesModalProps {
  onClose: () => void;
  initialContext?: { tab: 'daily' | 'maps', mapId?: string } | null;
}
export function ChallengesModal({ onClose, initialContext }: ChallengesModalProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'maps'>(initialContext?.tab || 'daily');
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedMapId, setSelectedMapId] = useState<string | null>(initialContext?.mapId || null);
  // Initialize view based on context
  useEffect(() => {
    if (initialContext?.mapId) {
      setSelectedMapId(initialContext.mapId);
      setView('detail');
      setActiveTab('maps');
    }
  }, [initialContext]);
  const handleTabChange = (val: string) => {
    soundSynth.playClick();
    setActiveTab(val as 'daily' | 'maps');
    // Reset to list view when switching tabs
    if (val === 'daily') {
      setView('list');
      setSelectedMapId(null);
    }
  };
  const handleSelectMap = (mapId: string) => {
    soundSynth.playClick();
    setSelectedMapId(mapId);
    setView('detail');
  };
  const handleBackToList = () => {
    soundSynth.playClick();
    setView('list');
    setSelectedMapId(null);
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 bg-white z-[60] flex flex-col pointer-events-auto"
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b-4 border-black bg-purple-500 shrink-0">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-white drop-shadow-md stroke-[3px]" />
          <h2 className="text-xl font-arcade text-white text-stroke-thick tracking-widest drop-shadow-md leading-none">
            CHALLENGES
          </h2>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-10 w-10 border-4 border-black rounded-full bg-white hover:bg-red-100 shadow-hard active:translate-y-[2px] active:shadow-none transition-all"
        >
          <X className="w-5 h-5 stroke-[3px]" />
        </Button>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col h-full">
          {/* Tab Switcher (Only visible in List View) */}
          {view === 'list' && (
            <div className="px-4 pt-4 pb-2 bg-gray-50 shrink-0">
              <TabsList className="grid w-full grid-cols-2 border-4 border-black bg-white p-1 h-auto rounded-xl shadow-hard gap-1">
                <TabsTrigger
                  value="daily"
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white font-black py-2 rounded-lg border-2 border-transparent data-[state=active]:border-black transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> DAILY
                </TabsTrigger>
                <TabsTrigger
                  value="maps"
                  className="data-[state=active]:bg-purple-500 data-[state=active]:text-white font-black py-2 rounded-lg border-2 border-transparent data-[state=active]:border-black transition-all flex items-center justify-center gap-2"
                >
                  <MapIcon className="w-4 h-4" /> MAPS
                </TabsTrigger>
              </TabsList>
            </div>
          )}
          {/* Daily Tab Content */}
          <TabsContent value="daily" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <DailyChallengeView />
          </TabsContent>
          {/* Maps Tab Content */}
          <TabsContent value="maps" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden bg-gray-50 relative">
            <AnimatePresence mode="wait">
              {view === 'list' ? (
                <MapChallengeList key="list" onSelect={handleSelectMap} />
              ) : (
                <MapChallengeDetail
                  key="detail"
                  mapId={selectedMapId!}
                  onBack={handleBackToList}
                  onClose={onClose}
                />
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
// --- Sub-Components ---
function MapChallengeList({ onSelect }: { onSelect: (mapId: string) => void }) {
  const profile = useGameStore(s => s.profile);
  const standardMaps = MAPS.filter(m => !m.isSeasonal);
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full w-full"
    >
      <ScrollArea className="h-full w-full">
        {/* Added px-4 and w-full to ensure padding is respected on both sides */}
        <div className="w-full px-4 py-4 space-y-3 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          {standardMaps.map((map) => {
            const bestTime = profile?.mapStats?.[map.id]?.bestTime || 0;
            const isUnlocked = bestTime > 10000; // Unlock challenges after 10s in normal mode
            const completedIds = profile?.completedChallengeIds || [];
            // Calculate progress
            let completedCount = 0;
            CHALLENGE_TIERS.forEach(tier => {
              if (completedIds.includes(`challenge-${map.id}-${tier.id}`)) {
                completedCount++;
              }
            });
            const isMastered = completedCount === 3;
            return (
              <div
                key={map.id}
                onClick={() => isUnlocked && onSelect(map.id)}
                className={cn(
                  "bg-white border-4 border-black rounded-xl overflow-hidden shadow-sm transition-all relative group w-full",
                  isUnlocked ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : "opacity-80 grayscale-[0.5]",
                  isMastered && "border-yellow-500"
                )}
              >
                <div className="flex items-center p-3 gap-3">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg border-2 border-black overflow-hidden shrink-0 bg-gray-200 shadow-sm relative">
                    <MapPreview biome={map.id} className="w-full h-full object-cover" />
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-arcade text-sm text-black leading-none truncate">{map.name}</h3>
                      {isMastered && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-300" />}
                    </div>
                    {/* Progress Dots */}
                    <div className="flex gap-1">
                      {CHALLENGE_TIERS.map((tier, idx) => {
                        const isCompleted = completedIds.includes(`challenge-${map.id}-${tier.id}`);
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "h-2 flex-1 rounded-full border border-black/10",
                              isCompleted ? "bg-green-500" : "bg-gray-200"
                            )}
                          />
                        );
                      })}
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      {isUnlocked ? `${completedCount}/3 Complete` : "Locked (Survive 10s)"}
                    </p>
                  </div>
                  {/* Action Icon */}
                  <div className="shrink-0">
                    <div className={cn(
                      "w-10 h-10 rounded-full border-2 border-black flex items-center justify-center transition-colors",
                      isUnlocked ? "bg-purple-100 text-purple-600 group-hover:bg-purple-500 group-hover:text-white" : "bg-gray-100 text-gray-400"
                    )}>
                      {isUnlocked ? <ArrowRight className="w-5 h-5 stroke-[3px]" /> : <Lock className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </motion.div>
  );
}
function MapChallengeDetail({ mapId, onBack, onClose }: { mapId: string, onBack: () => void, onClose: () => void }) {
  const map = MAPS.find(m => m.id === mapId);
  const profile = useGameStore(s => s.profile);
  const setGameMode = useGameStore(s => s.setGameMode);
  const setBiome = useGameStore(s => s.setBiome);
  const setStatus = useGameStore(s => s.setStatus);
  const setPendingSeed = useGameStore(s => s.setPendingSeed);
  const setActiveChallengeId = useGameStore(s => s.setActiveChallengeId);
  const viewUserProfile = useGameStore(s => s.viewUserProfile);
  const [leaderboardTab, setLeaderboardTab] = useState<'global' | 'daily'>('global');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchLB = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const type = leaderboardTab === 'daily' ? 'challenge_daily' : 'challenge_global';
      const today = new Date().toISOString().split('T')[0];
      const [lbRes, rankRes] = await Promise.all([
          api.getLeaderboard(mapId, type, today),
          profile ? api.getUserRank(mapId, profile.playerId, type) : Promise.resolve({ success: true, data: null })
      ]);
      if (lbRes.success) {
        setLeaderboardData(lbRes.data);
      } else {
        setError(lbRes.error || 'Failed to load');
        setLeaderboardData([]);
      }
      if (rankRes.success && rankRes.data) {
           setUserRank({
              rank: rankRes.data.rank,
              score: rankRes.data.score,
              userId: rankRes.data.userId,
              name: profile?.displayName || 'You',
              skinId: profile?.equippedSkinId || 'default',
              date: Date.now(),
              playerName: profile?.displayName || 'You'
           });
      } else {
          setUserRank(null);
      }
    } catch (e) {
      setError('Network error');
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
    }
  }, [mapId, leaderboardTab, profile]);
  useEffect(() => {
    fetchLB();
  }, [fetchLB]);
  const displayData = useMemo(() => {
      if (!userRank) return leaderboardData;
      const exists = leaderboardData.find(e => e.userId === userRank.userId);
      if (exists) return leaderboardData;
      return [...leaderboardData, userRank];
  }, [leaderboardData, userRank]);
  const handlePlay = () => {
    soundSynth.playStart();
    setGameMode('challenge');
    setBiome(mapId as any);
    const seed = CHALLENGE_SEEDS[mapId] || `challenge-${mapId}-v1`;
    setPendingSeed(seed);
    setActiveChallengeId(seed);
    setStatus('playing');
    onClose();
  };
  const handleUserClick = (userId: string) => {
    soundSynth.playClick();
    viewUserProfile(userId);
  };
  const handleRetry = () => {
      soundSynth.playClick();
      fetchLB();
  };
  if (!map) return null;
  const completedIds = profile?.completedChallengeIds || [];
  const skinRewardId = MAP_CHALLENGE_REWARDS[mapId];
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col bg-gray-50"
    >
      {/* Detail Header */}
      <div className="flex items-center gap-3 p-3 bg-white border-b-2 border-gray-200 shrink-0">
        <Button onClick={onBack} variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h3 className="font-arcade text-lg text-black truncate">{map.name}</h3>
      </div>
      {/* Scrollable Content */}
      {/* Increased bottom padding to 8rem to clear the fixed footer button */}
      <div className="flex-1 overflow-y-auto pb-[calc(8rem+env(safe-area-inset-bottom))]">
        {/* Hero */}
        <div className="relative h-40 w-full bg-gray-800 border-b-4 border-black overflow-hidden shrink-0">
          <MapPreview biome={mapId} className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded border uppercase",
                map.difficulty === 'Easy' ? "bg-green-500 border-green-400" :
                map.difficulty === 'Medium' ? "bg-yellow-500 border-yellow-400" :
                map.difficulty === 'Hard' ? "bg-orange-500 border-orange-400" :
                "bg-red-500 border-red-400"
              )}>
                {map.difficulty}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-300 max-w-[80%] leading-tight">{map.description}</p>
          </div>
        </div>
        <div className="p-4 space-y-6">
          {/* Rewards Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">REWARDS</h4>
            <div className="grid gap-2">
              {CHALLENGE_TIERS.map((tier, idx) => {
                const challengeId = `challenge-${mapId}-${tier.id}`;
                const isCompleted = completedIds.includes(challengeId);
                const isSkinReward = tier.rewardType === 'skin';
                return (
                  <div key={tier.id} className={cn(
                    "flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                    isCompleted ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 font-black text-xs",
                        idx === 0 ? "bg-orange-100 border-orange-300 text-orange-700" :
                        idx === 1 ? "bg-gray-100 border-gray-300 text-gray-600" :
                        "bg-yellow-100 border-yellow-300 text-yellow-700"
                      )}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-black text-xs uppercase text-gray-700">Survive {tier.time / 1000}s</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {isSkinReward ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                              <DuckAvatar skinId={skinRewardId} emotion="idle" isStatic className="w-3 h-3" /> Skin
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">
                              <Coins className="w-3 h-3 fill-yellow-500" /> {tier.rewardCoins}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-100" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Leaderboard Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">LEADERBOARD</h4>
              <div className="flex bg-gray-200 p-0.5 rounded-lg">
                <button
                  onClick={() => setLeaderboardTab('global')}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-black transition-all flex items-center gap-1",
                    leaderboardTab === 'global' ? "bg-white shadow-sm text-black" : "text-gray-500"
                  )}
                >
                  <Globe className="w-3 h-3" /> GLOBAL
                </button>
                <button
                  onClick={() => setLeaderboardTab('daily')}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-black transition-all flex items-center gap-1",
                    leaderboardTab === 'daily' ? "bg-white shadow-sm text-black" : "text-gray-500"
                  )}
                >
                  <Calendar className="w-3 h-3" /> DAILY
                </button>
              </div>
            </div>
            {/* Fixed height container for scrolling */}
            <div className="h-80 bg-white rounded-xl border-2 border-gray-200 overflow-hidden flex flex-col">
              <LeaderboardTable
                data={displayData}
                isLoading={isLoading}
                error={error}
                profile={profile}
                onUserClick={handleUserClick}
                onRetry={handleRetry}
                emptyMessage={`No ${leaderboardTab} scores yet`}
                className="border-0 shadow-none rounded-none mx-0 h-full"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Sticky Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-gray-200 pb-[calc(1rem+env(safe-area-inset-bottom))] z-20">
        <Button
          onClick={handlePlay}
          className="w-full h-14 text-xl font-arcade bg-purple-500 hover:bg-purple-600 text-white border-4 border-black rounded-xl shadow-hard active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3"
        >
          <Play className="w-6 h-6 fill-current" /> PLAY CHALLENGE
        </Button>
      </div>
    </motion.div>
  );
}