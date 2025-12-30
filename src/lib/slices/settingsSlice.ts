import { SettingsSliceCreator } from './types';
import { DEFAULT_SETTINGS } from '@/game/constants';
export const createSettingsSlice: SettingsSliceCreator = (set) => ({
  isAudioEnabled: true,
  volume: 0.5,
  isHapticsEnabled: true,
  isReducedMotion: false,
  isGhostEnabled: true,
  isBatterySaver: false,
  joystickMode: 'dynamic',
  joystickOpacity: 0.5,
  showFps: false,
  toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),
  setVolume: (volume) => set({ volume }),
  toggleHaptics: () => set((state) => ({ isHapticsEnabled: !state.isHapticsEnabled })),
  toggleReducedMotion: () => set((state) => ({ isReducedMotion: !state.isReducedMotion })),
  toggleGhost: () => set((state) => ({ isGhostEnabled: !state.isGhostEnabled })),
  toggleBatterySaver: () => set((state) => ({ isBatterySaver: !state.isBatterySaver })),
  toggleJoystickMode: () => set((state) => ({ joystickMode: state.joystickMode === 'dynamic' ? 'static' : 'dynamic' })),
  setJoystickOpacity: (opacity) => set({ joystickOpacity: opacity }),
  toggleFps: () => set((state) => ({ showFps: !state.showFps })),
  resetSettings: () => set({
      isAudioEnabled: DEFAULT_SETTINGS.isAudioEnabled,
      volume: DEFAULT_SETTINGS.volume,
      isHapticsEnabled: DEFAULT_SETTINGS.isHapticsEnabled,
      isReducedMotion: DEFAULT_SETTINGS.isReducedMotion,
      isGhostEnabled: DEFAULT_SETTINGS.isGhostEnabled,
      isBatterySaver: DEFAULT_SETTINGS.isBatterySaver,
      joystickMode: DEFAULT_SETTINGS.joystickMode,
      joystickOpacity: DEFAULT_SETTINGS.joystickOpacity,
      showFps: DEFAULT_SETTINGS.showFps
  }),
});