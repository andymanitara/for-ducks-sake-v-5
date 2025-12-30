import { ProfileSliceCreator } from "./types";
import { PlayerProfile } from "@/types/game";
import { v4 as uuidv4 } from "uuid";
import { UNLOCK_THRESHOLDS, MAPS, SKINS, ACHIEVEMENTS, GAME_CONSTANTS } from "@/game/constants";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { soundSynth } from "@/game/SoundSynth";
import { getDailyMap, getUnlockedAchievements } from "@/lib/utils";

function normalizeProfile(p: any): PlayerProfile {
  const safe = (p ?? {}) as Partial<PlayerProfile>;

  return {
    playerId: safe.playerId || uuidv4(),
    displayName: safe.displayName || "Player",
    createdAt: safe.createdAt ?? Date.now(),
    lastSeenAt: safe.lastSeenAt ?? Date.now(),
    bestTime: safe.bestTime ?? 0,
    gamesPlayed: safe.gamesPlayed ?? 0,
    totalTimeSurvived: safe.totalTimeSurvived ?? 0,
    totalAccumulatedSurvivalTime: safe.totalAccumulatedSurvivalTime ?? 0,
    equippedSkinId: safe.equippedSkinId || "default",
    unlockedSkinIds: Array.isArray(safe.unlockedSkinIds) ? safe.unlockedSkinIds : ["default"],
    unlockedMapIds: Array.isArray(safe.unlockedMapIds) ? safe.unlockedMapIds : ["pond"],
    totalNearMisses: safe.totalNearMisses ?? 0,
    coins: safe.coins ?? 0,
    mapStats: (safe.mapStats && typeof safe.mapStats === "object") ? safe.mapStats : {},
    authProvider: (safe.authProvider as any) || "guest",
    email: safe.email,
    friendCode: safe.friendCode,
    bestRunGhost: safe.bestRunGhost,
    dailyAttempts: safe.dailyAttempts ?? 0,
    lastDailyAttemptDate:
      safe.lastDailyAttemptDate || new Date().toISOString().split("T")[0],
    claimedRewardDates: Array.isArray(safe.claimedRewardDates) ? safe.claimedRewardDates : [],
    claimedAchievementIds: Array.isArray(safe.claimedAchievementIds) ? safe.claimedAchievementIds : [],
  };
}

export const createProfileSlice: ProfileSliceCreator = (set, get) => ({
  profile: null,
  newUnlocks: [],
  viewingProfile: null,
  isViewingProfileOpen: false,

  createProfile: (displayName, id) => {
    const newProfile: PlayerProfile = normalizeProfile({
      playerId: id || uuidv4(),
      displayName,
      authProvider: "guest",
      equippedSkinId: "default",
      unlockedSkinIds: ["default"],
      unlockedMapIds: ["pond"],
      mapStats: {},
      coins: 0,
      totalNearMisses: 0,
      dailyAttempts: 0,
      lastDailyAttemptDate: new Date().toISOString().split("T")[0],
      claimedAchievementIds: [],
    });

    set({ profile: newProfile });

    api.syncUser(newProfile)
      .then((res) => {
        if (res.success && res.data) set({ profile: normalizeProfile(res.data) });
      })
      .catch(console.error);
  },

  updateProfile: (updates) => {
    set((state) => {
      if (!state.profile) return {};
      const updated = normalizeProfile({ ...state.profile, ...updates });

      api.syncUser(updated)
        .then((res) => {
          if (res.success && res.data) {
            set((s) => (s.profile ? { profile: normalizeProfile(res.data) } : {}));
          }
        })
        .catch(console.error);

      return { profile: updated };
    });
  },

  // (your updateStats stays as-is — it already assumes mapStats exists, but now it will)
  updateStats: (stats) => {
    set((state) => {
      if (!state.profile) return {};

      // Ensure profile is normalized before any math/access
      const profile = normalizeProfile(state.profile);

      const gameMode = state.gameMode;
      const isNormalMode = gameMode === "normal";
      const score = stats.score;

      const newGamesPlayed = profile.gamesPlayed + 1;
      const newTotalTime = profile.totalTimeSurvived + score;
      const newTotalNearMisses = (profile.totalNearMisses || 0) + stats.nearMisses;

      const coinsEarned = 5 + Math.floor(score / 10000) * 5;
      const newCoins = (profile.coins || 0) + coinsEarned;

      let newBestTime = profile.bestTime;
      let updatedMapStats = { ...(profile.mapStats || {}) };
      let currentMapUnlocks = new Set(profile.unlockedMapIds || []);
      let newlyUnlocked: string[] = [];
      let newTotalAccumulatedSurvivalTime = profile.totalAccumulatedSurvivalTime || 0;

      let baseSurvivalTime = 0;
      let multiplier = 1.0;
      let adjustedSurvivalTime = 0;

      const currentMapStats = (profile.mapStats || {})[stats.biome] || {
        bestTime: 0,
        gamesPlayed: 0,
        totalTimeSurvived: 0,
      };

      if (isNormalMode) {
        newBestTime = Math.max(profile.bestTime, score);

        updatedMapStats[stats.biome] = {
          bestTime: Math.max(currentMapStats.bestTime, score),
          gamesPlayed: currentMapStats.gamesPlayed + 1,
          totalTimeSurvived: currentMapStats.totalTimeSurvived + score,
          totalExplosions: (currentMapStats.totalExplosions || 0) + (stats.explosionsTriggered || 0),
          mostNearMisses: Math.max(currentMapStats.mostNearMisses || 0, stats.nearMisses),
          mostShowerPushes: Math.max(currentMapStats.mostShowerPushes || 0, stats.showerPushes || 0),
          mostWrenchDodges: Math.max(currentMapStats.mostWrenchDodges || 0, stats.wrenchDodges || 0),
          mostBallsPocketed: Math.max(currentMapStats.mostBallsPocketed || 0, stats.ballsPocketed || 0),
        };

        baseSurvivalTime = Math.max(0, score - GAME_CONSTANTS.GRACE_PERIOD);
        const currentMap = MAPS.find((m) => m.id === stats.biome);
        multiplier = currentMap?.progressMultiplier || 1.0;
        adjustedSurvivalTime = Math.floor(baseSurvivalTime * multiplier);
        newTotalAccumulatedSurvivalTime += adjustedSurvivalTime;

        for (const map of MAPS) {
          if (map.isSeasonal) continue;
          if (currentMapUnlocks.has(map.id)) continue;
          if (newTotalAccumulatedSurvivalTime >= map.totalSurvivalTimeRequired) {
            currentMapUnlocks.add(map.id);
            newlyUnlocked.push(map.id);
            if (map.id === "gym" && !(profile.unlockedSkinIds || []).includes("lafleur")) {
              newlyUnlocked.push("lafleur");
            }
          }
        }

        const standardMaps = MAPS.filter((m) => !m.isSeasonal);
        const currentMapIndex = standardMaps.findIndex((m) => m.id === stats.biome);
        if (currentMapIndex !== -1 && currentMapIndex < standardMaps.length - 1) {
          const nextMap = standardMaps[currentMapIndex + 1];
          if (nextMap.bestTimeRequired && score >= nextMap.bestTimeRequired) {
            if (!currentMapUnlocks.has(nextMap.id)) {
              currentMapUnlocks.add(nextMap.id);
              newlyUnlocked.push(nextMap.id);
              if (nextMap.id === "gym" && !(profile.unlockedSkinIds || []).includes("lafleur")) {
                newlyUnlocked.push("lafleur");
              }
            }
          }
        }
      }

      const currentUnlocks = new Set(profile.unlockedSkinIds || []);

      Object.entries(UNLOCK_THRESHOLDS).forEach(([skinId, condition]) => {
        if (currentUnlocks.has(skinId)) return;
        let met = false;
        if (condition.type === "games" && newGamesPlayed >= condition.value) met = true;
        if (condition.type === "score" && score >= condition.value) met = true;
        if (condition.type === "total_time" && newTotalTime >= condition.value) met = true;
        if (met) {
          newlyUnlocked.push(skinId);
          currentUnlocks.add(skinId);
        }
      });

      if (newlyUnlocked.includes("lafleur")) currentUnlocks.add("lafleur");

      if (isNormalMode) {
        const standardMaps = MAPS.filter((m) => !m.isSeasonal);
        const allStandardUnlocked = standardMaps.every((m) => currentMapUnlocks.has(m.id));
        if (allStandardUnlocked && !currentUnlocks.has("mother_ducker")) {
          newlyUnlocked.push("mother_ducker");
          currentUnlocks.add("mother_ducker");
        }
      }

      const updatedProfile = normalizeProfile({
        ...profile,
        gamesPlayed: newGamesPlayed,
        totalTimeSurvived: newTotalTime,
        totalAccumulatedSurvivalTime: newTotalAccumulatedSurvivalTime,
        bestTime: newBestTime,
        lastSeenAt: Date.now(),
        unlockedSkinIds: Array.from(currentUnlocks),
        unlockedMapIds: Array.from(currentMapUnlocks),
        totalNearMisses: newTotalNearMisses,
        coins: newCoins,
        mapStats: updatedMapStats,
      });

      api.submitScoreWithRetry({
        userId: updatedProfile.playerId,
        mapId: stats.biome,
        scoreMs: score,
        displayName: updatedProfile.displayName,
        skinId: updatedProfile.equippedSkinId,
        mode: gameMode,
      }).then((response) => {
        if (response && response.success) {
          set({ leaderboardData: [] });
        }
      }).catch(console.error);

      api.syncUser(updatedProfile)
        .then((res) => {
          if (res.success && res.data) {
            set((s) => (s.profile ? { profile: normalizeProfile(res.data) } : {}));
          }
        })
        .catch(console.error);

      if (state.activeChallengeId) get().completeChallenge(score);

      const isNewRecord = isNormalMode && score > (currentMapStats.bestTime || 0);

      return {
        lastRunStats: {
          ...stats,
          coinsEarned,
          isNewRecord,
          baseSurvivalTime,
          multiplier,
          adjustedSurvivalTime,
        },
        profile: updatedProfile,
        newUnlocks: [...state.newUnlocks, ...newlyUnlocked],
      };
    });
  },

  equipSkin: (skinId) =>
    set((state) => {
      if (!state.profile) return {};
      const updated = normalizeProfile({ ...state.profile, equippedSkinId: skinId });
      api.syncUser(updated).catch(console.error);
      return { profile: updated };
    }),

  unlockSkin: (skinId) =>
    set((state) => {
      if (!state.profile) return {};
      const profile = normalizeProfile(state.profile);
      if ((profile.unlockedSkinIds || []).includes(skinId)) return {};

      const updatedProfile = normalizeProfile({
        ...profile,
        unlockedSkinIds: [...(profile.unlockedSkinIds || []), skinId],
      });

      api.syncUser(updatedProfile).catch(console.error);

      ACHIEVEMENTS.forEach((ach) => {
        if (ach.conditionType === "has_skin" && ach.targetId === skinId) {
          toast.success(`Achievement Unlocked: ${ach.title}!`, {
            description: ach.description,
            icon: "🏆",
          });
          soundSynth.playUnlock();
        }
      });

      return { profile: updatedProfile, newUnlocks: [...state.newUnlocks, skinId] };
    }),

  // ... keep the rest of your file the same, but update *every* place you do:
  // set({ profile: res.data })  -> set({ profile: normalizeProfile(res.data) })
  // and same for syncUser response merges.

  handleAuthCallback: async (params: URLSearchParams) => {
    const userId = params.get("userId");
    const name = params.get("name");
    const provider = params.get("provider");
    if (!userId) return;

    const toastId = toast.loading("Syncing Profile...");
    try {
      const { success, data: restoredProfile } = await api.getUser(userId);

      if (success && restoredProfile) {
        const normalized = normalizeProfile(restoredProfile);
        const cloudGhost = normalized.bestRunGhost || null;
        set({ profile: normalized, pbGhost: cloudGhost });
        toast.dismiss(toastId);
        toast.success(`Welcome back, ${normalized.displayName}!`);
      } else {
        const newProfile = normalizeProfile({
          playerId: userId,
          displayName: name || "Player",
          authProvider: (provider as any) || "google",
          unlockedSkinIds: ["default"],
          unlockedMapIds: ["pond"],
          mapStats: {},
          claimedAchievementIds: [],
        });

        set({ profile: newProfile });
        toast.dismiss(toastId);
        toast.success(`Welcome, ${name}!`);
      }

      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      set({ leaderboardData: [], userRank: null });
    } catch (error) {
      console.error("Auth Callback Error:", error);
      toast.dismiss(toastId);
      toast.error("Failed to restore profile.");
    }
  },
});
