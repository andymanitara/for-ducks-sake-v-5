# For Ducks Sake
[cloudflarebutton]
> A fast-paced, top-down survival game where you guide a cute duck through chaotic hazards using an invisible joystick.
## About The Project
For Ducks Sake is a high-energy, top-down 2D survival game designed with a 'Kid Playful' aesthetic—featuring bright flat colors, thick outlines, and expressive geometric characters.
The player controls a cute, round duck using an innovative 'invisible joystick' mechanic: touching anywhere on the screen anchors a virtual stick, allowing for precise 360-degree movement. The goal is simple: survive as long as possible against escalating waves of hazards in three distinct biomes (Lily Pond, Snowy Glacier, City Park).
The game features a custom HTML5 Canvas engine for smooth 60fps performance on mobile and desktop. The core loop involves dodging rolling logs, falling icicles, and bouncing drones. As time progresses, the difficulty ramps up with faster hazards and complex patterns.
## Key Features
*   **Invisible Joystick Control**: Intuitive touch mechanics where the joystick appears wherever you touch the screen.
*   **Dynamic Biomes**: Survive through three distinct themes: Lily Pond, Snowy Glacier, and City Park.
*   **Escalating Difficulty**: Hazards spawn continuously with increasing speed and complexity.
*   **Cosmetic System**: Unlockable skins, trails, and death animations.
*   **Leaderboards**: Daily challenges, friends leaderboards, and seasonal rankings.
*   **Social Features**: Ghost replays and instant run sharing.
*   **High Performance**: Custom HTML5 Canvas engine running at a smooth 60fps.
## Technology Stack
This project is built with a modern, performance-focused stack:
*   **Frontend Framework**: React 18
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS v3
*   **UI Components**: Shadcn/UI (Radix Primitives)
*   **Animations**: Framer Motion & Canvas Confetti
*   **State Management**: Zustand
*   **Backend/API**: Cloudflare Workers (Hono)
*   **Language**: TypeScript
## Getting Started
Follow these instructions to set up the project locally for development.
### Prerequisites
*   Node.js (v18 or higher)
*   Bun (Package Manager)
### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/for-ducks-sake.git
    cd for-ducks-sake
    ```
2.  Install dependencies using Bun:
    ```bash
    bun install
    ```
3.  Start the development server:
    ```bash
    bun run dev
    ```
The application will be available at `http://localhost:3000`.
## Development
### Project Structure
*   `src/`: React frontend source code
    *   `components/`: Reusable UI components (Shadcn/UI)
    *   `pages/`: Application views
    *   `hooks/`: Custom React hooks
    *   `lib/`: Utility functions
*   `worker/`: Cloudflare Workers backend code
    *   `index.ts`: Main worker entry point
    *   `userRoutes.ts`: API route definitions
### Scripts
*   `bun run dev`: Start local development server
*   `bun run build`: Build the frontend for production
*   `bun run preview`: Preview the production build locally
*   `bun run deploy`: Deploy to Cloudflare Workers
*   `bun run lint`: Run ESLint
## Deployment
This project is designed to be deployed on Cloudflare Workers.
### Quick Deploy
[cloudflarebutton]
### Manual Deployment
1.  Authenticate with Cloudflare:
    ```bash
    npx wrangler login
    ```
2.  Deploy the project:
    ```bash
    bun run deploy
    ```
This command builds the React application and deploys it along with the Worker backend to the Cloudflare edge network.
## Documentation
*   [Data Management & Server Reset Guide](./DATA_MANAGEMENT.md) - Learn about server wipes, data persistence, and the self-healing architecture.
*   [Connecting Real Data](./CONNECT_DATA.md) - Instructions for setting up Cloudflare KV.
*   [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Detailed deployment instructions.
*   [Auth Setup](./AUTH_SETUP.md) - Setting up Google/Apple OAuth.
## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
## License
Distributed under the MIT License. See `LICENSE` for more information.