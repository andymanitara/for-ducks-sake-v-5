import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState } from './slices/types';
import { createGameSlice } from './slices/gameSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createSocialSlice } from './slices/socialSlice';
import { createProfileSlice } from './slices/profileSlice';
export * from './slices/types';
export const useGameStore = create<GameState>()(
  persist(
    (...a) => ({
      ...createGameSlice(...a),
      ...createSettingsSlice(...a),
      ...createSocialSlice(...a),
      ...createProfileSlice(...a),
    }),
    {
      name: 'duck-dodger-storage-v2',
      storage: createJSONStorage(() => localStorage),
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