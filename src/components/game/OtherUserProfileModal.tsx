import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { X, Trophy, Gamepad2, Zap, UserPlus, Check, Loader2, Map as MapIcon, Shirt } from 'lucide-react';
import { DuckAvatar } from './DuckAvatar';
import { getUnlockedAchievements } from '@/lib/utils';
import { soundSynth } from '@/game/SoundSynth';
import { MAPS } from '@/game/constants';
import { Achievement } from '@/types/game';
import { StatTile } from './StatTile';
import { MapStatCard } from './MapStatCard';
import { IconMap } from './AchievementIcons';
interface OtherUserProfileModalProps {
  onClose: () => void;
}
export function OtherUserProfileModal({ onClose }: OtherUserProfileModalProps) {
  const viewingProfile = useGameStore(state => state.viewingProfile);
  const currentUserProfile = useGameStore(state => state.profile);
  const friends = useGameStore(state => state.friends);
  const sendFriendRequest = useGameStore(state => state.sendFriendRequest);
  const isLoading = !viewingProfile;
  const handleAddFriend = async () => {
    if (!viewingProfile || !viewingProfile.friendCode) return;
    soundSynth.playClick();
    await sendFriendRequest(viewingProfile.friendCode);
  };
  const isFriend = viewingProfile && friends.some(f => f.id === viewingProfile.playerId);
  const isMe = viewingProfile && currentUserProfile && viewingProfile.playerId === currentUserProfile.playerId;
  const formatTime = (ms: number) => (ms / 1000).toFixed(2) + 's';
  // Group Achievements by Map
  const groupedAchievements = useMemo(() => {
      if (!viewingProfile) return { general: [], byMap: {} as Record<string, Achievement[]> };
      const unlocked = getUnlockedAchievements(viewingProfile);
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
  }, [viewingProfile]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ opacity: 0 }}
      className="absolute inset-0 bg-white z-[70] flex flex-col pointer-events-auto"
    >
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b-4 border-black bg-indigo-500">
        <h2 className="text-2xl font-arcade text-white text-stroke-thick tracking-widest drop-shadow-md">
          PLAYER PROFILE
        </h2>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-12 w-12 border-4 border-black rounded-full bg-white hover:bg-red-100 shadow-hard active:translate-y-[2px] active:shadow-none transition-all"
        >
          <X className="w-6 h-6 stroke-[3px]" />
        </Button>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            {/* Hero Section */}
            <div className="flex flex-col items-center justify-center pt-4">
              <div className="w-40 h-40 relative">
                <DuckAvatar
                  skinId={viewingProfile.equippedSkinId}
                  emotion="idle"
                  isStatic={false}
                  className="w-full h-full drop-shadow-2xl"
                />
              </div>
              <h1 className="mt-4 text-2xl font-arcade text-black text-stroke-1 tracking-wider text-center">
                {viewingProfile.displayName}
              </h1>
              {/* Action Button */}
              {!isMe && !isFriend && (
                <Button
                  onClick={handleAddFriend}
                  className="mt-4 h-12 px-6 bg-green-500 hover:bg-green-600 text-white font-black border-4 border-black rounded-xl shadow-hard active:translate-y-[2px] active:shadow-none flex items-center gap-2"
                >
                  <UserPlus className="w-5 h-5" /> ADD FRIEND
                </Button>
              )}
              {isFriend && (
                <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full border-2 border-blue-200 font-bold text-sm">
                  <Check className="w-4 h-4" /> FRIEND
                </div>
              )}
            </div>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatTile icon={Trophy} label="Best Time" value={formatTime(viewingProfile.bestTime)} color="yellow" />
              <StatTile icon={Gamepad2} label="Games" value={viewingProfile.gamesPlayed.toString()} color="blue" />
              <StatTile icon={Zap} label="Close Calls" value={(viewingProfile.totalNearMisses || 0).toString()} color="red" />
              <StatTile icon={MapIcon} label="Maps" value={(viewingProfile.unlockedMapIds?.length || 1).toString()} color="green" />
              <StatTile icon={Shirt} label="Skins" value={(viewingProfile.unlockedSkinIds?.length || 1).toString()} color="purple" />
            </div>
            {/* Map Records & Achievements */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Map Records</h3>
              <div className="grid grid-cols-1 gap-3">
                {MAPS.filter(m => viewingProfile.mapStats?.[m.id]).map(map => (
                  <MapStatCard
                    key={map.id}
                    map={map}
                    stats={viewingProfile.mapStats![map.id]}
                    achievements={groupedAchievements.byMap[map.id] || []}
                  />
                ))}
                {(!viewingProfile.mapStats || Object.keys(viewingProfile.mapStats).length === 0) && (
                    <div className="text-center py-6 text-gray-400 font-bold text-sm">
                        No map records yet.
                    </div>
                )}
              </div>
            </div>
            {/* General Achievements */}
            {groupedAchievements.general.length > 0 && (
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">General Achievements</h3>
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
          </div>
        )}
      </div>
    </motion.div>
  );
}