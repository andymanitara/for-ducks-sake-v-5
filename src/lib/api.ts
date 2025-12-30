import { PlayerProfile, LeaderboardEntry, Friend, FriendRequest, Challenge, Reward } from '@/types/game';
import { toast } from 'sonner';
// Configuration for external API URL
const ENV_API_URL = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL : undefined;
const API_BASE = ENV_API_URL ? ENV_API_URL.replace(/\/$/, '') : '/api';
if (import.meta.env.DEV && ENV_API_URL) {
    console.log(`[API] Configured with external base: ${API_BASE}`);
}
export interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
  source?: string;
  error?: string;
}
export interface UserRankResponse {
  success: boolean;
  data: {
    rank: number;
    score: number;
    userId: string;
  } | null;
  error?: string;
}
export interface ScoreSubmission {
  userId: string;
  mapId: string;
  scoreMs: number;
  displayName?: string;
  skinId?: string;
  mode?: 'normal' | 'daily' | 'challenge';
}
export interface ScoreSubmissionResponse {
    success: boolean;
    data?: {
        daily?: { rank: number; score: number } | null;
        global?: { rank: number; score: number } | null;
    };
    error?: string;
}
export interface StatusResponse {
    kv: boolean;
    timestamp: string;
    mode: string;
    resetToken?: string;
}
export interface FriendsResponse {
    success: boolean;
    data: {
        friends: Friend[];
        requests: FriendRequest[];
        reward?: Reward | null;
    };
    error?: string;
}
export interface ChallengesResponse {
    success: boolean;
    data: Challenge[];
    error?: string;
}
// Backend User Profile Shape
export interface BackendUserProfile {
  id: string;
  displayName: string;
  avatarSkinId: string;
  createdAt: number;
  updatedAt: number;
  authProvider?: string;
  email?: string;
  bestTime: number;
  gamesPlayed: number;
  totalTimeSurvived: number;
  totalAccumulatedSurvivalTime?: number;
  unlockedSkinIds: string[];
  unlockedMapIds: string[];
  totalNearMisses: number;
  coins?: number;
  friendCode?: string;
  bestRunGhost?: string;
  mapStats?: Record<string, any>;
  dailyAttempts?: number;
  lastDailyAttemptDate?: string;
  claimedRewardDates?: string[];
  claimedAchievementIds?: string[];
}
export type FetchOptions = RequestInit & { skipErrorLog?: boolean };
async function fetchJson<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const { skipErrorLog, ...fetchOptions } = options || {};
  try {
    const defaultHeaders = {
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Expires': '0'
    };
    const mergedOptions: RequestInit = {
      ...fetchOptions,
      cache: 'no-store',
      headers: {
        ...defaultHeaders,
        ...fetchOptions?.headers
      }
    };
    const res = await fetch(url, mergedOptions);
    const textBody = await res.text();
    let jsonBody: any;
    try {
        if (textBody) {
            jsonBody = JSON.parse(textBody);
        }
    } catch (e) {
        // JSON parse failed
    }
    if (!res.ok) {
      let errorMessage = `API Error: ${res.status} ${res.statusText}`;
      if (jsonBody && jsonBody.error) {
        errorMessage = jsonBody.error;
      } else if (textBody) {
          const preview = textBody.length > 200 ? textBody.substring(0, 200) + '...' : textBody;
          errorMessage = `${errorMessage} - ${preview}`;
      }
      if (!skipErrorLog) {
          console.error(`[API] Error Body:`, errorMessage);
      }
      throw new Error(errorMessage);
    }
    return jsonBody as T;
  } catch (error) {
    if (!skipErrorLog) {
        console.error(`[API] Fetch failed for ${url}:`, error);
    }
    throw error;
  }
}
export const api = {
  baseUrl: API_BASE,
  syncUser: async (profile: PlayerProfile): Promise<{ success: boolean; data?: PlayerProfile; error?: string }> => {
    try {
        const res = await fetchJson<{ success: boolean; data: BackendUserProfile }>('/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: profile.playerId,
                displayName: profile.displayName,
                avatarSkinId: profile.equippedSkinId,
                authProvider: profile.authProvider,
                email: profile.email,
                bestTime: profile.bestTime,
                gamesPlayed: profile.gamesPlayed,
                totalTimeSurvived: profile.totalTimeSurvived,
                totalAccumulatedSurvivalTime: profile.totalAccumulatedSurvivalTime,
                unlockedSkinIds: profile.unlockedSkinIds,
                unlockedMapIds: profile.unlockedMapIds,
                totalNearMisses: profile.totalNearMisses,
                coins: profile.coins,
                friendCode: profile.friendCode,
                bestRunGhost: profile.bestRunGhost,
                mapStats: profile.mapStats,
                dailyAttempts: profile.dailyAttempts,
                lastDailyAttemptDate: profile.lastDailyAttemptDate,
                claimedRewardDates: profile.claimedRewardDates,
                claimedAchievementIds: profile.claimedAchievementIds
            })
        });
        if (res.success && res.data) {
            const backend = res.data;
            const mergedProfile: PlayerProfile = {
                  playerId: backend.id,
                  displayName: backend.displayName,
                  equippedSkinId: backend.avatarSkinId,
                  createdAt: backend.createdAt,
                  lastSeenAt: backend.updatedAt,
                  authProvider: (backend.authProvider as any) || 'guest',
                  email: backend.email,
                  bestTime: backend.bestTime || 0,
                  gamesPlayed: backend.gamesPlayed || 0,
                  totalTimeSurvived: backend.totalTimeSurvived || 0,
                  totalAccumulatedSurvivalTime: backend.totalAccumulatedSurvivalTime || 0,
                  unlockedSkinIds: backend.unlockedSkinIds || ['default'],
                  unlockedMapIds: backend.unlockedMapIds || ['pond'],
                  totalNearMisses: backend.totalNearMisses || 0,
                  coins: backend.coins || 0,
                  friendCode: backend.friendCode,
                  bestRunGhost: backend.bestRunGhost,
                  mapStats: backend.mapStats || {},
                  dailyAttempts: backend.dailyAttempts || 0,
                  lastDailyAttemptDate: backend.lastDailyAttemptDate || new Date().toISOString().split('T')[0],
                  claimedRewardDates: backend.claimedRewardDates || [],
                  claimedAchievementIds: backend.claimedAchievementIds || []
            };
            return { success: true, data: mergedProfile };
        }
        return { success: false, error: 'Invalid response' };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
  },
  getUser: async (userId: string) => {
      try {
          const res = await fetchJson<{ success: boolean, data: BackendUserProfile }>(`/user/${userId}`);
          if (res.success && res.data) {
              const backend = res.data;
              const profile: PlayerProfile = {
                  playerId: backend.id,
                  displayName: backend.displayName,
                  equippedSkinId: backend.avatarSkinId,
                  createdAt: backend.createdAt,
                  lastSeenAt: backend.updatedAt,
                  authProvider: (backend.authProvider as any) || 'guest',
                  email: backend.email,
                  bestTime: backend.bestTime || 0,
                  gamesPlayed: backend.gamesPlayed || 0,
                  totalTimeSurvived: backend.totalTimeSurvived || 0,
                  totalAccumulatedSurvivalTime: backend.totalAccumulatedSurvivalTime || 0,
                  unlockedSkinIds: backend.unlockedSkinIds || ['default'],
                  unlockedMapIds: backend.unlockedMapIds || ['pond'],
                  totalNearMisses: backend.totalNearMisses || 0,
                  coins: backend.coins || 0,
                  friendCode: backend.friendCode,
                  bestRunGhost: backend.bestRunGhost,
                  mapStats: backend.mapStats || {},
                  dailyAttempts: backend.dailyAttempts || 0,
                  lastDailyAttemptDate: backend.lastDailyAttemptDate || new Date().toISOString().split('T')[0],
                  claimedRewardDates: backend.claimedRewardDates || [],
                  claimedAchievementIds: backend.claimedAchievementIds || []
              };
              return { success: true, data: profile };
          }
          return { success: false, error: 'User not found' };
      } catch (e: any) {
          return { success: false, error: e.message };
      }
  },
  submitScore: async (data: ScoreSubmission): Promise<ScoreSubmissionResponse> => {
    return fetchJson<ScoreSubmissionResponse>('/score/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },
  submitScoreWithRetry: async (data: ScoreSubmission, retries = 3): Promise<ScoreSubmissionResponse | null> => {
      let attempt = 0;
      while (attempt < retries) {
          try {
              const response = await api.submitScore(data);
              if (response.success) {
                  return response;
              } else {
                  console.warn(`[API] Score submission failed (Attempt ${attempt + 1}):`, response.error);
              }
          } catch (e: any) {
              console.warn(`[API] Score submission network error (Attempt ${attempt + 1}):`, e.message);
          }
          attempt++;
          if (attempt < retries) {
              const delay = 500 * Math.pow(2, attempt - 1);
              await new Promise(r => setTimeout(r, delay));
              if (attempt > 1) {
                  toast.loading(`Retrying score submission... (${attempt}/${retries})`, { duration: 1000 });
              }
          }
      }
      toast.error("Could not save score. Check connection.");
      return null;
  },
  getLeaderboard: async (mapId: string, type: 'global' | 'daily' | 'daily_challenge', day?: string) => {
    const query = new URLSearchParams({ mapId, limit: '100' });
    if ((type === 'daily' || type === 'daily_challenge') && day) query.append('day', day);
    return fetchJson<LeaderboardResponse>(`/leaderboard/${type}?${query.toString()}`);
  },
  getUserRank: async (mapId: string, userId: string, type: 'global' | 'daily') => {
    const query = new URLSearchParams({ mapId, userId, type });
    return fetchJson<UserRankResponse>(`/leaderboard/me?${query.toString()}`);
  },
  checkStatus: async () => {
      return fetchJson<{ success: boolean, data: StatusResponse }>('/status');
  },
  getFriends: async (userId: string, options?: FetchOptions) => {
      return fetchJson<FriendsResponse>(`/friends?userId=${userId}`, options);
  },
  sendFriendRequest: async (userId: string, targetFriendCode: string) => {
      return fetchJson<{ success: boolean, message: string }>('/friends/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, targetFriendCode })
      });
  },
  respondToFriendRequest: async (userId: string, requestId: string, action: 'accept' | 'reject') => {
      return fetchJson<{ success: boolean, message: string }>('/friends/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, requestId, action })
      });
  },
  removeFriend: async (userId: string, friendId: string) => {
      return fetchJson<{ success: boolean, error?: string }>(`/friends/${friendId}?userId=${userId}`, {
          method: 'DELETE'
      });
  },
  getChallenges: async (userId: string, options?: FetchOptions) => {
      return fetchJson<ChallengesResponse>(`/challenges?userId=${userId}`, options);
  },
  createChallenge: async (data: { fromUserId: string, toUserId: string, seed: string, score: number, mapId: string }) => {
      return fetchJson<{ success: boolean, data: Challenge }>('/challenges/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      });
  },
  updateChallenge: async (data: { challengeId: string, status: string, score?: number }) => {
      return fetchJson<{ success: boolean }>('/challenges/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      });
  },
  claimReward: async (userId: string, date: string, coins: number) => {
      return fetchJson<{ success: boolean, newBalance: number }>('/rewards/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, date, coins })
      });
  }
};