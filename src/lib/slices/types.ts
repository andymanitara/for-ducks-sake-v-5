import { StateCreator } from 'zustand';
import { LeaderboardCategory, PlayerProfile, BiomeType, RunStats, LeaderboardEntry, Friend, FriendRequest, Challenge, Reward } from '@/types/game';
// --- Slice Interfaces ---
export interface GameSlice {
  status: 'menu' | 'playing' | 'paused' | 'game_over';
  score: number;
  biome: BiomeType;
  previousBiome: BiomeType | null; // Stores the user's selected map before entering a daily challenge
  gameMode: 'normal' | 'daily' | 'challenge';
  lastRunStats: RunStats | null;
  lastSeed: string | null;
  pendingSeed: string | null;
  // Replay System
  replayState: 'idle' | 'generating' | 'ready';
  replayVideo: Blob | null;
  replayViewMode: 'default' | 'fullscreen';
  shareRequested: boolean;
  // Server Reset Logic
  serverResetToken: string | null;
  // Actions
  setStatus: (status: 'menu' | 'playing' | 'paused' | 'game_over') => void;
  setScore: (score: number) => void;
  setBiome: (biome: BiomeType) => void;
  togglePause: () => void;
  resetGame: () => void;
  setGameMode: (mode: 'normal' | 'daily' | 'challenge') => void;
  setLastSeed: (seed: string) => void;
  setPendingSeed: (seed: string | null) => void;
  startReplayGeneration: () => void;
  finishReplayGeneration: (blob: Blob) => void;
  resetReplayState: () => void;
  setReplayViewMode: (mode: 'default' | 'fullscreen') => void;
  setShareRequested: (requested: boolean) => void;
  checkServerReset: () => Promise<void>;
  restoreGameState: () => void;
}
export interface SettingsSlice {
  isAudioEnabled: boolean;
  volume: number; // 0 to 1
  isHapticsEnabled: boolean;
  isReducedMotion: boolean;
  isGhostEnabled: boolean;
  isBatterySaver: boolean;
  joystickMode: 'dynamic' | 'static';
  joystickOpacity: number;
  showFps: boolean;
  // Actions
  toggleAudio: () => void;
  setVolume: (volume: number) => void;
  toggleHaptics: () => void;
  toggleReducedMotion: () => void;
  toggleGhost: () => void;
  toggleBatterySaver: () => void;
  toggleJoystickMode: () => void;
  setJoystickOpacity: (opacity: number) => void;
  toggleFps: () => void;
  resetSettings: () => void;
}
export interface SocialSlice {
  friends: Friend[];
  friendRequests: FriendRequest[];
  isLoadingFriends: boolean;
  showFriendsModal: boolean;
  challenges: Challenge[];
  showChallengeModal: boolean;
  activeChallengeId: string | null;
  challengeTarget: number | null;
  leaderboardData: LeaderboardEntry[];
  userRank: { rank: number; score: number; userId: string; mapId: string; category: LeaderboardCategory } | null;
  isLoadingLeaderboard: boolean;
  leaderboardError: string | null;
  activeLeaderboardTab: LeaderboardCategory;
  pbGhost: string | null;
  activeOpponentGhost: string | null;
  opponentName: string | null;
  storageMode: 'loading' | 'kv' | 'mock';
  pendingReward: Reward | null;
  // Actions
  fetchFriends: () => Promise<void>;
  sendFriendRequest: (code: string) => Promise<void>;
  respondToFriendRequest: (requestId: string, action: 'accept' | 'reject') => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  raceFriend: (friend: Friend) => Promise<void>;
  clearOpponent: () => void;
  setShowFriendsModal: (open: boolean) => void;
  checkNotifications: () => Promise<void>;
  fetchChallenges: () => Promise<void>;
  sendChallenge: (friendId: string) => Promise<void>;
  sendChallenges: (friendIds: string[]) => Promise<void>;
  acceptChallenge: (challenge: Challenge) => void;
  completeChallenge: (score: number) => Promise<void>;
  setShowChallengeModal: (open: boolean) => void;
  fetchLeaderboard: (mapId: string, type: 'global' | 'daily') => Promise<void>;
  setLeaderboardTab: (tab: LeaderboardCategory) => void;
  setPbGhost: (ghost: string) => void;
  checkBackendStatus: () => Promise<void>;
  claimReward: () => Promise<void>;
}
export interface ProfileSlice {
  profile: PlayerProfile | null;
  newUnlocks: string[];
  viewingProfile: PlayerProfile | null;
  isViewingProfileOpen: boolean;
  // Actions
  createProfile: (displayName: string, id?: string) => void;
  updateProfile: (updates: Partial<PlayerProfile>) => void;
  updateStats: (stats: RunStats) => void;
  equipSkin: (skinId: string) => void;
  unlockSkin: (skinId: string) => void;
  purchaseSkin: (skinId: string) => void;
  resetProfile: () => void;
  clearNewUnlocks: () => void;
  loginWithProvider: (provider: 'google' | 'apple') => Promise<void>;
  handleAuthCallback: (params: URLSearchParams) => Promise<void>;
  logout: () => void;
  viewUserProfile: (userId: string) => Promise<void>;
  closeUserProfile: () => void;
  checkDailyReset: () => void;
  startDailyChallenge: () => void;
  claimAchievement: (achievementId: string) => void;
  claimAllAchievements: () => void;
}
// --- Combined State ---
export type GameState = GameSlice & SettingsSlice & SocialSlice & ProfileSlice;
export type GameSliceCreator = StateCreator<GameState, [], [], GameSlice>;
export type SettingsSliceCreator = StateCreator<GameState, [], [], SettingsSlice>;
export type SocialSliceCreator = StateCreator<GameState, [], [], SocialSlice>;
export type ProfileSliceCreator = StateCreator<GameState, [], [], ProfileSlice>;