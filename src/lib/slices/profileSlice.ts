import { ProfileSliceCreator } from './types';
import { PlayerProfile } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';
import { UNLOCK_THRESHOLDS, MAPS, SKINS, ACHIEVEMENTS, GAME_CONSTANTS } from '@/game/constants';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { soundSynth } from '@/game/SoundSynth';
import { getDailyMap, getUnlockedAchievements } from '@/lib/utils';
export const createProfileSlice: ProfileSliceCreator = (set, get) => ({
  profile: null,
  newUnlocks: [],
  viewingProfile: null,
  isViewingProfileOpen: false,
  createProfile: (displayName, id) => {
    const newProfile: PlayerProfile = {
      playerId: id || uuidv4(),
      displayName,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      bestTime: 0,
      gamesPlayed: 0,
      totalTimeSurvived: 0,
      totalAccumulatedSurvivalTime: 0,
      equippedSkinId: 'default',
      unlockedSkinIds: ['default'],
      unlockedMapIds: ['pond'],
      totalNearMisses: 0,
      coins: 0,
      mapStats: {},
      authProvider: 'guest',
      dailyAttempts: 0,
      lastDailyAttemptDate: new Date().toISOString().split('T')[0],
      claimedAchievementIds: []
    };
    set({ profile: newProfile });
    api.syncUser(newProfile).then(res => {
        if (res.success && res.data) {
            set({ profile: res.data });
        }
    }).catch(console.error);
  },
  updateProfile: (updates) => {
    set((state) => {
      if (!state.profile) return {};
      const updated = { ...state.profile, ...updates };
      api.syncUser(updated).then(res => {
          if (res.success && res.data) {
              set(s => {
                  if (!s.profile) return {};
                  return { profile: res.data };
              });
          }
      }).catch(console.error);
      return { profile: updated };
    });
  },
  updateStats: (stats) => {
    set((state) => {
      if (!state.profile) return {};
      const gameMode = state.gameMode;
      const isNormalMode = gameMode === 'normal';
      const score = stats.score;
      // Generic Stats (Update in ALL modes)
      const newGamesPlayed = state.profile.gamesPlayed + 1;
      const newTotalTime = state.profile.totalTimeSurvived + score;
      const newTotalNearMisses = (state.profile.totalNearMisses || 0) + stats.nearMisses;
      const coinsEarned = 5 + Math.floor(score / 10000) * 5;
      const newCoins = (state.profile.coins || 0) + coinsEarned;
      // Progression Stats (Update ONLY in Normal Mode)
      let newBestTime = state.profile.bestTime;
      let updatedMapStats = { ...state.profile.mapStats };
      let currentMapUnlocks = new Set(state.profile.unlockedMapIds);
      let newlyUnlocked: string[] = [];
      let newTotalAccumulatedSurvivalTime = state.profile.totalAccumulatedSurvivalTime || 0;
      let baseSurvivalTime = 0;
      let multiplier = 1.0;
      let adjustedSurvivalTime = 0;
      // Get current map stats for comparison
      const currentMapStats = state.profile.mapStats[stats.biome] || { bestTime: 0, gamesPlayed: 0, totalTimeSurvived: 0 };
      if (isNormalMode) {
          newBestTime = Math.max(state.profile.bestTime, score);
          updatedMapStats[stats.biome] = {
              bestTime: Math.max(currentMapStats.bestTime, score),
              gamesPlayed: currentMapStats.gamesPlayed + 1,
              totalTimeSurvived: currentMapStats.totalTimeSurvived + score,
              totalExplosions: (currentMapStats.totalExplosions || 0) + (stats.explosionsTriggered || 0),
              mostNearMisses: Math.max(currentMapStats.mostNearMisses || 0, stats.nearMisses),
              mostShowerPushes: Math.max(currentMapStats.mostShowerPushes || 0, stats.showerPushes || 0),
              mostWrenchDodges: Math.max(currentMapStats.mostWrenchDodges || 0, stats.wrenchDodges || 0),
              mostBallsPocketed: Math.max(currentMapStats.mostBallsPocketed || 0, stats.ballsPocketed || 0)
          };
          // Cumulative Progression Logic
          // Only count time after grace period to prevent idle farming
          baseSurvivalTime = Math.max(0, score - GAME_CONSTANTS.GRACE_PERIOD);
          const currentMap = MAPS.find(m => m.id === stats.biome);
          multiplier = currentMap?.progressMultiplier || 1.0;
          adjustedSurvivalTime = Math.floor(baseSurvivalTime * multiplier);
          newTotalAccumulatedSurvivalTime += adjustedSurvivalTime;
          // Map Unlocks Logic
          // 1. Cumulative Time Check
          for (const map of MAPS) {
              if (map.isSeasonal) continue; // Seasonal maps have separate logic
              if (currentMapUnlocks.has(map.id)) continue; // Already unlocked
              if (newTotalAccumulatedSurvivalTime >= map.totalSurvivalTimeRequired) {
                  currentMapUnlocks.add(map.id);
                  newlyUnlocked.push(map.id);
                  // Special case for La Fleur if unlocked via map progression
                  if (map.id === 'gym' && !state.profile.unlockedSkinIds.includes('lafleur')) {
                      newlyUnlocked.push('lafleur');
                  }
              }
          }
          // 2. Skill-Based Unlock Check (Single Run Best Time)
          // Check if current run unlocks the NEXT map in sequence
          const standardMaps = MAPS.filter(m => !m.isSeasonal);
          const currentMapIndex = standardMaps.findIndex(m => m.id === stats.biome);
          if (currentMapIndex !== -1 && currentMapIndex < standardMaps.length - 1) {
              const nextMap = standardMaps[currentMapIndex + 1];
              // If next map has a skill requirement and we beat it
              if (nextMap.bestTimeRequired && score >= nextMap.bestTimeRequired) {
                  if (!currentMapUnlocks.has(nextMap.id)) {
                      currentMapUnlocks.add(nextMap.id);
                      newlyUnlocked.push(nextMap.id);
                      // Special case for La Fleur if unlocked via map progression (Gym)
                      if (nextMap.id === 'gym' && !state.profile.unlockedSkinIds.includes('lafleur')) {
                          newlyUnlocked.push('lafleur');
                      }
                  }
              }
          }
      }
      // Skin Unlocks (Skill based - Persist across modes)
      const currentUnlocks = new Set(state.profile.unlockedSkinIds);
      // Add any new map unlocks to the set for skin checks (if any were added in normal mode)
      Object.entries(UNLOCK_THRESHOLDS).forEach(([skinId, condition]) => {
          if (currentUnlocks.has(skinId)) return;
          let met = false;
          if (condition.type === 'games' && newGamesPlayed >= condition.value) met = true;
          if (condition.type === 'score' && score >= condition.value) met = true;
          if (condition.type === 'total_time' && newTotalTime >= condition.value) met = true;
          if (met) {
              newlyUnlocked.push(skinId);
              currentUnlocks.add(skinId);
          }
      });
      // Special Skin Checks
      if (newlyUnlocked.includes('lafleur')) {
          currentUnlocks.add('lafleur');
      }
      // Mother Ducker (All Maps) - Only check if map unlocks changed (Normal Mode)
      if (isNormalMode) {
          const standardMaps = MAPS.filter(m => !m.isSeasonal);
          const allStandardUnlocked = standardMaps.every(m => currentMapUnlocks.has(m.id));
          if (allStandardUnlocked && !currentUnlocks.has('mother_ducker')) {
              newlyUnlocked.push('mother_ducker');
              currentUnlocks.add('mother_ducker');
          }
      }
      const updatedProfile = {
        ...state.profile,
        gamesPlayed: newGamesPlayed,
        totalTimeSurvived: newTotalTime,
        totalAccumulatedSurvivalTime: newTotalAccumulatedSurvivalTime,
        bestTime: newBestTime,
        lastSeenAt: Date.now(),
        unlockedSkinIds: Array.from(currentUnlocks),
        unlockedMapIds: Array.from(currentMapUnlocks),
        totalNearMisses: newTotalNearMisses,
        coins: newCoins,
        mapStats: updatedMapStats
      };
      // Submit Score
      api.submitScoreWithRetry({
        userId: updatedProfile.playerId,
        mapId: stats.biome,
        scoreMs: score,
        displayName: updatedProfile.displayName,
        skinId: updatedProfile.equippedSkinId,
        mode: gameMode // Pass the mode!
      }).then(response => {
          if (response && response.success) {
              const dailyRank = response.data?.daily;
              const globalRank = response.data?.global;
              // Handle Daily Challenge Mode explicitly
              if (gameMode === 'daily' && dailyRank) {
                  set({ userRank: {
                      rank: dailyRank.rank,
                      score: dailyRank.score,
                      userId: updatedProfile.playerId,
                      mapId: stats.biome,
                      category: 'daily_challenge'
                  }});
              } else {
                  // Normal Mode Logic
                  const currentTab = get().activeLeaderboardTab;
                  if (currentTab === 'daily' && dailyRank) {
                      set({ userRank: {
                          rank: dailyRank.rank,
                          score: dailyRank.score,
                          userId: updatedProfile.playerId,
                          mapId: stats.biome,
                          category: 'daily'
                      }});
                  } else if (currentTab === 'global' && globalRank) {
                      set({ userRank: {
                          rank: globalRank.rank,
                          score: globalRank.score,
                          userId: updatedProfile.playerId,
                          mapId: stats.biome,
                          category: 'global'
                      }});
                  }
              }
              set({ leaderboardData: [] });
          }
      }).catch(console.error);
      // Sync Profile
      api.syncUser(updatedProfile).then(res => {
          if (res.success && res.data) {
              set(s => {
                  if (!s.profile) return {};
                  return { profile: res.data };
              });
          }
      }).catch(console.error);
      // Challenge Completion
      if (state.activeChallengeId) {
          get().completeChallenge(score);
      }
      // Determine isNewRecord for Game Over screen
      // Only true if Normal Mode AND score > previous best
      const isNewRecord = isNormalMode && score > currentMapStats.bestTime;
      return {
        lastRunStats: {
            ...stats,
            coinsEarned,
            isNewRecord,
            baseSurvivalTime,
            multiplier,
            adjustedSurvivalTime
        },
        profile: updatedProfile,
        newUnlocks: [...state.newUnlocks, ...newlyUnlocked]
      };
    });
  },
  equipSkin: (skinId) => set((state) => {
    if (!state.profile) return {};
    const updated = { ...state.profile, equippedSkinId: skinId };
    api.syncUser(updated).catch(console.error);
    return { profile: updated };
  }),
  unlockSkin: (skinId) => set((state) => {
    if (!state.profile) return {};
    if (state.profile.unlockedSkinIds.includes(skinId)) return {};
    const updatedProfile = {
        ...state.profile,
        unlockedSkinIds: [...state.profile.unlockedSkinIds, skinId]
    };
    api.syncUser(updatedProfile).catch(console.error);
    ACHIEVEMENTS.forEach(ach => {
        if (ach.conditionType === 'has_skin' && ach.targetId === skinId) {
             toast.success(`Achievement Unlocked: ${ach.title}!`, {
                 description: ach.description,
                 icon: '🏆'
             });
             soundSynth.playUnlock();
        }
    });
    return {
      profile: updatedProfile,
      newUnlocks: [...state.newUnlocks, skinId]
    };
  }),
  purchaseSkin: (skinId) => set((state) => {
      if (!state.profile) return {};
      const skin = SKINS.find(s => s.id === skinId);
      if (!skin || !skin.cost) return {};
      if (state.profile.unlockedSkinIds.includes(skinId)) return {};
      if (state.profile.coins >= skin.cost) {
          const newCoins = state.profile.coins - skin.cost;
          const newUnlocked = [...state.profile.unlockedSkinIds, skinId];
          const updatedProfile = {
              ...state.profile,
              coins: newCoins,
              unlockedSkinIds: newUnlocked
          };
          api.syncUser(updatedProfile).catch(console.error);
          soundSynth.playUnlock();
          toast.success(`Purchased ${skin.name}!`);
          return { profile: updatedProfile };
      } else {
          soundSynth.playDie();
          return {};
      }
  }),
  resetProfile: () => set({
      profile: null,
      status: 'menu',
      newUnlocks: [],
      lastRunStats: null,
      friends: [],
      friendRequests: [],
      pbGhost: null,
      challenges: [],
      challengeTarget: null,
      activeChallengeId: null
  }),
  clearNewUnlocks: () => set({ newUnlocks: [] }),
  loginWithProvider: async (provider) => {
    const baseUrl = api.baseUrl;
    window.location.href = `${baseUrl}/auth/${provider}/login`;
  },
  handleAuthCallback: async (params: URLSearchParams) => {
    const userId = params.get('userId');
    const name = params.get('name');
    const provider = params.get('provider');
    if (!userId) return;
    const toastId = toast.loading("Syncing Profile...");
    try {
        const { success, data: restoredProfile } = await api.getUser(userId);
        if (success && restoredProfile) {
            const cloudGhost = restoredProfile.bestRunGhost || null;
            set({ profile: restoredProfile, pbGhost: cloudGhost });
            toast.dismiss(toastId);
            toast.success(`Welcome back, ${restoredProfile.displayName}!`);
        } else {
            const newProfile: PlayerProfile = {
                playerId: userId,
                displayName: name || 'Player',
                createdAt: Date.now(),
                lastSeenAt: Date.now(),
                bestTime: 0,
                gamesPlayed: 0,
                totalTimeSurvived: 0,
                totalAccumulatedSurvivalTime: 0,
                equippedSkinId: 'default',
                unlockedSkinIds: ['default'],
                unlockedMapIds: ['pond'],
                totalNearMisses: 0,
                coins: 0,
                mapStats: {},
                authProvider: (provider as any) || 'google',
                dailyAttempts: 0,
                lastDailyAttemptDate: new Date().toISOString().split('T')[0],
                claimedAchievementIds: []
            };
            set({ profile: newProfile });
            toast.dismiss(toastId);
            toast.success(`Welcome, ${name}!`);
        }
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        set({ leaderboardData: [], userRank: null });
    } catch (error) {
        console.error("Auth Callback Error:", error);
        toast.dismiss(toastId);
        toast.error("Failed to restore profile.");
    }
  },
  logout: () => set({ profile: null, status: 'menu', friends: [], friendRequests: [], pbGhost: null, challenges: [], challengeTarget: null }),
  viewUserProfile: async (userId) => {
      set({ isViewingProfileOpen: true, viewingProfile: null });
      try {
          const res = await api.getUser(userId);
          if (res.success && res.data) {
              set({ viewingProfile: res.data });
          } else {
              toast.error("Could not load profile");
              set({ isViewingProfileOpen: false });
          }
      } catch (e) {
          console.error("Failed to view profile", e);
          toast.error("Network error");
          set({ isViewingProfileOpen: false });
      }
  },
  closeUserProfile: () => {
      set({ isViewingProfileOpen: false, viewingProfile: null });
  },
  checkDailyReset: () => {
      const profile = get().profile;
      if (!profile) return;
      const today = new Date().toISOString().split('T')[0];
      const needsDailyReset = profile.lastDailyAttemptDate !== today;
      if (needsDailyReset) {
          const updated = {
              ...profile,
              dailyAttempts: 0,
              lastDailyAttemptDate: today
          };
          set({ profile: updated });
          api.syncUser(updated).catch(console.error);
      }
  },
  startDailyChallenge: () => {
      const state = get();
      state.checkDailyReset();
      const profile = get().profile;
      if (!profile) return;
      if (profile.dailyAttempts >= 3) {
          toast.error("No attempts left today!");
          return;
      }
      const today = new Date().toISOString().split('T')[0];
      const dailyMap = getDailyMap(today);
      const updatedProfile = {
          ...profile,
          dailyAttempts: profile.dailyAttempts + 1,
          lastDailyAttemptDate: today
      };
      const currentBiome = get().biome;
      set({
          profile: updatedProfile,
          gameMode: 'daily',
          pendingSeed: today,
          biome: dailyMap.id,
          previousBiome: currentBiome,
          status: 'playing',
          replayViewMode: 'default'
      });
      api.syncUser(updatedProfile).catch(console.error);
      toast.success(`Daily Challenge Started! Attempt ${updatedProfile.dailyAttempts}/3`);
  },
  claimAchievement: (achievementId) => set((state) => {
      if (!state.profile) return {};
      if ((state.profile.claimedAchievementIds || []).includes(achievementId)) return {};
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (!achievement || !achievement.rewardCoins) return {};
      const newCoins = (state.profile.coins || 0) + achievement.rewardCoins;
      const oldClaimed = new Set(state.profile.claimedAchievementIds || []);
      const newClaimedList = [...(state.profile.claimedAchievementIds || []), achievementId];
      const newClaimedSet = new Set(newClaimedList);
      const updatedProfile = {
          ...state.profile,
          coins: newCoins,
          claimedAchievementIds: newClaimedList
      };
      api.syncUser(updatedProfile).catch(console.error);
      soundSynth.playUnlock();
      toast.success(`Claimed ${achievement.rewardCoins} Coins!`);
      // Check for Map Mastery
      MAPS.forEach(map => {
          const mapAchievements = ACHIEVEMENTS.filter(a => a.mapId === map.id);
          if (mapAchievements.length === 0) return;
          const allClaimedNow = mapAchievements.every(a => newClaimedSet.has(a.id));
          const allClaimedBefore = mapAchievements.every(a => oldClaimed.has(a.id));
          if (allClaimedNow && !allClaimedBefore) {
               setTimeout(() => {
                   soundSynth.playMilestone(); // Or another celebratory sound
                   toast.success(`MAP MASTERED: ${map.name}!`, {
                       description: "You have claimed all rewards for this biome.",
                       icon: '👑',
                       duration: 5000
                   });
               }, 500); // Slight delay to separate from the coin claim toast
          }
      });
      return { profile: updatedProfile };
  }),
  claimAllAchievements: () => set((state) => {
      if (!state.profile) return {};
      const unlocked = getUnlockedAchievements(state.profile);
      const claimedSet = new Set(state.profile.claimedAchievementIds || []);
      const claimable = unlocked.filter(ach =>
          (ach.rewardCoins || 0) > 0 && !claimedSet.has(ach.id)
      );
      if (claimable.length === 0) return {};
      const totalCoins = claimable.reduce((sum, ach) => sum + (ach.rewardCoins || 0), 0);
      const newClaimedIds = claimable.map(ach => ach.id);
      const updatedClaimedList = [...(state.profile.claimedAchievementIds || []), ...newClaimedIds];
      const newBalance = (state.profile.coins || 0) + totalCoins;
      const updatedProfile = {
          ...state.profile,
          coins: newBalance,
          claimedAchievementIds: updatedClaimedList
      };
      api.syncUser(updatedProfile).catch(console.error);
      soundSynth.playUnlock();
      toast.success(`Claimed ${totalCoins} Coins from ${claimable.length} achievements!`, {
          icon: '💰'
      });
      return { profile: updatedProfile };
  }),
});