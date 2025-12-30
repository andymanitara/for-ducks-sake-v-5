import { GameSliceCreator } from './types';
import { api } from '@/lib/api';
export const createGameSlice: GameSliceCreator = (set, get) => ({
  status: 'menu',
  score: 0,
  biome: 'pond',
  previousBiome: null,
  gameMode: 'normal',
  lastRunStats: null,
  lastSeed: null,
  pendingSeed: null,
  replayState: 'idle',
  replayVideo: null,
  replayViewMode: 'default',
  shareRequested: false,
  serverResetToken: null,
  setStatus: (status) => set((state) => {
    // Clean up challenge/mode state when returning to menu
    if (status === 'menu') {
        let biomeToRestore = state.biome;
        // If returning from a daily challenge, restore the previous biome
        if (state.gameMode === 'daily' && state.previousBiome) {
            biomeToRestore = state.previousBiome;
        }
        return {
            status,
            gameMode: 'normal',
            challengeTarget: null,
            activeChallengeId: null,
            pendingSeed: null,
            activeOpponentGhost: null,
            opponentName: null,
            biome: biomeToRestore,
            previousBiome: null // Reset previous biome
        };
    }
    return { status };
  }),
  setScore: (score) => set({ score }),
  setBiome: (biome) => set({ biome }),
  togglePause: () => set((state) => {
    if (state.status === 'playing') return { status: 'paused' };
    if (state.status === 'paused') return { status: 'playing' };
    return {};
  }),
  resetGame: () => set({
    score: 0,
    status: 'playing',
    replayState: 'idle',
    replayVideo: null,
    replayViewMode: 'default',
    shareRequested: false
  }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setLastSeed: (seed) => set({ lastSeed: seed }),
  setPendingSeed: (seed) => set({ pendingSeed: seed }),
  startReplayGeneration: () => set({ replayState: 'generating', replayVideo: null }),
  finishReplayGeneration: (blob) => set({ replayState: 'ready', replayVideo: blob }),
  resetReplayState: () => set({ replayState: 'idle', replayVideo: null, shareRequested: false }),
  setReplayViewMode: (mode) => set({ replayViewMode: mode }),
  setShareRequested: (requested) => set({ shareRequested: requested }),
  checkServerReset: async () => {
      try {
          const res = await api.checkStatus();
          if (res.success && res.data.resetToken) {
              const serverToken = res.data.resetToken;
              const localToken = get().serverResetToken;
              // If we have a local token and it mismatches -> WIPE
              if (localToken && localToken !== serverToken) {
                  console.warn('[RESET] Server reset detected. Wiping local data.');
                  localStorage.removeItem('duck-dodger-storage-v2');
                  window.location.reload();
                  return;
              }
              // If we DON'T have a local token (Legacy or Fresh), we adopt the server token.
              if (localToken !== serverToken) {
                  set({ serverResetToken: serverToken });
              }
          }
      } catch (e) {
          console.error("Failed to check server reset status", e);
      }
  },
  restoreGameState: () => set((state) => {
    // If we are on the menu but in 'daily' mode with a previous biome saved,
    // it means we reloaded during or after a daily challenge.
    // We should revert to normal mode and the previous biome.
    if (state.status === 'menu' && state.gameMode === 'daily' && state.previousBiome) {
        return {
            gameMode: 'normal',
            biome: state.previousBiome,
            previousBiome: null
        };
    }
    return {};
  }),
});