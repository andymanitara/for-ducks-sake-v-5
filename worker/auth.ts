import { Hono } from "hono";
import { Env } from './core-utils';
import { KVStorage } from './kv-storage';
import type { KVNamespace } from '@cloudflare/workers-types';
interface AuthEnv extends Env {
    LEADERBOARD_KV?: KVNamespace;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_REDIRECT_URI?: string;
    APPLE_CLIENT_ID?: string;
    APPLE_TEAM_ID?: string;
    APPLE_KEY_ID?: string;
    APPLE_PRIVATE_KEY?: string;
    APPLE_REDIRECT_URI?: string;
    FRONTEND_URL?: string;
}
/**
 * Generates a signed JWT Client Secret for Apple Auth
 * Requires: Team ID, Key ID, and Private Key (P8)
 */
async function generateAppleClientSecret(env: AuthEnv): Promise<string> {
    // STUB: Apple Auth is temporarily disabled to resolve build issues with 'jose' dependency
    // This function is kept as a placeholder for future implementation
    throw new Error('Apple Sign-In is temporarily disabled due to dependency issues.');
}
export function authRoutes(app: Hono<{ Bindings: AuthEnv }>) {
    // Helper to get storage
    const getStorage = (c: any) => {
        const env = c.env as AuthEnv;
        if (!env.LEADERBOARD_KV) {
            console.warn('[AUTH] KV not configured, using mock storage behavior (no-op)');
            return {
                getUser: async () => null,
                saveUser: async () => {}
            } as unknown as KVStorage;
        }
        return new KVStorage(env.LEADERBOARD_KV);
    };
    // --- GOOGLE OAUTH ---
    app.get('/api/auth/google/login', (c) => {
        const env = c.env as AuthEnv;
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_REDIRECT_URI) {
            return c.text('Google Auth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI secrets.', 500);
        }
        const params = new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID,
            redirect_uri: env.GOOGLE_REDIRECT_URI,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'online',
            prompt: 'consent'
        });
        return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    });
    app.get('/api/auth/google/callback', async (c) => {
        const env = c.env as AuthEnv;
        const code = c.req.query('code');
        const error = c.req.query('error');
        const frontendUrl = env.FRONTEND_URL || new URL(c.req.url).origin.replace('/api', '');
        if (error) return c.redirect(`${frontendUrl}/?error=${error}`);
        if (!code) return c.redirect(`${frontendUrl}/?error=no_code`);
        try {
            // 1. Exchange code for token
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: env.GOOGLE_CLIENT_ID!,
                    client_secret: env.GOOGLE_CLIENT_SECRET!,
                    redirect_uri: env.GOOGLE_REDIRECT_URI!,
                    grant_type: 'authorization_code'
                })
            });
            const tokenData = await tokenResponse.json() as any;
            if (!tokenData.access_token) {
                console.error('Google Token Error:', tokenData);
                throw new Error('Failed to get access token');
            }
            // 2. Get User Info
            const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
            });
            const userData = await userResponse.json() as any;
            // 3. Save/Update User in KV
            const storage = getStorage(c);
            const userId = `google_${userData.id}`;
            const existing = await storage.getUser(userId);
            // Merge existing data with new auth info, preserving progress
            const profile = {
                id: userId,
                displayName: existing?.displayName || userData.name || 'Duck Player',
                avatarSkinId: existing?.avatarSkinId || 'default',
                createdAt: existing?.createdAt || Date.now(),
                updatedAt: Date.now(),
                authProvider: 'google',
                email: userData.email,
                // Critical: Preserve all progress fields
                bestTime: existing?.bestTime || 0,
                gamesPlayed: existing?.gamesPlayed || 0,
                totalTimeSurvived: existing?.totalTimeSurvived || 0,
                unlockedSkinIds: existing?.unlockedSkinIds || ['default'],
                unlockedMapIds: existing?.unlockedMapIds || ['pond'],
                totalNearMisses: existing?.totalNearMisses || 0
            };
            await storage.saveUser(profile);
            const params = new URLSearchParams({
                userId: profile.id,
                name: profile.displayName,
                provider: 'google'
            });
            return c.redirect(`${frontendUrl}/?${params.toString()}`);
        } catch (e: any) {
            console.error('Google Auth Error:', e);
            return c.redirect(`${frontendUrl}/?error=auth_failed`);
        }
    });
    // --- APPLE OAUTH ---
    app.get('/api/auth/apple/login', (c) => {
        const env = c.env as AuthEnv;
        if (!env.APPLE_CLIENT_ID || !env.APPLE_REDIRECT_URI) {
            return c.text('Apple Auth not configured. Set APPLE_CLIENT_ID and APPLE_REDIRECT_URI secrets.', 500);
        }
        // Redirect to Apple, but callback will fail gracefully
        const params = new URLSearchParams({
            client_id: env.APPLE_CLIENT_ID,
            redirect_uri: env.APPLE_REDIRECT_URI,
            response_type: 'code',
            scope: 'name email',
            response_mode: 'form_post' // Apple requires form_post for scopes
        });
        return c.redirect(`https://appleid.apple.com/auth/authorize?${params.toString()}`);
    });
    app.post('/api/auth/apple/callback', async (c) => {
        const env = c.env as AuthEnv;
        const frontendUrl = env.FRONTEND_URL || new URL(c.req.url).origin.replace('/api', '');
        try {
            const body = await c.req.parseBody();
            const code = body['code'] as string;
            const error = body['error'];
            if (error) return c.redirect(`${frontendUrl}/?error=${error}`);
            if (!code) return c.redirect(`${frontendUrl}/?error=no_code`);
            // 1. Generate Client Secret (JWT) - THIS WILL THROW
            await generateAppleClientSecret(env);
            // Unreachable code due to stub above, but kept for structure reference
            return c.redirect(`${frontendUrl}/?error=apple_auth_disabled`);
        } catch (e: any) {
            console.error('Apple Auth Error:', e);
            // Redirect with a specific error message for the frontend
            return c.redirect(`${frontendUrl}/?error=apple_auth_disabled`);
        }
    });
}