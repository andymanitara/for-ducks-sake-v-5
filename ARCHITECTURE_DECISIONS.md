# Architecture Decisions: Storage & Data Strategy
## Executive Summary
For "For Ducks Sake", we have selected **Cloudflare KV (Key-Value)** as our primary storage mechanism for user profiles, leaderboards, and social features. This decision prioritizes **read performance**, **global availability**, and **simplicity** over complex relational queries or strong consistency, aligning perfectly with the game's requirements.
## Why Cloudflare KV?
### 1. Global Low-Latency Reads
*   **Requirement:** The game is fast-paced. Fetching a user's profile, skin, or the daily leaderboard must be near-instant to prevent UI friction.
*   **KV Advantage:** KV is eventually consistent and replicated to Cloudflare's edge locations worldwide. This means a player in Tokyo reads data from a Tokyo node, not a server in Virginia.
*   **Efficiency:** Read operations are extremely cheap and fast (sub-millisecond in many cases).
### 2. Data Structure Fit
*   **Requirement:** Our data models (User Profile, Leaderboard List) are self-contained JSON documents. We rarely need to perform complex joins (e.g., "Find all users who unlocked skin X and played yesterday").
*   **KV Advantage:** KV is a simple key-value store. We store `user:123` -> `{ ...profile }`. This O(1) lookup is the most efficient way to retrieve data by ID.
### 3. Cost & Scalability
*   **Requirement:** The game may scale to thousands of users. We need a solution that handles spikes without manual sharding.
*   **KV Advantage:** KV scales automatically. It handles massive read volumes effortlessly.
## Alternatives Considered
### Cloudflare D1 (SQLite)
*   **Pros:** Relational data, strong consistency, powerful SQL queries.
*   **Cons:** Higher latency for global reads compared to KV (data lives in one primary location + read replicas). Overkill for our simple schema.
*   **Verdict:** Reserved for future features if we need complex analytics or relational integrity (e.g., a complex inventory trading system).
### Durable Objects (DO)
*   **Pros:** Strong consistency, real-time state (WebSockets), transactional integrity.
*   **Cons:** Higher cost, higher latency for users far from the DO's location.
*   **Verdict:** We might use DOs in the future for **Multiplayer Rooms** or **Real-time Co-op**, but for static leaderboards and profiles, it introduces unnecessary complexity and latency.
## Addressing Efficiency Concerns
**Client Question:** *"Is KV the most efficient way?"*
**Answer:** **Yes.** For this specific use case (high read/write ratio, simple data structures, global audience), KV is the most performant and cost-effective solution.
*   **Reads:** Served from the edge (fastest possible).
*   **Writes:** Propagated globally (fast enough for leaderboards).
*   **Complexity:** Minimal overhead in code.
We have implemented a **"Smart Merge"** strategy in our backend (`worker/kv-storage.ts`) to handle the eventual consistency nature of KV, ensuring that high scores and unlocked items are never lost even if a user plays on multiple devices simultaneously.