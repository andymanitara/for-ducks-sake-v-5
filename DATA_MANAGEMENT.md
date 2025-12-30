# Data Management & Server Reset Guide
This guide addresses common questions regarding the management of game data stored in Cloudflare KV, specifically focusing on the implications of deleting data ("Server Wipe") and the application's resilience.
## Storage Behavior Explained
### 1. What happens if I connect a new (empty) KV namespace?
**You get a Fresh Start.**
If the application detects a valid KV connection but finds no data (because it's new or was wiped):
*   **It does NOT fall back to mock data.**
*   It treats the game universe as brand new.
*   Leaderboards will be empty.
*   Friend lists will be empty.
*   New user profiles will be created as players sign in.
### 2. Will I see mock data if I have an empty KV?
**No.**
Mock data is *only* used when the `LEADERBOARD_KV` binding is completely missing from the configuration. If the binding exists, the app assumes you are in "Real Mode" and will show exactly what is in the database (which is nothing, initially).
## Hard Reset Mechanism (New)
To ensure a true "Clean Slate" when a server is wiped or replaced, the application now tracks a **Server Reset Token** (`sys:reset_token`).
*   **How it works:**
    1.  The server generates a unique UUID token when it starts up with a fresh database.
    2.  Clients download and store this token.
    3.  On every launch, the client compares its stored token with the server's current token.
    4.  **Mismatch Detected:** If the tokens differ (meaning the server was wiped/replaced), the client automatically **wipes all local data** (profiles, skins, stats) and reloads the page.
*   **Result:** This guarantees that if you deploy a new KV namespace, all players will be forced to restart from scratch, preventing old local data from "polluting" the new server via self-healing.
## Frequently Asked Questions
### 3. If I delete all data from the `LEADERBOARD_KV` storage, is that effectively a server wipe?
**Yes.** Deleting the KV namespace content or specific keys within it acts as a server-side wipe.
*   **Leaderboards:** All global and daily leaderboards will be permanently deleted.
*   **User Profiles (Server-Side):** All user profiles stored on the server will be deleted.
*   **Social Connections:** Friend lists and pending challenges stored on the server will be cleared.
*   **Client Reset:** Because the `sys:reset_token` will also be deleted, the server will generate a new one. This will trigger the **Hard Reset** on all clients, wiping their local progress too.
### 4. Will wiping the data break the game?
**No.** The game is designed to handle missing server data gracefully.
*   **Self-Healing (Legacy):** Previously, the game would restore local data to the server.
*   **Hard Reset (Current):** Now, the game prioritizes the server's lifecycle. A server wipe commands a client wipe. This ensures consistency across the player base.
## Summary
You can safely clear the `LEADERBOARD_KV` namespace at any time to reset the entire game universe. Players will be automatically reset to a fresh state on their next visit.