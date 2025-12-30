# Deployment & Configuration Guide
This guide addresses common configuration tasks for **For Ducks Sake**, including setting up real data storage, pointing to external backends, and deploying to your own Cloudflare account.
## 1. Using Your Own KV Namespace (Real Data)
By default, the application runs in **Mock Mode**. To save leaderboards and profiles permanently, you need to connect a Cloudflare KV Namespace.
**Steps:**
1.  **Login to Cloudflare:**
    ```bash
    npx wrangler login
    ```
2.  **Create the Namespace:**
    ```bash
    npx wrangler kv:namespace create LEADERBOARD_KV
    ```
    *This will output a configuration block with an ID (e.g., `23480238402384...`).*
3.  **Update Configuration:**
    *   Open `wrangler.jsonc` in the root directory.
    *   Add the `kv_namespaces` block to the configuration. You can copy the template from `wrangler.kv.example.jsonc`.
    It should look like this:
    ```jsonc
    {
      // ... existing config ...
      "kv_namespaces": [
        {
          "binding": "LEADERBOARD_KV",
          "id": "YOUR_GENERATED_ID_HERE"
        }
      ]
    }
    ```
4.  **Deploy:**
    ```bash
    bun run deploy
    ```
## 2. Pointing to a Different Worker URL
You can configure the frontend to connect to any Cloudflare Worker URL (e.g., if you want to run the frontend locally but connect to a production backend).
**Steps:**
1.  Create a file named `.env` in the root directory (copy from `.env.example`).
2.  Add the `VITE_API_URL` variable:
    ```env
    VITE_API_URL=https://your-worker-name.your-subdomain.workers.dev/api
    ```
    *Note: Ensure you include `/api` at the end if your worker routes are prefixed with it.*
3.  Restart your development server:
    ```bash
    bun run dev
    ```
## 3. Deploying to an External Cloudflare Account
You can deploy this application to any Cloudflare account you have access to.
**Steps:**
1.  **Logout (if previously logged in to a different account):**
    ```bash
    npx wrangler logout
    ```
2.  **Login to the Target Account:**
    ```bash
    npx wrangler login
    ```
    *A browser window will open asking you to authorize Wrangler.*
3.  **Deploy:**
    ```bash
    bun run deploy
    ```
    *Wrangler will automatically detect your account settings and deploy the worker and assets.*
## Troubleshooting
*   **CORS Errors:** If pointing to an external worker, ensure that worker handles CORS correctly (the provided `worker/index.ts` already includes CORS headers for all origins).
*   **Data Not Saving:** Verify that you have deployed *after* adding the KV configuration to `wrangler.jsonc`. Check the Info Hub (Book icon) in the game to see if "Storage: Cloudflare KV" is active.