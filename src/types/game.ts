export interface Vector2D {
  x: number;
  y: number;
}
export interface Entity {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  radius: number; // Used for circle collision
  color: string;
  type: 'duck' | 'hazard' | 'particle';
}
export type AccessoryType = 'none' | 'headband' | 'tophat' | 'sunglasses' | 'helmet' | 'headband_striped' | 'cap_cigar' | 'knight' | 'vest_crazy' | 'headband_simple' | 'visor' | 'flames';
export interface Skin {
  id: string;
  name: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  accessory: AccessoryType;
  description?: string;
  cost?: number; // Cost in coins for shop items
  trailType?: 'standard' | 'smoke' | 'sparkle' | 'snow' | 'binary' | 'bubble' | 'leaf' | 'fire' | 'dust' | 'lafleur_trail';
}
export interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
  width: number;
}
export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // seconds
  maxLife: number;
  velocity: Vector2D;
  scale: number;
  rotation: number;
  rotationSpeed: number;
}
export interface Duck extends Entity {
  type: 'duck';
  state: 'idle' | 'moving' | 'dead';
  rotation: number;
  wobble: number; // Animation state (0-2PI)
  skinId: string;
  trail: TrailPoint[];
  // New Visual Props
  blinkTimer: number;
  scale: Vector2D; // For squash and stretch
  panicLevel: number; // 0 to 1, based on hazard proximity
  faceDirection: number; // Angle in radians
}
export interface Hazard extends Entity {
  type: 'hazard';
  hazardType: 'rock' | 'icicle' | 'drone' | 'log' | 'frog' | 'snowball' | 'frisbee' | 'laser' | 'glitch_square' | 'pixel_orb' | 'gift' | 'ornament' | 'candy_cane' | 'dodgeball' | 'wrench' | 'spanner' | 'soap_bubble' | 'shampoo_bottle' | 'shower_jet' | 'pool_ball_white' | 'pool_ball_red' | 'pool_ball_yellow' | 'pocket' | 'explosion';
  shape: 'circle' | 'rectangle' | 'line';
  width: number;  // For rectangles
  height: number; // For rectangles
  rotation: number;
  // New Visual Props
  spawnTimer: number; // 0 to 1 (fade in progress)
  wobbleOffset: number; // Random offset for visual variation
  // AI Props
  aiState?: 'idle' | 'charge' | 'jump' | 'track' | 'warning' | 'active' | 'leave' | 'dead';
  aiTimer?: number;
  target?: Vector2D;
  laserEndpoints?: { start: Vector2D, end: Vector2D };
  // Bouncing Physics
  bounces?: number;
  maxBounces?: number;
  // Gameplay Events
  hasTriggeredCloseCall?: boolean;
  hasPushedPlayer?: boolean; // New: Track if shower jet has pushed player
}
export type ParticleType = 'dust' | 'feather' | 'sparkle' | 'leaf' | 'snow' | 'glitch' | 'binary' | 'pixel' | 'sweat' | 'feather_death' | 'bubble' | 'bubble_pop' | 'fire' | 'smoke' | 'lafleur_trail';
export interface Particle extends Entity {
  type: 'particle';
  particleType: ParticleType;
  life: number; // 0 to 1 (1 is full life)
  maxLife: number; // in seconds
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  scale: number;
  text?: string; // For binary particles
  // Physics & Visuals for Feathers
  wobble?: number;
  wobbleSpeed?: number;
  gravity?: number;
  drag?: number;
  colorSecondary?: string;
}
export interface ScreenShake {
  x: number;
  y: number;
  intensity: number;
  duration: number;
  startTime: number;
}
export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  active: boolean;
  color?: string;
}
export interface GameConfig {
  width: number;
  height: number;
  biomes: BiomeType[];
}
export type BiomeType = 'pond' | 'glacier' | 'city' | 'glitch' | 'christmas' | 'gym' | 'bathtub' | 'billiards';
export interface InputState {
  active: boolean;
  origin: Vector2D;
  current: Vector2D;
  vector: Vector2D; // Normalized -1 to 1
}
export type LeaderboardCategory = 'daily' | 'global' | 'seasonal' | 'daily_challenge';
export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  skinId: string;
  userId: string; // Added to match backend response
  date?: number;  // Added timestamp from backend
}
// Replay System Types
export interface ReplayFrame {
  x: number;
  y: number;
  rotation: number;
  scale: Vector2D;
  skinId: string;
  timestamp: number;
  faceDirection: number;
  hazards?: Hazard[]; // Optional snapshot of all hazards for full replay
  internalMode?: 'playing' | 'dying' | 'replay';
  dyingTimer?: number;
  state?: 'idle' | 'moving' | 'dead';
  vx?: number; // Velocity X for trail reconstruction
  vy?: number; // Velocity Y for trail reconstruction
}
export type GhostData = ReplayFrame[];
// Map Statistics
export interface MapStats {
  bestTime: number;
  gamesPlayed: number;
  totalTimeSurvived: number;
  totalExplosions?: number; // Track explosions triggered on this map
  mostNearMisses?: number; // Track highest near misses in a single run on this map
  mostShowerPushes?: number; // New: Track most shower pushes in a single run
  mostWrenchDodges?: number; // New: Track most wrench dodges in a single run
  mostBallsPocketed?: number; // New: Track most balls pocketed in a single run
}
// Profile System
export interface PlayerProfile {
  playerId: string;
  displayName: string;
  createdAt: number;
  lastSeenAt: number;
  bestTime: number; // ms (Global best)
  gamesPlayed: number;
  totalTimeSurvived: number; // ms (Raw total play time)
  totalAccumulatedSurvivalTime: number; // ms (Weighted progression time)
  equippedSkinId: string;
  unlockedSkinIds: string[];
  unlockedMapIds: string[];
  // New Stats
  totalNearMisses: number;
  // Currency
  coins: number;
  // Per-Map Stats
  mapStats: Record<string, MapStats>;
  // Auth
  authProvider: 'guest' | 'google' | 'apple';
  email?: string;
  // Social
  friendCode?: string;
  bestRunGhost?: string; // Stringified GhostData
  // Daily Challenge
  dailyAttempts: number;
  lastDailyAttemptDate: string; // ISO Date string (YYYY-MM-DD)
  claimedRewardDates?: string[]; // Array of dates (YYYY-MM-DD) for which rewards have been claimed
  // Achievements
  claimedAchievementIds: string[]; // IDs of achievements where reward has been claimed
}
// Social System
export interface Friend {
  id: string;
  displayName: string;
  skinId: string;
  bestTime: number;
  friendCode: string;
}
export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserSkin: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
}
export interface Reward {
  id: string;
  date: string; // YYYY-MM-DD
  rank: number;
  coins: number;
  mapName: string;
  status: 'pending' | 'claimed';
}
export interface FriendSystemState {
  friends: Friend[];
  requests: FriendRequest[];
  isLoading: boolean;
}
// Challenge System
export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'completed';
export interface Challenge {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserSkin: string;
  toUserId: string;
  toUserName?: string; // Name of the recipient
  mapId?: string; // The biome map ID
  seed: string;
  status: ChallengeStatus;
  challengerScore: number;
  targetScore?: number; // The score the receiver got
  timestamp: number;
  winnerId?: string;
}
// Run Statistics
export interface RunStats {
  score: number;
  nearMisses: number;
  topSpeed: number;
  biome: BiomeType;
  killerHazardType?: string; // The hazard that caused the game over
  isNewRecord?: boolean; // Flag to indicate if this run was a new personal best for the map
  coinsEarned?: number; // Added for Game Over screen
  explosionsTriggered?: number; // Track explosions in this run
  showerPushes?: number; // New: Track shower pushes in this run
  wrenchDodges?: number; // New: Track wrench dodges in this run
  ballsPocketed?: number; // New: Track balls pocketed in this run
  // Progression Feedback
  baseSurvivalTime?: number;
  multiplier?: number;
  adjustedSurvivalTime?: number;
}
// Achievement System
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name or custom identifier
  rewardSkinId?: string;
  conditionType: 'score' | 'games' | 'total_time' | 'special' | 'total_near_misses' | 'unlocked_maps' | 'unlocked_skins' | 'coins' | 'has_skin' | 'map_explosions' | 'run_near_misses' | 'run_shower_pushes' | 'run_wrench_dodges' | 'run_balls_pocketed';
  conditionValue: number;
  targetId?: string; // ID of the item required (e.g. skinId) for has_skin condition
  mapId?: BiomeType; // Optional: If set, condition applies to this map's stats only
  rewardCoins?: number; // Optional: Coins awarded when claimed
}
// Map System
export interface GameMap {
  id: BiomeType;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  colorTheme: string;
  thumbnailColor: string;
  // Progression
  totalSurvivalTimeRequired: number; // Total accumulated weighted time to unlock (ms)
  progressMultiplier: number; // Multiplier for time earned on this map
  bestTimeRequired?: number; // Single run time required in PREVIOUS map to unlock this one (ms)
  isSeasonal?: boolean;
  seasonalDeadline?: string;
}
// Difficulty Configuration
export interface DifficultyConfig {
  spawnRateInitial: number;
  spawnRateDecay: number;
  hazardSpeedMultiplier: number;
  hazardSpawnCap: number;
  patternDelayMultiplier: number;
}
// Barrage State for Renderer
export interface BarrageState {
  state: 'idle' | 'warning' | 'active';
  direction: number; // 0: Top, 1: Right, 2: Bottom, 3: Left
  progress: number; // 0 to 1 (0 = start, 1 = finish)
  timeLeft: number; // ms remaining in current state
}