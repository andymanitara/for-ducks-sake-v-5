import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { X, Users, Swords, Loader2, CheckCircle2, Circle, CheckCircle, Send } from 'lucide-react';
import { soundSynth } from '@/game/SoundSynth';
import { DuckAvatar } from './DuckAvatar';
import { cn } from '@/lib/utils';
interface ChallengeSelectModalProps {
  onClose: () => void;
}
export function ChallengeSelectModal({ onClose }: ChallengeSelectModalProps) {
  const friends = useGameStore(state => state.friends);
  const isLoading = useGameStore(state => state.isLoadingFriends);
  const fetchFriends = useGameStore(state => state.fetchFriends);
  const fetchChallenges = useGameStore(state => state.fetchChallenges);
  const sendChallenges = useGameStore(state => state.sendChallenges);
  const score = useGameStore(state => state.score);
  const challenges = useGameStore(state => state.challenges);
  const lastSeed = useGameStore(state => state.lastSeed);
  const profile = useGameStore(state => state.profile);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  useEffect(() => {
    fetchFriends();
    fetchChallenges();
  }, [fetchFriends, fetchChallenges]);
  // Determine who has already been challenged with this seed
  const sentFriendIds = useMemo(() => {
      if (!lastSeed || !profile) return new Set<string>();
      const sent = challenges
          .filter(c => c.seed === lastSeed && c.fromUserId === profile.playerId)
          .map(c => c.toUserId);
      return new Set(sent);
  }, [challenges, lastSeed, profile]);
  const toggleSelection = (friendId: string) => {
      if (sentFriendIds.has(friendId)) return; // Cannot select if already sent
      soundSynth.playClick();
      setSelectedIds(prev => {
          if (prev.includes(friendId)) {
              return prev.filter(id => id !== friendId);
          } else {
              return [...prev, friendId];
          }
      });
  };
  const handleSendBatch = async () => {
      if (selectedIds.length === 0) return;
      soundSynth.playClick();
      setIsSending(true);
      await sendChallenges(selectedIds);
      setIsSending(false);
      onClose();
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ opacity: 0 }}
      className="absolute inset-0 bg-white z-[60] flex flex-col pointer-events-auto"
    >
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b-4 border-black bg-purple-500">
        <div className="flex items-center gap-3">
            <Swords className="w-8 h-8 text-white drop-shadow-md stroke-[3px]" />
            <h2 className="text-2xl font-arcade text-white text-stroke-thick tracking-widest drop-shadow-md">
                CHALLENGE
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
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 relative flex flex-col">
          <div className="mb-4 text-center shrink-0">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Your Score to Beat</p>
              <p className="text-4xl font-arcade text-black">{(score / 1000).toFixed(2)}s</p>
          </div>
          {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
          )}
          <div className="space-y-3 flex-1">
              {friends.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="font-black uppercase">No friends found</p>
                      <p className="text-xs font-bold">Add friends from the main menu to challenge them!</p>
                  </div>
              ) : (
                  friends.map(friend => {
                      const isSent = sentFriendIds.has(friend.id);
                      const isSelected = selectedIds.includes(friend.id);
                      return (
                          <div
                              key={friend.id}
                              onClick={() => toggleSelection(friend.id)}
                              className={cn(
                                  "flex items-center justify-between p-3 border-2 rounded-xl transition-all cursor-pointer select-none",
                                  isSent
                                      ? "bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed"
                                      : isSelected
                                          ? "bg-purple-50 border-purple-500 shadow-sm"
                                          : "bg-white border-gray-200 hover:border-purple-300"
                              )}
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full border border-gray-300 overflow-hidden bg-gray-100">
                                      <DuckAvatar skinId={friend.skinId} emotion="idle" isStatic className="w-full h-full transform scale-150 translate-y-[10%]" />
                                  </div>
                                  <div>
                                      <p className="font-black text-sm">{friend.displayName}</p>
                                      <p className="text-xs font-bold text-gray-400">Best: {(friend.bestTime / 1000).toFixed(2)}s</p>
                                  </div>
                              </div>
                              <div className="flex items-center">
                                  {isSent ? (
                                      <div className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full border border-green-200">
                                          <CheckCircle className="w-4 h-4" />
                                          <span className="text-[10px] font-black uppercase">SENT</span>
                                      </div>
                                  ) : (
                                      <div className={cn(
                                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                          isSelected
                                              ? "bg-purple-500 border-purple-500 text-white"
                                              : "border-gray-300 text-transparent"
                                      )}>
                                          {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                      </div>
                                  )}
                              </div>
                          </div>
                      );
                  })
              )}
          </div>
      </div>
      {/* Footer Action */}
      <div className="p-4 bg-white border-t-2 border-gray-200 shrink-0 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
          <Button
              onClick={handleSendBatch}
              disabled={selectedIds.length === 0 || isSending}
              className="w-full h-14 text-xl font-arcade bg-purple-500 hover:bg-purple-600 text-white border-4 border-black rounded-xl shadow-hard active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              {isSending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                  <>
                      <Send className="w-6 h-6 stroke-[3px]" />
                      SEND CHALLENGES ({selectedIds.length})
                  </>
              )}
          </Button>
      </div>
    </motion.div>
  );
}