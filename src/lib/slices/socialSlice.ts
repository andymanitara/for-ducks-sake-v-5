import { SocialSliceCreator } from './types';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { soundSynth } from '@/game/SoundSynth';
import { BiomeType } from '@/types/game';
export const createSocialSlice: SocialSliceCreator = (set, get) => ({
  friends: [],
  friendRequests: [],
  isLoadingFriends: false,
  showFriendsModal: false,
  challenges: [],
  showChallengeModal: false,
  activeChallengeId: null,
  challengeTarget: null,
  leaderboardData: [],
  userRank: null,
  isLoadingLeaderboard: false,
  leaderboardError: null,
  activeLeaderboardTab: 'daily',
  pbGhost: null,
  activeOpponentGhost: null,
  opponentName: null,
  storageMode: 'loading',
  pendingReward: null,
  fetchFriends: async () => {
      const profile = get().profile;
      if (!profile) return;
      set({ isLoadingFriends: true });
      try {
          const res = await api.getFriends(profile.playerId);
          if (res.success) {
              set({
                  friends: res.data.friends,
                  friendRequests: res.data.requests,
                  pendingReward: res.data.reward || null
              });
              // Notify if reward exists and not already showing modal
              if (res.data.reward && !get().showFriendsModal) {
                  toast.success("You have a Daily Reward waiting!", {
                      action: {
                          label: 'Claim',
                          onClick: () => {
                              if (get().status === 'playing') get().togglePause();
                              set({ showFriendsModal: true });
                          }
                      },
                      duration: 8000
                  });
              }
          }
      } catch (e) {
          console.error("Failed to fetch friends", e);
      } finally {
          set({ isLoadingFriends: false });
      }
  },
  sendFriendRequest: async (code) => {
      const profile = get().profile;
      if (!profile) return;
      try {
          const res = await api.sendFriendRequest(profile.playerId, code);
          if (res.success) {
              toast.success(res.message);
          } else {
              toast.error(res.message || "Failed to send request");
          }
      } catch (e) {
          toast.error("Network error");
      }
  },
  respondToFriendRequest: async (requestId, action) => {
      const profile = get().profile;
      if (!profile) return;
      const currentRequests = get().friendRequests;
      const updatedRequests = currentRequests.filter(r => r.id !== requestId);
      set({ friendRequests: updatedRequests });
      try {
          const res = await api.respondToFriendRequest(profile.playerId, requestId, action);
          if (res.success) {
              toast.success(res.message);
              get().fetchFriends();
          } else {
              toast.error(res.message || "Failed to respond");
              set({ friendRequests: currentRequests });
          }
      } catch (e) {
          toast.error("Network error");
          set({ friendRequests: currentRequests });
      }
  },
  removeFriend: async (friendId) => {
      const profile = get().profile;
      if (!profile) return;
      try {
          const res = await api.removeFriend(profile.playerId, friendId);
          if (res.success) {
              toast.success("Friend removed");
              set(state => ({
                  friends: state.friends.filter(f => f.id !== friendId)
              }));
          } else {
              toast.error(res.error || "Failed to remove friend");
          }
      } catch (e) {
          toast.error("Network error");
      }
  },
  raceFriend: async (friend) => {
      set({ isLoadingFriends: true });
      try {
          const res = await api.getUser(friend.id);
          if (res.success && res.data && res.data.bestRunGhost) {
              set({
                  activeOpponentGhost: res.data.bestRunGhost,
                  opponentName: friend.displayName,
                  status: 'playing',
                  replayViewMode: 'default'
              });
              toast.success(`Racing against ${friend.displayName}!`);
          } else {
              toast.error(`${friend.displayName} hasn't saved a ghost run yet.`);
          }
      } catch (e) {
          toast.error("Failed to load friend's ghost.");
      } finally {
          set({ isLoadingFriends: false });
      }
  },
  clearOpponent: () => set({ activeOpponentGhost: null, opponentName: null }),
  setShowFriendsModal: (open) => set({ showFriendsModal: open }),
  checkNotifications: async () => {
      const state = get();
      const profile = state.profile;
      if (!profile) return;
      try {
          // Pass skipErrorLog: true to prevent console spam on network errors during polling
          const friendsRes = await api.getFriends(profile.playerId, { skipErrorLog: true });
          if (friendsRes.success) {
              const newRequests = friendsRes.data.requests;
              const currentRequests = state.friendRequests;
              const currentIds = new Set(currentRequests.map(r => r.id));
              const addedRequests = newRequests.filter(r => !currentIds.has(r.id));
              if (addedRequests.length > 0) {
                  soundSynth.playNotification();
                  const count = addedRequests.length;
                  toast.info(`You have ${count} new friend request${count > 1 ? 's' : ''}!`, {
                      action: {
                          label: 'View',
                          onClick: () => {
                              if (state.status === 'playing') state.togglePause();
                              state.setShowFriendsModal(true);
                          }
                      },
                      duration: 5000
                  });
              }
              // Also check for reward in background poll
              if (friendsRes.data.reward && !state.pendingReward) {
                   soundSynth.playNotification();
                   toast.success("You have a Daily Reward waiting!", {
                      action: {
                          label: 'Claim',
                          onClick: () => {
                              if (state.status === 'playing') state.togglePause();
                              state.setShowFriendsModal(true);
                          }
                      },
                      duration: 8000
                  });
              }
              set({
                  friendRequests: newRequests,
                  friends: friendsRes.data.friends,
                  pendingReward: friendsRes.data.reward || null
              });
          }
          const challengesRes = await api.getChallenges(profile.playerId, { skipErrorLog: true });
          if (challengesRes.success) {
              const newChallenges = challengesRes.data;
              const currentChallenges = state.challenges;
              const pendingIncoming = newChallenges.filter(c => c.toUserId === profile.playerId && c.status === 'pending');
              const currentPendingIds = new Set(currentChallenges.filter(c => c.toUserId === profile.playerId && c.status === 'pending').map(c => c.id));
              const addedChallenges = pendingIncoming.filter(c => !currentPendingIds.has(c.id));
              if (addedChallenges.length > 0) {
                  soundSynth.playNotification();
                  const count = addedChallenges.length;
                  toast.info(`You have ${count} new challenge${count > 1 ? 's' : ''}!`, {
                      action: {
                          label: 'View',
                          onClick: () => {
                              if (state.status === 'playing') state.togglePause();
                              state.setShowChallengeModal(true);
                          }
                      },
                      duration: 5000
                  });
              }
              set({ challenges: newChallenges });
          }
      } catch (e) {
          // Silently fail for background polling
      }
  },
  fetchChallenges: async () => {
      const profile = get().profile;
      if (!profile) return;
      try {
          const res = await api.getChallenges(profile.playerId);
          if (res.success) {
              set({ challenges: res.data });
          }
      } catch (e) {
          console.error("Failed to fetch challenges", e);
      }
  },
  sendChallenge: async (friendId) => {
      const profile = get().profile;
      const lastSeed = get().lastSeed;
      const score = get().score;
      const biome = get().biome;
      if (!profile || !lastSeed) return;
      try {
          const res = await api.createChallenge({
              fromUserId: profile.playerId,
              toUserId: friendId,
              seed: lastSeed,
              score: score,
              mapId: biome
          });
          if (res.success) {
              toast.success("Challenge sent!");
              get().fetchChallenges();
          } else {
              toast.error("Failed to send challenge");
          }
      } catch (e) {
          toast.error("Network error");
      }
  },
  sendChallenges: async (friendIds) => {
      const profile = get().profile;
      const lastSeed = get().lastSeed;
      const score = get().score;
      const biome = get().biome;
      if (!profile || !lastSeed || friendIds.length === 0) return;
      try {
          const promises = friendIds.map(friendId =>
              api.createChallenge({
                  fromUserId: profile.playerId,
                  toUserId: friendId,
                  seed: lastSeed,
                  score: score,
                  mapId: biome
              })
          );
          await Promise.all(promises);
          toast.success(`Sent ${friendIds.length} challenges!`);
          get().fetchChallenges();
      } catch (e) {
          console.error("Failed to send batch challenges", e);
          toast.error("Failed to send some challenges");
      }
  },
  acceptChallenge: (challenge) => {
      set({
          pendingSeed: challenge.seed,
          gameMode: 'challenge',
          activeChallengeId: challenge.id,
          challengeTarget: challenge.challengerScore,
          status: 'playing',
          replayViewMode: 'default',
          biome: (challenge.mapId as BiomeType) || 'pond'
      });
      toast.success(`Challenge accepted! Beat ${challenge.challengerScore}ms!`);
  },
  completeChallenge: async (score) => {
      const activeChallengeId = get().activeChallengeId;
      if (!activeChallengeId) return;
      try {
          await api.updateChallenge({
              challengeId: activeChallengeId,
              status: 'completed',
              score: score
          });
          set({ activeChallengeId: null });
          get().fetchChallenges();
      } catch (e) {
          console.error("Failed to complete challenge", e);
      }
  },
  setShowChallengeModal: (open) => set({ showChallengeModal: open }),
  fetchLeaderboard: async (mapId, type) => {
    set({ isLoadingLeaderboard: true, leaderboardError: null });
    try {
      const res = await api.getLeaderboard(mapId, type);
      if (res.success) {
        set({ leaderboardData: res.data });
      } else {
        set({ leaderboardError: res.error || 'Failed to load leaderboard', leaderboardData: [] });
      }
      const profile = get().profile;
      if (profile) {
        const rankRes = await api.getUserRank(mapId, profile.playerId, type);
        if (rankRes.success && rankRes.data) {
          set({ userRank: {
              ...rankRes.data,
              mapId,
              category: type
          }});
        } else {
          set({ userRank: null });
        }
      }
    } catch (e: any) {
      console.error("Failed to fetch leaderboard", e);
      set({ leaderboardError: e.message || 'Network error', leaderboardData: [] });
    } finally {
      set({ isLoadingLeaderboard: false });
    }
  },
  setLeaderboardTab: (tab) => set({ activeLeaderboardTab: tab }),
  setPbGhost: (ghost) => set((state) => {
      if (state.profile) {
          const updatedProfile = { ...state.profile, bestRunGhost: ghost };
          api.syncUser(updatedProfile).catch(console.error);
          return { pbGhost: ghost, profile: updatedProfile };
      }
      return { pbGhost: ghost };
  }),
  checkBackendStatus: async () => {
      try {
          const res = await api.checkStatus();
          if (res.success) {
              set({ storageMode: res.data.kv ? 'kv' : 'mock' });
          } else {
              set({ storageMode: 'mock' });
          }
      } catch (e) {
          console.error("Failed to check backend status", e);
          set({ storageMode: 'mock' });
      }
  },
  claimReward: async () => {
      const state = get();
      const reward = state.pendingReward;
      const profile = state.profile;
      if (!reward || !profile) return;
      try {
          const res = await api.claimReward(profile.playerId, reward.date, reward.coins);
          if (res.success) {
              soundSynth.playUnlock();
              toast.success(`Claimed ${reward.coins} Coins!`);
              // Update local profile coins
              set(s => ({
                  profile: s.profile ? { ...s.profile, coins: res.newBalance } : null,
                  pendingReward: null
              }));
          } else {
              toast.error("Failed to claim reward");
          }
      } catch (e) {
          toast.error("Network error claiming reward");
      }
  }
});