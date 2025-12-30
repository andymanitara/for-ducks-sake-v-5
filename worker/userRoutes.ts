import { Hono } from "hono";
import { Env } from './core-utils';
import { z } from 'zod';
import { KVStorage } from './kv-storage';
import type { KVNamespace } from '@cloudflare/workers-types';
import { authRoutes } from './auth';
// Extend Env to include KV binding
interface LeaderboardEnv extends Env {
    LEADERBOARD_KV?: KVNamespace;
}
// Validation Schemas - Compatible with Zod v3
const UserSyncSchema = z.object({
    id: z.string(),
    displayName: z.string().min(1).max(20),
    avatarSkinId: z.string().optional(),
    authProvider: z.enum(['guest', 'google', 'apple']).optional(),
    email: z.string().email().optional(),
    // Progress Fields
    bestTime: z.number().default(0),
    gamesPlayed: z.number().default(0),
    totalTimeSurvived: z.number().default(0),
    totalAccumulatedSurvivalTime: z.number().default(0),
    unlockedSkinIds: z.array(z.string()).default(['default']),
    unlockedMapIds: z.array(z.string()).default(['pond']),
    totalNearMisses: z.number().default(0),
    coins: z.number().default(0),
    friendCode: z.string().optional(),
    bestRunGhost: z.string().optional(),
    mapStats: z.record(z.string(), z.object({
        bestTime: z.number().default(0),
        gamesPlayed: z.number().default(0),
        totalTimeSurvived: z.number().default(0),
        totalExplosions: z.number().default(0),
        mostNearMisses: z.number().default(0),
        mostShowerPushes: z.number().default(0),
        mostWrenchDodges: z.number().default(0),
        mostBallsPocketed: z.number().default(0),
    })).optional().default({}),
    // Daily Challenge
    dailyAttempts: z.number().default(0),
    lastDailyAttemptDate: z.string().optional(),
    claimedRewardDates: z.array(z.string()).optional().default([]),
    // Achievements
    claimedAchievementIds: z.array(z.string()).optional().default([]),
});
const ScoreSubmitSchema = z.object({
    userId: z.string(),
    mapId: z.string(),
    scoreMs: z.number().int().nonnegative(),
    displayName: z.string().optional(),
    skinId: z.string().optional(),
    mode: z.enum(['normal', 'daily', 'challenge']).optional().default('normal'),
});
const CreateChallengeSchema = z.object({
    fromUserId: z.string(),
    toUserId: z.string(),
    seed: z.string(),
    score: z.number(),
    mapId: z.string(),
});
const UpdateChallengeSchema = z.object({
    challengeId: z.string(),
    status: z.enum(['pending', 'accepted', 'declined', 'completed']),
    score: z.number().optional(),
});
const ClaimRewardSchema = z.object({
    userId: z.string(),
    date: z.string(),
    coins: z.number(),
});
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // Register Auth Routes
    authRoutes(app as any);
    // Helper to get storage
    const getStorage = (c: any) => {
        const env = c.env as LeaderboardEnv;
        if (!env.LEADERBOARD_KV) {
            console.warn('[API] LEADERBOARD_KV not found. Using mock data.');
        }
        return new KVStorage(env.LEADERBOARD_KV);
    };
    // Health Check
    app.get('/api/status', async (c) => {
        try {
            const env = c.env as LeaderboardEnv;
            const storage = getStorage(c);
            const resetToken = await storage.getResetToken();
            const status = {
                kv: !!env.LEADERBOARD_KV,
                timestamp: new Date().toISOString(),
                mode: env.LEADERBOARD_KV ? 'kv_production' : 'mock_fallback',
                resetToken
            };
            return c.json({ success: true, data: status });
        } catch (e: any) {
            console.error('[HEALTH] Status check failed:', e);
            return c.json({ success: false, error: e.message }, 500);
        }
    });
    // Get User Profile
    app.get('/api/user/:id', async (c) => {
        try {
            const storage = getStorage(c);
            const id = c.req.param('id');
            const user = await storage.getUser(id);
            if (user) {
                return c.json({ success: true, data: user });
            }
            return c.json({ success: false, error: 'User not found' }, 404);
        } catch (e: any) {
            console.error('[GET USER] Failed:', e);
            return c.json({ success: false, error: e.message }, 500);
        }
    });
    // Sync User Profile
    app.post('/api/user/sync', async (c) => {
        try {
            const storage = getStorage(c);
            const body = await c.req.json();
            const data = UserSyncSchema.parse(body);
            const now = Date.now();
            // Construct profile object from schema
            const profileToSave = {
                id: data.id,
                displayName: data.displayName,
                avatarSkinId: data.avatarSkinId || 'default',
                createdAt: now, // Will be overridden by merge if existing
                updatedAt: now,
                authProvider: data.authProvider,
                email: data.email,
                bestTime: data.bestTime,
                gamesPlayed: data.gamesPlayed,
                totalTimeSurvived: data.totalTimeSurvived,
                totalAccumulatedSurvivalTime: data.totalAccumulatedSurvivalTime,
                unlockedSkinIds: data.unlockedSkinIds,
                unlockedMapIds: data.unlockedMapIds,
                totalNearMisses: data.totalNearMisses,
                coins: data.coins,
                friendCode: data.friendCode,
                bestRunGhost: data.bestRunGhost,
                mapStats: data.mapStats,
                dailyAttempts: data.dailyAttempts,
                lastDailyAttemptDate: data.lastDailyAttemptDate,
                claimedRewardDates: data.claimedRewardDates,
                claimedAchievementIds: data.claimedAchievementIds
            };
            const savedProfile = await storage.saveUser(profileToSave);
            // Return the FULL merged profile so frontend can update
            return c.json({ success: true, data: savedProfile });
        } catch (e: any) {
            console.error('[USER SYNC] Failed:', e);
            return c.json({ success: false, error: e.message || 'Invalid data' }, 400);
        }
    });
    // Submit Score
    app.post('/api/score/submit', async (c) => {
        try {
            const storage = getStorage(c);
            const body = await c.req.json();
            const data = ScoreSubmitSchema.parse(body);
            const result = await storage.submitScore(
                data.userId,
                data.mapId,
                data.scoreMs,
                data.displayName || 'Anonymous',
                data.skinId || 'default',
                data.mode
            );
            return c.json({ success: true, data: result });
        } catch (e: any) {
            console.error('[SCORE SUBMIT] Failed:', e);
            return c.json({ success: false, error: e.message || 'Submission failed' }, 500);
        }
    });
    // Leaderboards
    app.get('/api/leaderboard/global', async (c) => {
        try {
            const storage = getStorage(c);
            const mapId = c.req.query('mapId');
            if (!mapId) return c.json({ success: false, error: 'Missing mapId' }, 400);
            const data = await storage.getLeaderboard(mapId, 'global');
            return c.json({ success: true, data });
        } catch (e: any) {
            return c.json({ success: false, error: e.message }, 500);
        }
    });
    app.get('/api/leaderboard/daily', async (c) => {
        try {
            const storage = getStorage(c);
            const mapId = c.req.query('mapId');
            const day = c.req.query('day') || new Date().toISOString().split('T')[0];
            if (!mapId) return c.json({ success: false, error: 'Missing mapId' }, 400);
            const data = await storage.getLeaderboard(mapId, 'daily', day);
            return c.json({ success: true, data });
        } catch (e: any) {
            return c.json({ success: false, error: e.message }, 500);
        }
    });
    app.get('/api/leaderboard/daily_challenge', async (c) => {
        try {
            const storage = getStorage(c);
            const mapId = c.req.query('mapId') || 'any';
            const day = c.req.query('day') || new Date().toISOString().split('T')[0];
            const data = await storage.getLeaderboard(mapId, 'daily_challenge', day);
            return c.json({ success: true, data });
        } catch (e: any) {
            return c.json({ success: false, error: e.message }, 500);
        }
    });
    app.get('/api/leaderboard/me', async (c) => {
        try {
            const storage = getStorage(c);
            const mapId = c.req.query('mapId');
            const userId = c.req.query('userId');
            const type = (c.req.query('type') || 'global') as 'global' | 'daily';
            const day = c.req.query('day') || new Date().toISOString().split('T')[0];
            if (!mapId || !userId) return c.json({ success: false, error: 'Missing params' }, 400);
            const data = await storage.getUserRank(mapId, userId, type, day);
            return c.json({ success: true, data });
        } catch (e: any) {
            return c.json({ success: false, error: e.message }, 500);
        }
    });
    // --- Friends API ---
    app.get('/api/friends', async (c) => {
        try {
            const storage = getStorage(c);
            const userId = c.req.query('userId');
            if (!userId) return c.json({ success: false, error: 'Missing userId' }, 400);
            const friends = await storage.getFriends(userId);
            const user = await storage.getUser(userId);
            // Check for pending rewards
            const reward = await storage.checkPendingReward(userId);
            return c.json({
                success: true,
                data: {
                    friends,
                    requests: user?.friendRequests || [],
                    reward // Include reward in response
                }
            });
        } catch (e: any) {
            return c.json({ success: false, error: e.message }, 500);
        }
    });
    app.post('/api/friends/request', async (c) => {
        try {
            const storage = getStorage(c);
            const { userId, targetFriendCode } = await c.req.json();
            if (!userId || !targetFriendCode) return c.json({ success: false, error: 'Missing params' }, 400);
            const result = await storage.addFriendRequest(userId, targetFriendCode);
            return c.json(result);
        } catch (e: any) {
            return c.json({ success: false, error: e.message }, 500);
        }
    });
    app.post('/api/friends/respond', async (c) => {
        try {
            const storage = getStorage(c);
            const { userId, requestId, action } = await c.req.json();
            if (!userId || !requestId || !action) return c.json({ success: false, error: 'Missing params' }, 400);
            const result = await storage.respondToFriendRequest(userId, requestId, action === 'accept');
            return c.json(result);
        } catch (e: any) {
            return c.json({ success: false, error: e.message }, 500);
        }
    });
    app.delete('/api/friends/:friendId', async (c) => {
        try {
            const storage = getStorage(c);
            const userId = c.req.query('userId');
            const friendId = c.req.param('friendId');
            if (!userId || !friendId) return c.json({ success: false, error: 'Missing params' }, 400);
            await storage.removeFriend(userId, friendId);
            return c.json({ success: true });
        } catch (e: any) {
            return c.json({ success: false, error: e.message }, 500);
        }
    });
    // --- Challenge API ---
    app.get('/api/challenges', async (c) => {
        try {
            const storage = getStorage(c);
            const userId = c.req.query('userId');
            if (!userId) return c.json({ success: false, error: 'Missing userId' }, 400);
            const challenges = await storage.getChallenges(userId);
            return c.json({ success: true, data: challenges });
        } catch (e: any) {
            return c.json({ success: false, error: e.message }, 500);
        }
    });
    app.post('/api/challenges/create', async (c) => {
        try {
            const storage = getStorage(c);
            const body = await c.req.json();
            const data = CreateChallengeSchema.parse(body);
            const fromUser = await storage.getUser(data.fromUserId);
            const toUser = await storage.getUser(data.toUserId);
            if (!fromUser) return c.json({ success: false, error: 'User not found' }, 404);
            const challenge = {
                id: crypto.randomUUID(),
                fromUserId: data.fromUserId,
                fromUserName: fromUser.displayName,
                fromUserSkin: fromUser.avatarSkinId,
                toUserId: data.toUserId,
                toUserName: toUser?.displayName || 'Unknown Duck',
                mapId: data.mapId,
                seed: data.seed,
                status: 'pending' as const,
                challengerScore: data.score,
                timestamp: Date.now()
            };
            await storage.createChallenge(challenge);
            return c.json({ success: true, data: challenge });
        } catch (e: any) {
            return c.json({ success: false, error: e.message }, 500);
        }
    });
    app.post('/api/challenges/update', async (c) => {
        try {
            const storage = getStorage(c);
            const body = await c.req.json();
            const data = UpdateChallengeSchema.parse(body);
            const updates: any = { status: data.status };
            if (data.score !== undefined) {
                updates.targetScore = data.score;
            }
            await storage.updateChallenge(data.challengeId, updates);
            return c.json({ success: true });
        } catch (e: any) {
            return c.json({ success: false, error: e.message }, 500);
        }
    });
    // --- Reward API ---
    app.post('/api/rewards/claim', async (c) => {
        try {
            const storage = getStorage(c);
            const body = await c.req.json();
            const data = ClaimRewardSchema.parse(body);
            const result = await storage.claimReward(data.userId, data.date, data.coins);
            return c.json(result);
        } catch (e: any) {
            return c.json({ success: false, error: e.message }, 500);
        }
    });
}