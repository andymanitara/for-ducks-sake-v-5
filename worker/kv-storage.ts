import type { KVNamespace } from '@cloudflare/workers-types';
/**
 * ARCHITECTURE: HYBRID STORAGE STRATEGY (MOCK vs REAL)
 */
export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  skinId: string;
  userId: string;
  date: number;
}
export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserSkin: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
}
export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'completed';
export interface Challenge {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserSkin: string;
  toUserId: string;
  toUserName?: string;
  mapId?: string;
  seed: string;
  status: ChallengeStatus;
  challengerScore: number;
  targetScore?: number;
  timestamp: number;
  winnerId?: string;
}
export interface UserProfile {
  id: string;
  displayName: string;
  avatarSkinId: string;
  createdAt: number;
  updatedAt: number;
  authProvider?: string;
  email?: string;
  // Stats & Progress
  bestTime: number;
  gamesPlayed: number;
  totalTimeSurvived: number;
  totalAccumulatedSurvivalTime?: number;
  unlockedSkinIds: string[];
  unlockedMapIds: string[];
  totalNearMisses: number;
  coins?: number;
  // Per-Map Stats
  mapStats?: Record<string, {
      bestTime: number;
      gamesPlayed: number;
      totalTimeSurvived: number;
      totalExplosions?: number;
      mostNearMisses?: number;
      mostShowerPushes?: number;
      mostWrenchDodges?: number;
      mostBallsPocketed?: number;
  }>;
  // Social
  friendCode?: string;
  friends?: string[]; // Array of user IDs
  friendRequests?: FriendRequest[];
  bestRunGhost?: string; // Stringified replay data
  // Daily Challenge
  dailyAttempts?: number;
  lastDailyAttemptDate?: string;
  claimedRewardDates?: string[]; // Array of dates (YYYY-MM-DD)
  // Achievements
  claimedAchievementIds?: string[];
  // Challenge Completion
  completedChallengeIds?: string[];
}
export interface Reward {
  id: string;
  date: string;
  rank: number;
  coins: number;
  mapName: string;
  status: 'pending' | 'claimed';
}
// Constants duplicated from frontend for deterministic logic
const MAP_IDS = ['pond', 'glacier', 'bathtub', 'city', 'gym', 'billiards', 'glitch', 'christmas'];
const MOCK_RESET_TOKEN = 'mock-dev-environment-token-v1';
// Mulberry32 RNG (Duplicated from src/lib/rng.ts)
function createRNG(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  let state = h >>> 0;
  return function() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function getDailyMapId(dateString: string): string {
  const rng = createRNG(dateString);
  const randomIndex = Math.floor(rng() * MAP_IDS.length);
  return MAP_IDS[randomIndex];
}
// Robust Mock Data - Expanded for better UI testing
const MOCK_LEADERBOARD_GLOBAL: LeaderboardEntry[] = [
    { rank: 1, userId: 'mock1', name: 'SpeedyDuck99', score: 125430, skinId: 'astro', date: Date.now() },
    { rank: 2, userId: 'mock2', name: 'QuackMaster', score: 98210, skinId: 'ninja', date: Date.now() - 3600000 },
    { rank: 3, userId: 'mock3', name: 'PondKing', score: 85100, skinId: 'gentleman', date: Date.now() - 7200000 },
    { rank: 4, userId: 'mock4', name: 'FeatherFury', score: 72050, skinId: 'pinky', date: Date.now() - 10800000 },
    { rank: 5, userId: 'mock5', name: 'WaddleOn', score: 65000, skinId: 'default', date: Date.now() - 14400000 },
    { rank: 6, userId: 'mock6', name: 'LuckyDuck', score: 54320, skinId: 'cool', date: Date.now() - 18000000 },
    { rank: 7, userId: 'mock7', name: 'SirQuacks', score: 43210, skinId: 'lafleur', date: Date.now() - 21600000 },
    { rank: 8, userId: 'mock8', name: 'DuckNorris', score: 32100, skinId: 'ninja', date: Date.now() - 25200000 },
    { rank: 9, userId: 'mock9', name: 'QuackSparrow', score: 21000, skinId: 'gentleman', date: Date.now() - 28800000 },
    { rank: 10, userId: 'mock10', name: 'DuckVader', score: 15000, skinId: 'astro', date: Date.now() - 32400000 },
    { rank: 11, userId: 'mock11', name: 'PuddleJumper', score: 12500, skinId: 'default', date: Date.now() - 36000000 },
    { rank: 12, userId: 'mock12', name: 'BillNye', score: 10000, skinId: 'cool', date: Date.now() - 40000000 },
    { rank: 13, userId: 'mock13', name: 'Eggcellent', score: 8500, skinId: 'pinky', date: Date.now() - 44000000 },
    { rank: 14, userId: 'mock14', name: 'QuackAttack', score: 7000, skinId: 'default', date: Date.now() - 48000000 },
    { rank: 15, userId: 'mock15', name: 'JustADuck', score: 5000, skinId: 'default', date: Date.now() - 52000000 },
];
const MOCK_LEADERBOARD_DAILY: LeaderboardEntry[] = [
    { rank: 1, userId: 'mockD1', name: 'DailyGrinder', score: 45000, skinId: 'ninja', date: Date.now() - 1800000 },
    { rank: 2, userId: 'mockD2', name: 'EarlyBird', score: 42100, skinId: 'default', date: Date.now() - 3600000 },
    { rank: 3, userId: 'mockD3', name: 'JustWokeUp', score: 38500, skinId: 'pinky', date: Date.now() - 5400000 },
    { rank: 4, userId: 'mockD4', name: 'CoffeeDuck', score: 35000, skinId: 'cool', date: Date.now() - 7200000 },
    { rank: 5, userId: 'mockD5', name: 'SunriseSurfer', score: 31000, skinId: 'lafleur', date: Date.now() - 9000000 },
    { rank: 6, userId: 'mockD6', name: 'MorningGlory', score: 28000, skinId: 'gentleman', date: Date.now() - 10800000 },
    { rank: 7, userId: 'mockD7', name: 'BreakfastClub', score: 25000, skinId: 'astro', date: Date.now() - 12600000 },
    { rank: 8, userId: 'mockD8', name: 'DawnPatrol', score: 22000, skinId: 'ninja', date: Date.now() - 14400000 },
    { rank: 9, userId: 'mockD9', name: 'NoonRider', score: 19000, skinId: 'cool', date: Date.now() - 16200000 },
    { rank: 10, userId: 'mockD10', name: 'LunchBreak', score: 16000, skinId: 'default', date: Date.now() - 18000000 },
    { rank: 11, userId: 'mockD11', name: 'AfternoonTea', score: 13000, skinId: 'pinky', date: Date.now() - 19800000 },
    { rank: 12, userId: 'mockD12', name: 'SunsetChaser', score: 10000, skinId: 'lafleur', date: Date.now() - 21600000 },
    { rank: 13, userId: 'mockD13', name: 'NightOwl', score: 8000, skinId: 'gentleman', date: Date.now() - 23400000 },
    { rank: 14, userId: 'mockD14', name: 'MidnightSnack', score: 6000, skinId: 'astro', date: Date.now() - 25200000 },
    { rank: 15, userId: 'mockD15', name: 'Insomniac', score: 4000, skinId: 'default', date: Date.now() - 27000000 },
];
const MOCK_LEADERBOARD_CHALLENGE: LeaderboardEntry[] = [
    { rank: 1, userId: 'mockC1', name: 'DailyChamp', score: 55000, skinId: 'ninja', date: Date.now() },
    { rank: 2, userId: 'mockC2', name: 'SeedMaster', score: 48000, skinId: 'default', date: Date.now() - 100000 },
    { rank: 3, userId: 'mockC3', name: 'PatternPro', score: 42000, skinId: 'pinky', date: Date.now() - 200000 },
    { rank: 4, userId: 'mockC4', name: 'LuckyDuck', score: 38500, skinId: 'cool', date: Date.now() - 300000 },
    { rank: 5, userId: 'mockC5', name: 'QuackAttack', score: 35000, skinId: 'lafleur', date: Date.now() - 400000 },
    { rank: 6, userId: 'mockC6', name: 'WaddleOn', score: 31200, skinId: 'gentleman', date: Date.now() - 500000 },
    { rank: 7, userId: 'mockC7', name: 'FeatherFury', score: 28900, skinId: 'astro', date: Date.now() - 600000 },
    { rank: 8, userId: 'mockC8', name: 'PondPatrol', score: 25400, skinId: 'default', date: Date.now() - 700000 },
    { rank: 9, userId: 'mockC9', name: 'DuckNorris', score: 22100, skinId: 'ninja', date: Date.now() - 800000 },
    { rank: 10, userId: 'mockC10', name: 'BillGates', score: 19800, skinId: 'cool', date: Date.now() - 900000 },
    { rank: 11, userId: 'mockC11', name: 'QuackSparrow', score: 17500, skinId: 'gentleman', date: Date.now() - 1000000 },
    { rank: 12, userId: 'mockC12', name: 'DuckVader', score: 15200, skinId: 'astro', date: Date.now() - 1100000 },
    { rank: 13, userId: 'mockC13', name: 'SirQuacks', score: 12900, skinId: 'lafleur', date: Date.now() - 1200000 },
    { rank: 14, userId: 'mockC14', name: 'MightyDuck', score: 10600, skinId: 'pinky', date: Date.now() - 1300000 },
    { rank: 15, userId: 'mockC15', name: 'JustADuck', score: 8300, skinId: 'default', date: Date.now() - 1400000 },
    { rank: 16, userId: 'mockC16', name: 'LateBird', score: 6000, skinId: 'default', date: Date.now() - 1500000 },
];
const MOCK_LEADERBOARD_CHALLENGE_GLOBAL: LeaderboardEntry[] = [
    { rank: 1, userId: 'mockCG1', name: 'ChallengeKing', score: 150000, skinId: 'ninja', date: Date.now() },
    { rank: 2, userId: 'mockCG2', name: 'MapMaster', score: 140000, skinId: 'default', date: Date.now() - 100000 },
    { rank: 3, userId: 'mockCG3', name: 'ProDodger', score: 130000, skinId: 'cool', date: Date.now() - 200000 },
    { rank: 4, userId: 'mockCG4', name: 'SpeedDemon', score: 120000, skinId: 'astro', date: Date.now() - 300000 },
    { rank: 5, userId: 'mockCG5', name: 'LaserDodger', score: 110000, skinId: 'cyber', date: Date.now() - 400000 },
    { rank: 6, userId: 'mockCG6', name: 'GlitchHunter', score: 100000, skinId: 'glitch_duck', date: Date.now() - 500000 },
    { rank: 7, userId: 'mockCG7', name: 'IceBreaker', score: 90000, skinId: 'cool', date: Date.now() - 600000 },
    { rank: 8, userId: 'mockCG8', name: 'CitySlicker', score: 80000, skinId: 'ninja', date: Date.now() - 700000 },
    { rank: 9, userId: 'mockCG9', name: 'GymRat', score: 70000, skinId: 'lafleur', date: Date.now() - 800000 },
    { rank: 10, userId: 'mockCG10', name: 'PoolShark', score: 60000, skinId: 'gentleman', date: Date.now() - 900000 },
    { rank: 11, userId: 'mockCG11', name: 'SantaClaws', score: 50000, skinId: 'sir_quacks_alot', date: Date.now() - 1000000 },
    { rank: 12, userId: 'mockCG12', name: 'BubbleBoy', score: 40000, skinId: 'quackers', date: Date.now() - 1100000 },
    { rank: 13, userId: 'mockCG13', name: 'PinkyPromise', score: 30000, skinId: 'pinky', date: Date.now() - 1200000 },
    { rank: 14, userId: 'mockCG14', name: 'GoldenEgg', score: 20000, skinId: 'mother_ducker', date: Date.now() - 1300000 },
    { rank: 15, userId: 'mockCG15', name: 'NewbieDuck', score: 10000, skinId: 'default', date: Date.now() - 1400000 },
    { rank: 16, userId: 'mockCG16', name: 'TryHard', score: 5000, skinId: 'magma', date: Date.now() - 1500000 },
];
// In-memory storage for mock mode (resets on worker restart)
const MOCK_USERS = new Map<string, UserProfile>();
const MOCK_FRIEND_CODES = new Map<string, string>(); // code -> userId
const MOCK_CHALLENGES = new Map<string, Challenge>();
const MOCK_USER_CHALLENGES = new Map<string, string[]>(); // userId -> challengeIds[]
export class KVStorage {
  constructor(private kv?: KVNamespace) {}
  private generateFriendCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  async getResetToken(): Promise<string> {
    if (!this.kv) {
        return MOCK_RESET_TOKEN;
    }
    let token = await this.kv.get('sys:reset_token');
    if (!token) {
        token = crypto.randomUUID();
        await this.kv.put('sys:reset_token', token);
    }
    return token;
  }
  async getUser(userId: string): Promise<UserProfile | null> {
    if (!this.kv) {
        return MOCK_USERS.get(userId) || null;
    }
    return await this.kv.get<UserProfile>(`user:${userId}`, 'json');
  }
  async saveUser(profile: UserProfile, merge: boolean = true): Promise<UserProfile> {
    if (!profile.friendCode) {
        profile.friendCode = this.generateFriendCode();
    }
    let existing: UserProfile | null = null;
    if (merge) {
        if (!this.kv) {
            existing = MOCK_USERS.get(profile.id) || null;
        } else {
            existing = await this.getUser(profile.id);
        }
    }
    const finalProfile = merge ? this.mergeProfiles(existing, profile) : profile;
    if (!this.kv) {
        MOCK_USERS.set(finalProfile.id, finalProfile);
        if (finalProfile.friendCode) {
            MOCK_FRIEND_CODES.set(finalProfile.friendCode, finalProfile.id);
        }
        console.log('[MOCK] Saved user profile:', finalProfile.displayName);
        return finalProfile;
    }
    await this.kv.put(`user:${finalProfile.id}`, JSON.stringify(finalProfile));
    if (finalProfile.friendCode) {
        await this.kv.put(`fc:${finalProfile.friendCode}`, finalProfile.id);
    }
    return finalProfile;
  }
  private mergeProfiles(existing: UserProfile | null, incoming: UserProfile): UserProfile {
      if (!existing) return incoming;
      let dailyAttempts = incoming.dailyAttempts || 0;
      let lastDailyAttemptDate = incoming.lastDailyAttemptDate || '';
      if (existing.lastDailyAttemptDate && incoming.lastDailyAttemptDate) {
          if (incoming.lastDailyAttemptDate > existing.lastDailyAttemptDate) {
              dailyAttempts = incoming.dailyAttempts || 0;
              lastDailyAttemptDate = incoming.lastDailyAttemptDate;
          } else if (incoming.lastDailyAttemptDate < existing.lastDailyAttemptDate) {
              dailyAttempts = existing.dailyAttempts || 0;
              lastDailyAttemptDate = existing.lastDailyAttemptDate;
          } else {
              dailyAttempts = Math.max(existing.dailyAttempts || 0, incoming.dailyAttempts || 0);
              lastDailyAttemptDate = existing.lastDailyAttemptDate;
          }
      } else if (existing.lastDailyAttemptDate) {
          dailyAttempts = existing.dailyAttempts || 0;
          lastDailyAttemptDate = existing.lastDailyAttemptDate;
      }
      return {
          ...existing,
          ...incoming,
          bestTime: Math.max(existing.bestTime || 0, incoming.bestTime || 0),
          gamesPlayed: Math.max(existing.gamesPlayed || 0, incoming.gamesPlayed || 0),
          totalTimeSurvived: Math.max(existing.totalTimeSurvived || 0, incoming.totalTimeSurvived || 0),
          totalAccumulatedSurvivalTime: Math.max(existing.totalAccumulatedSurvivalTime || 0, incoming.totalAccumulatedSurvivalTime || 0),
          totalNearMisses: Math.max(existing.totalNearMisses || 0, incoming.totalNearMisses || 0),
          coins: Math.max(existing.coins || 0, incoming.coins || 0),
          unlockedSkinIds: Array.from(new Set([...(existing.unlockedSkinIds || []), ...(incoming.unlockedSkinIds || [])])),
          unlockedMapIds: Array.from(new Set([...(existing.unlockedMapIds || []), ...(incoming.unlockedMapIds || [])])),
          friends: Array.from(new Set([...(existing.friends || []), ...(incoming.friends || [])])),
          friendRequests: this.mergeFriendRequests(existing.friendRequests, incoming.friendRequests),
          mapStats: this.mergeMapStats(existing.mapStats, incoming.mapStats),
          createdAt: existing.createdAt || incoming.createdAt,
          updatedAt: Date.now(),
          bestRunGhost: (existing.bestTime || 0) > (incoming.bestTime || 0) ? existing.bestRunGhost : incoming.bestRunGhost,
          friendCode: existing.friendCode || incoming.friendCode,
          dailyAttempts,
          lastDailyAttemptDate,
          claimedRewardDates: Array.from(new Set([...(existing.claimedRewardDates || []), ...(incoming.claimedRewardDates || [])])),
          claimedAchievementIds: Array.from(new Set([...(existing.claimedAchievementIds || []), ...(incoming.claimedAchievementIds || [])])),
          completedChallengeIds: Array.from(new Set([...(existing.completedChallengeIds || []), ...(incoming.completedChallengeIds || [])]))
      };
  }
  private mergeFriendRequests(existing: FriendRequest[] = [], incoming: FriendRequest[] = []): FriendRequest[] {
      const map = new Map<string, FriendRequest>();
      existing.forEach(r => map.set(r.id, r));
      incoming.forEach(r => map.set(r.id, r));
      return Array.from(map.values());
  }
  private mergeMapStats(
      existing: Record<string, { bestTime: number, gamesPlayed: number, totalTimeSurvived: number, totalExplosions?: number, mostNearMisses?: number, mostShowerPushes?: number, mostWrenchDodges?: number, mostBallsPocketed?: number }> = {},
      incoming: Record<string, { bestTime: number, gamesPlayed: number, totalTimeSurvived: number, totalExplosions?: number, mostNearMisses?: number, mostShowerPushes?: number, mostWrenchDodges?: number, mostBallsPocketed?: number }> = {}
  ): Record<string, { bestTime: number, gamesPlayed: number, totalTimeSurvived: number, totalExplosions?: number, mostNearMisses?: number, mostShowerPushes?: number, mostWrenchDodges?: number, mostBallsPocketed?: number }> {
      const merged: Record<string, any> = { ...existing };
      for (const [key, val] of Object.entries(incoming)) {
          if (merged[key]) {
              merged[key] = {
                  bestTime: Math.max(merged[key].bestTime || 0, val.bestTime || 0),
                  gamesPlayed: Math.max(merged[key].gamesPlayed || 0, val.gamesPlayed || 0),
                  totalTimeSurvived: Math.max(merged[key].totalTimeSurvived || 0, val.totalTimeSurvived || 0),
                  totalExplosions: Math.max(merged[key].totalExplosions || 0, val.totalExplosions || 0),
                  mostNearMisses: Math.max(merged[key].mostNearMisses || 0, val.mostNearMisses || 0),
                  mostShowerPushes: Math.max(merged[key].mostShowerPushes || 0, val.mostShowerPushes || 0),
                  mostWrenchDodges: Math.max(merged[key].mostWrenchDodges || 0, val.mostWrenchDodges || 0),
                  mostBallsPocketed: Math.max(merged[key].mostBallsPocketed || 0, val.mostBallsPocketed || 0)
              };
          } else {
              merged[key] = val;
          }
      }
      return merged;
  }
  async getLeaderboard(mapId: string, type: 'global' | 'daily' | 'daily_challenge' | 'challenge_global' | 'challenge_daily', day?: string): Promise<LeaderboardEntry[]> {
    if (!this.kv) {
        if (type === 'daily_challenge') return MOCK_LEADERBOARD_CHALLENGE;
        if (type === 'challenge_global' || type === 'challenge_daily') return MOCK_LEADERBOARD_CHALLENGE_GLOBAL;
        return type === 'daily' ? MOCK_LEADERBOARD_DAILY : MOCK_LEADERBOARD_GLOBAL;
    }
    let storageKey = `lb:global:map:${mapId}`;
    if (type === 'daily' && day) {
        storageKey = `lb:daily:${day}:map:${mapId}`;
    } else if (type === 'daily_challenge' && day) {
        storageKey = `lb:daily_challenge:${day}`;
    } else if (type === 'challenge_global') {
        storageKey = `lb:challenge:global:map:${mapId}`;
    } else if (type === 'challenge_daily' && day) {
        storageKey = `lb:challenge:daily:${day}:map:${mapId}`;
    }
    const list = await this.kv.get<LeaderboardEntry[]>(storageKey, 'json');
    return list || [];
  }
  async getUserRank(mapId: string, userId: string, type: 'global' | 'daily', day?: string): Promise<{ rank: number, score: number, userId: string } | null> {
    if (!this.kv) {
        const mockList = type === 'daily' ? MOCK_LEADERBOARD_DAILY : MOCK_LEADERBOARD_GLOBAL;
        const existing = mockList.find(e => e.userId === userId);
        if (existing) return { rank: existing.rank, score: existing.score, userId: existing.userId };
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash) + userId.charCodeAt(i);
            hash |= 0;
        }
        const mockRank = (Math.abs(hash) % 50) + 11;
        return { rank: mockRank, score: 0, userId };
    }
    const list = await this.getLeaderboard(mapId, type as any, day);
    const entry = list.find(e => e.userId === userId);
    if (!entry) return null;
    return { rank: entry.rank, score: entry.score, userId: entry.userId };
  }
  async submitScore(
    userId: string,
    mapId: string,
    score: number,
    displayName: string,
    skinId: string,
    mode: string = 'normal'
  ): Promise<{ daily: any, global: any }> {
    const now = Date.now();
    const dayUTC = new Date().toISOString().split('T')[0];
    if (mode === 'daily') {
        const key = `lb:daily_challenge:${dayUTC}`;
        const res = await this.updateList(key, { userId, name: displayName, score, skinId, date: now, rank: 0 });
        return { daily: res, global: null };
    }
    if (mode === 'challenge') {
        if (!this.kv) {
             // Mock response for challenge mode
             return { daily: { rank: 1, score }, global: { rank: 1, score } };
        }
        const globalKey = `lb:challenge:global:map:${mapId}`;
        const dailyKey = `lb:challenge:daily:${dayUTC}:map:${mapId}`;
        const globalRes = await this.updateList(globalKey, { userId, name: displayName, score, skinId, date: now, rank: 0 });
        const dailyRes = await this.updateList(dailyKey, { userId, name: displayName, score, skinId, date: now, rank: 0 });
        return { global: globalRes, daily: dailyRes };
    }
    if (!this.kv) {
        const calcRank = (list: LeaderboardEntry[], score: number) => {
            const betterScores = list.filter(e => e.score > score).length;
            return betterScores + 1;
        };
        const dailyRank = calcRank(MOCK_LEADERBOARD_DAILY, score);
        const globalRank = calcRank(MOCK_LEADERBOARD_GLOBAL, score);
        return {
            daily: { rank: dailyRank, score },
            global: { rank: globalRank, score }
        };
    }
    const globalKey = `lb:global:map:${mapId}`;
    const globalRes = await this.updateList(globalKey, { userId, name: displayName, score, skinId, date: now, rank: 0 });
    const dailyKey = `lb:daily:${dayUTC}:map:${mapId}`;
    const dailyRes = await this.updateList(dailyKey, { userId, name: displayName, score, skinId, date: now, rank: 0 });
    return {
        global: globalRes,
        daily: dailyRes
    };
  }
  private async updateList(key: string, newEntry: LeaderboardEntry): Promise<{ rank: number, score: number } | null> {
    if (!this.kv) return { rank: 1, score: newEntry.score };
    let list = await this.kv.get<LeaderboardEntry[]>(key, 'json') || [];
    const existingIndex = list.findIndex(e => e.userId === newEntry.userId);
    if (existingIndex !== -1) {
        if (list[existingIndex].score >= newEntry.score) {
            return { rank: list[existingIndex].rank, score: list[existingIndex].score };
        }
        list.splice(existingIndex, 1);
    }
    list.push(newEntry);
    list.sort((a, b) => b.score - a.score);
    if (list.length > 100) {
        list = list.slice(0, 100);
    }
    list.forEach((e, i) => e.rank = i + 1);
    await this.kv.put(key, JSON.stringify(list));
    const updatedEntry = list.find(e => e.userId === newEntry.userId);
    return updatedEntry ? { rank: updatedEntry.rank, score: updatedEntry.score } : null;
  }
  async addFriendRequest(fromUserId: string, toFriendCode: string): Promise<{ success: boolean, message: string }> {
      let toUserId: string | null = null;
      if (!this.kv) {
          toUserId = MOCK_FRIEND_CODES.get(toFriendCode) || null;
      } else {
          toUserId = await this.kv.get(`fc:${toFriendCode}`);
      }
      if (!toUserId) return { success: false, message: 'Friend code not found' };
      if (toUserId === fromUserId) return { success: false, message: 'Cannot add yourself' };
      const toUser = await this.getUser(toUserId);
      const fromUser = await this.getUser(fromUserId);
      if (!toUser || !fromUser) return { success: false, message: 'User not found' };
      if (toUser.friends?.includes(fromUserId)) return { success: false, message: 'Already friends' };
      if (toUser.friendRequests?.some(r => r.fromUserId === fromUserId)) return { success: false, message: 'Request already sent' };
      const request: FriendRequest = {
          id: Math.random().toString(36).substring(2),
          fromUserId: fromUser.id,
          fromUserName: fromUser.displayName,
          fromUserSkin: fromUser.avatarSkinId,
          timestamp: Date.now(),
          status: 'pending'
      };
      toUser.friendRequests = [...(toUser.friendRequests || []), request];
      await this.saveUser(toUser);
      return { success: true, message: 'Friend request sent' };
  }
  async respondToFriendRequest(userId: string, requestId: string, accept: boolean): Promise<{ success: boolean, message: string }> {
      const user = await this.getUser(userId);
      if (!user) return { success: false, message: 'User not found' };
      const requestIndex = user.friendRequests?.findIndex(r => r.id === requestId);
      if (requestIndex === undefined || requestIndex === -1) return { success: false, message: 'Request not found' };
      const request = user.friendRequests![requestIndex];
      user.friendRequests!.splice(requestIndex, 1);
      if (accept) {
          user.friends = [...(user.friends || []), request.fromUserId];
          const fromUser = await this.getUser(request.fromUserId);
          if (fromUser) {
              fromUser.friends = [...(fromUser.friends || []), userId];
              await this.saveUser(fromUser);
          }
      }
      await this.saveUser(user, false);
      return { success: true, message: accept ? 'Friend added' : 'Request rejected' };
  }
  async getFriends(userId: string): Promise<any[]> {
      const user = await this.getUser(userId);
      if (!user || !user.friends) return [];
      const friends = [];
      for (const friendId of user.friends) {
          const friend = await this.getUser(friendId);
          if (friend) {
              friends.push({
                  id: friend.id,
                  displayName: friend.displayName,
                  skinId: friend.avatarSkinId,
                  bestTime: friend.bestTime,
                  friendCode: friend.friendCode
              });
          }
      }
      return friends;
  }
  async removeFriend(userId: string, friendId: string): Promise<void> {
      const user = await this.getUser(userId);
      const friend = await this.getUser(friendId);
      if (user && user.friends) {
          user.friends = user.friends.filter(id => id !== friendId);
          await this.saveUser(user, false);
      }
      if (friend && friend.friends) {
          friend.friends = friend.friends.filter(id => id !== userId);
          await this.saveUser(friend, false);
      }
  }
  async createChallenge(challenge: Challenge): Promise<void> {
      if (!this.kv) {
          MOCK_CHALLENGES.set(challenge.id, challenge);
          const fromList = MOCK_USER_CHALLENGES.get(challenge.fromUserId) || [];
          const toList = MOCK_USER_CHALLENGES.get(challenge.toUserId) || [];
          MOCK_USER_CHALLENGES.set(challenge.fromUserId, [...fromList, challenge.id]);
          MOCK_USER_CHALLENGES.set(challenge.toUserId, [...toList, challenge.id]);
          return;
      }
      await this.kv.put(`challenge:${challenge.id}`, JSON.stringify(challenge));
      await this.addChallengeToUserList(challenge.fromUserId, challenge.id);
      await this.addChallengeToUserList(challenge.toUserId, challenge.id);
  }
  private async addChallengeToUserList(userId: string, challengeId: string) {
      if (!this.kv) return;
      const key = `user-challenges:${userId}`;
      const list = await this.kv.get<string[]>(key, 'json') || [];
      if (!list.includes(challengeId)) {
          list.push(challengeId);
          await this.kv.put(key, JSON.stringify(list));
      }
  }
  async getChallenges(userId: string): Promise<Challenge[]> {
      if (!this.kv) {
          const ids = MOCK_USER_CHALLENGES.get(userId) || [];
          return ids.map(id => MOCK_CHALLENGES.get(id)).filter(c => c !== undefined) as Challenge[];
      }
      const key = `user-challenges:${userId}`;
      const ids = await this.kv.get<string[]>(key, 'json') || [];
      const challenges: Challenge[] = [];
      for (const id of ids) {
          const challenge = await this.kv.get<Challenge>(`challenge:${id}`, 'json');
          if (challenge) {
              challenges.push(challenge);
          }
      }
      return challenges.sort((a, b) => b.timestamp - a.timestamp);
  }
  async updateChallenge(challengeId: string, updates: Partial<Challenge>): Promise<void> {
      if (!this.kv) {
          const challenge = MOCK_CHALLENGES.get(challengeId);
          if (challenge) {
              MOCK_CHALLENGES.set(challengeId, { ...challenge, ...updates });
          }
          return;
      }
      const challenge = await this.kv.get<Challenge>(`challenge:${challengeId}`, 'json');
      if (challenge) {
          const updated = { ...challenge, ...updates };
          await this.kv.put(`challenge:${challengeId}`, JSON.stringify(updated));
      }
  }
  async checkPendingReward(userId: string): Promise<Reward | null> {
      const user = await this.getUser(userId);
      if (!user) return null;
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (user.claimedRewardDates?.includes(yesterdayStr)) {
          return null;
      }
      const mapId = getDailyMapId(yesterdayStr);
      const leaderboard = await this.getLeaderboard(mapId, 'daily_challenge', yesterdayStr);
      const entry = leaderboard.find(e => e.userId === userId);
      if (!entry) return null;
      if (entry.rank <= 3) {
          let coins = 0;
          if (entry.rank === 1) coins = 1000;
          else if (entry.rank === 2) coins = 750;
          else if (entry.rank === 3) coins = 500;
          return {
              id: `reward-${yesterdayStr}-${userId}`,
              date: yesterdayStr,
              rank: entry.rank,
              coins,
              mapName: mapId.toUpperCase(),
              status: 'pending'
          };
      }
      return null;
  }
  async claimReward(userId: string, date: string, coins: number): Promise<{ success: boolean, newBalance: number }> {
      const user = await this.getUser(userId);
      if (!user) return { success: false, newBalance: 0 };
      if (user.claimedRewardDates?.includes(date)) {
          return { success: false, newBalance: user.coins || 0 };
      }
      user.claimedRewardDates = [...(user.claimedRewardDates || []), date];
      user.coins = (user.coins || 0) + coins;
      await this.saveUser(user, false);
      return { success: true, newBalance: user.coins };
  }
}