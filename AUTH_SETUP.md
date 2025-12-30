# Native Cloudflare OAuth Setup
**For Ducks Sake** uses a native OAuth implementation running directly on Cloudflare Workers. This removes the dependency on Firebase/Supabase and stores all user data in your Cloudflare KV namespace.
## 1. Google OAuth Setup
To enable "Continue with Google", you need to create credentials in the Google Cloud Console.
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project or select an existing one.
3.  Navigate to **APIs & Services > Credentials**.
4.  Click **Create Credentials > OAuth client ID**.
5.  Select **Web application**.
6.  **Authorized redirect URIs**:
    *   Add your Worker's URL followed by `/api/auth/google/callback`.
    *   Example: `https://duck-dodger.your-subdomain.workers.dev/api/auth/google/callback`
    *   For local development: `http://localhost:3000/api/auth/google/callback`
7.  Copy the **Client ID** and **Client Secret**.
### Configure Google Secrets
```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REDIRECT_URI
# Enter: https://your-worker.workers.dev/api/auth/google/callback
```
## 2. Apple OAuth Setup
To enable "Continue with Apple", you need an Apple Developer Account.
### A. Create App ID & Service ID
1.  Go to [Apple Developer Account > Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources).
2.  **Identifiers > App IDs**: Create a new App ID (e.g., `com.yourname.duckdodger`). Enable "Sign In with Apple".
3.  **Identifiers > Service IDs**: Create a new Service ID (e.g., `com.yourname.duckdodger.service`).
    *   Enable "Sign In with Apple".
    *   Click "Configure".
    *   Select your Primary App ID.
    *   **Domains**: Enter your worker domain (e.g., `duck-dodger.your-subdomain.workers.dev`).
    *   **Return URLs**: Enter your callback URL (e.g., `https://duck-dodger.your-subdomain.workers.dev/api/auth/apple/callback`).
    *   Save.
### B. Create Private Key (P8)
1.  **Keys**: Create a new Key.
2.  Name it "Duck Dodger Auth".
3.  Enable "Sign In with Apple".
4.  Click "Configure" and select your Primary App ID.
5.  Register and **Download** the `.p8` file. **Save this file securely; you cannot download it again.**
6.  Note the **Key ID** (e.g., `ABC123DEFG`).
### C. Get Team ID
1.  Your **Team ID** is displayed in the top right of the Apple Developer portal (e.g., `XYZ123ABCD`).
### D. Configure Apple Secrets
Run the following commands to set the secrets in your worker:
```bash
# 1. Service ID (Not App ID)
npx wrangler secret put APPLE_CLIENT_ID
# Enter: com.yourname.duckdodger.service
# 2. Team ID
npx wrangler secret put APPLE_TEAM_ID
# Enter: XYZ123ABCD
# 3. Key ID
npx wrangler secret put APPLE_KEY_ID
# Enter: ABC123DEFG
# 4. Private Key (P8 Content)
npx wrangler secret put APPLE_PRIVATE_KEY
# Open your .p8 file with a text editor.
# Copy the ENTIRE content (including -----BEGIN PRIVATE KEY-----).
# Paste it when prompted.
# Note: If pasting fails due to newlines, ensure you paste it exactly as is.
# The worker handles standard PEM formatting.
# 5. Redirect URI
npx wrangler secret put APPLE_REDIRECT_URI
# Enter: https://your-worker.workers.dev/api/auth/apple/callback
```
## 3. General Configuration
Set the frontend URL where users should be redirected after login.
```bash
npx wrangler secret put FRONTEND_URL
# Enter your deployed frontend URL (e.g., https://duck-dodger.pages.dev)
# Or http://localhost:3000 for local testing
```
## 4. Verify Setup
1.  Deploy your worker: `bun run deploy`
2.  Open the app.
3.  Click "Continue with Google" or "Continue with Apple".
4.  You should be redirected to the provider, then back to the app, and logged in.
5.  Check your Profile to see your linked account status.