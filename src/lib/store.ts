import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { GameState } from "./slices/types";
import { createGameSlice } from "./slices/gameSlice";
import { createSettingsSlice } from "./slices/settingsSlice";
import { createSocialSlice } from "./slices/socialSlice";
import { createProfileSlice } from "./slices/profileSlice";

export * from "./slices/types";

function migratePersistedState(persisted: any): any {
  // Zustand persist wraps your state under the same shape you save in partialize,
  // but depending on version / tooling it might already be the plain object.
  const state = persisted?.state ?? persisted ?? {};

  const profile = state.profile;
  if (profile && typeof profile === "object") {
    // Patch missing fields from older saves
    if (!profile.mapStats || typeof profile.mapStats !== "object") profile.mapStats = {};
    if (!Array.isArray(profile.unlockedMapIds)) profile.unlockedMapIds = ["pond"];
    if (!Array.isArray(profile.unlockedSkinIds)) profile.unlockedSkinIds = ["default"];
    if (!Array.isArray(profile.claimedAchievementIds)) profile.claimedAchievementIds = [];
    if (typeof profile.coins !== "number") profile.coins = 0;
    if (typeof profile.totalNearMisses !== "number") profile.totalNearMisses = 0;

    // Your newer schema includes this:
    if (typeof profile.totalAccumulatedSurvivalTime !== "number") {
      profile.totalAccumulatedSurvivalTime = 0;
    }
  }

  // Return in the same format Zustand expects for migrate:
  // If persisted has { state, version }, return { state, version }
  if (persisted && typeof persisted === "object" && "state" in persisted) {
    return { ...persisted, state: { ...state, profile } };
  }
  return { ...state, profile };
}

export const useGameStore = create<GameState>()(
  persist(
    (...a) => ({
      ...createGameSlice(...a),
      ...createSettingsSlice(...a),
      ...createSocialSlice(...a),
      ...createProfileSlice(...a),
    }),
    {
      name: "duck-dodger-storage-v2",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => migratePersistedState(persistedState),

      partialize: (state) => ({
        profile: state.profile,
        isAudioEnabled: state.isAudioEnabled,
        volume: state.volume,
        isHapticsEnabled: state.isHapticsEnabled,
        isReducedMotion: state.isReducedMotion,
        isGhostEnabled: state.isGhostEnabled,
        isBatterySaver: state.isBatterySaver,
        joystickMode: state.joystickMode,
        joystickOpacity: state.joystickOpacity,
        showFps: state.showFps,
        pbGhost: state.pbGhost,
        biome: state.biome,
        activeChallengeId: state.activeChallengeId,
        challengeTarget: state.challengeTarget,
        gameMode: state.gameMode,
        previousBiome: state.previousBiome,
      }),
    }
  )
);
