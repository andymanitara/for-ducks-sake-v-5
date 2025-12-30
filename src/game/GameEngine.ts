import { GAME_CONSTANTS, SKINS } from './constants';
import { Duck, Hazard, ScreenShake, Shockwave, RunStats, GhostData, ParticleType } from '../types/game';
import { InputSystem } from './InputSystem';
import { Renderer } from './Renderer';
import { useGameStore } from '@/lib/store';
import { createRNG } from '@/lib/rng';
import { soundSynth } from './SoundSynth';
import { haptics } from './Haptics';
import { HazardSystem } from './engine/HazardSystem';
import { ParticleSystem } from './engine/ParticleSystem';
import { CollisionSystem } from './engine/CollisionSystem';
import { ReplaySystem } from './engine/ReplaySystem';
export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: Renderer;
  private input: InputSystem;
  private resizeObserver: ResizeObserver | null = null;
  // Sub-Systems
  private hazardSystem: HazardSystem;
  private particleSystem: ParticleSystem;
  private collisionSystem: CollisionSystem;
  private replaySystem: ReplaySystem;
  private animationId: number = 0;
  private lastTime: number = 0;
  private lastFrameTime: number = 0;
  private isRunning: boolean = false;
  // Game State
  private duck: Duck;
  private timeElapsed: number = 0;
  private rng: () => number;
  private screenShake: ScreenShake = { x: 0, y: 0, intensity: 0, duration: 0, startTime: 0 };
  private shockwave: Shockwave | null = null;
  // Stats & Logic
  private nearMisses: number = 0;
  private maxSpeed: number = 0;
  private explosionsTriggered: number = 0;
  private showerPushes: number = 0;
  private wrenchDodges: number = 0;
  private ballsPocketed: number = 0;
  private killer: Hazard | null = null;
  private hasSubmittedScore: boolean = false;
  private internalMode: 'playing' | 'dying' | 'replay' = 'playing';
  private lastReplayInternalMode: 'playing' | 'dying' | 'replay' = 'playing';
  private dyingTimer: number = 0;
  private replayTime: number = 0;
  private isRecording: boolean = false;
  // Ghosts
  private ghostRun: GhostData | null = null;
  private ghostIndex: number = 0;
  private opponentGhostRun: GhostData | null = null;
  private opponentGhostIndex: number = 0;
  // Visuals
  private cameraOffset: { x: number, y: number } = { x: 0, y: 0 };
  private currentZoom: number = 1;
  private timeScale: number = 1;
  private logicalWidth: number;
  private logicalHeight: number;
  private effectiveHeight: number; // New: Height minus safe area
  private trailTimer: number = 0;
  private quackTimer: number = 0;
  private wasInputActive: boolean = false;
  private newRecordTriggered: boolean = false;
  private previousBest: number = 0;
  private lastDifficultyTier: number = 0;
  private lastMilestoneTime: number = 0;
  // Dynamic Safe Area
  private safeAreaInsets: { bottom: number } = { bottom: 0 };
  constructor(canvas: HTMLCanvasElement, seed?: string) {
    if (!canvas) throw new Error("GameEngine initialized without canvas");
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    // Initial sizing - Use robust logic immediately
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let clientW = canvas.clientWidth;
    let clientH = canvas.clientHeight;
    // If client dims are 0 (hidden/detached), try parent
    if ((clientW === 0 || clientH === 0) && canvas.parentElement) {
        clientW = canvas.parentElement.clientWidth;
        clientH = canvas.parentElement.clientHeight;
    }
    // Fallback to window only if absolutely necessary
    if (clientW === 0) clientW = window.innerWidth;
    if (clientH === 0) clientH = window.innerHeight;
    let w = Math.floor(clientW * dpr);
    let h = Math.floor(clientH * dpr);
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.logicalWidth = w / dpr;
    this.logicalHeight = h / dpr;
    this.effectiveHeight = this.logicalHeight; // Default init
    this.renderer = new Renderer(this.ctx, this.logicalWidth, this.logicalHeight);
    this.input = new InputSystem();
    this.input.attach(canvas);
    this.rng = createRNG(seed || Math.random().toString());
    // Initialize Systems
    this.hazardSystem = new HazardSystem(this.rng);
    this.particleSystem = new ParticleSystem();
    this.collisionSystem = new CollisionSystem();
    this.replaySystem = new ReplaySystem();
    this.duck = this.createDuck();
    // Setup ResizeObserver for robust scaling
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(canvas);
    window.addEventListener('resize', this.handleResize);
    // Trigger initial resize to ensure correct state and sync renderer
    this.handleResize();
    // Force initial draw to prevent white flash
    this.draw(0);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }
  public setSafeArea(insets: { bottom: number }) {
      this.safeAreaInsets = insets;
      this.handleResize();
  }
  private createDuck(): Duck {
      return {
          id: 'player', type: 'duck',
          position: { x: this.logicalWidth / 2, y: this.logicalHeight / 2 },
          velocity: { x: 0, y: 0 },
          radius: GAME_CONSTANTS.DUCK_RADIUS,
          color: GAME_CONSTANTS.COLORS.DUCK,
          state: 'idle', rotation: 0, wobble: 0, skinId: 'default',
          trail: [], blinkTimer: 0, scale: { x: 1, y: 1 },
          panicLevel: 0, faceDirection: 0
      };
  }
  private handleResize = () => {
    if (!this.canvas) return;
    // 1. Robust Dimensions Retrieval
    const rect = this.canvas.getBoundingClientRect();
    let clientW = rect.width;
    let clientH = rect.height;
    // Fallbacks for hidden/detached states
    if (clientW === 0 || clientH === 0) {
        clientW = this.canvas.clientWidth;
        clientH = this.canvas.clientHeight;
    }
    if ((clientW === 0 || clientH === 0) && this.canvas.parentElement) {
        clientW = this.canvas.parentElement.clientWidth;
        clientH = this.canvas.parentElement.clientHeight;
    }
    if (clientW === 0) clientW = window.innerWidth;
    if (clientH === 0) clientH = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // 2. Logical Size Calculation - Strictly trust the container/rect
    let logicalWidth = clientW;
    let logicalHeight = clientH;
    // Safety check to prevent zero height
    if (logicalHeight === 0) logicalHeight = window.innerHeight;
    // 3. Physical Size Update
    const physicalWidth = Math.floor(logicalWidth * dpr);
    const physicalHeight = Math.floor(logicalHeight * dpr);
    // Prevent zero-size crash
    if (physicalWidth === 0 || physicalHeight === 0) return;
    if (this.canvas.width !== physicalWidth || this.canvas.height !== physicalHeight) {
        this.canvas.width = physicalWidth;
        this.canvas.height = physicalHeight;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    this.logicalWidth = logicalWidth;
    this.logicalHeight = logicalHeight;
    // 4. Safe Area Calculation
    const safeBottom = this.safeAreaInsets.bottom > 0 ? this.safeAreaInsets.bottom + GAME_CONSTANTS.MOBILE_BOTTOM_BUFFER : 0;
    this.effectiveHeight = this.logicalHeight - safeBottom;
    // Pass safeBottom to renderer for background adjustments
    this.renderer.resize(this.logicalWidth, this.logicalHeight, safeBottom);
    // 5. Bounds Enforcement
    if (this.duck) {
        const r = this.duck.radius;
        this.duck.position.x = Math.max(r, Math.min(this.logicalWidth - r, this.duck.position.x));
        // Use effectiveHeight for bottom clamp
        this.duck.position.y = Math.max(r, Math.min(this.effectiveHeight - r, this.duck.position.y));
    }
  };
  private handleVisibilityChange = () => {
      if (document.hidden && this.isRunning && this.internalMode === 'playing') {
          const store = useGameStore.getState();
          if (store.status === 'playing') store.togglePause();
      }
  };
  public static isVideoSupported() { return ReplaySystem.isVideoSupported(); }
  public start() {
    this.reset();
    if (!this.isRunning) {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.lastFrameTime = this.lastTime;
        this.loop(this.lastTime);
    }
    useGameStore.getState().setStatus('playing');
  }
  public resume() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFrameTime = this.lastTime;
    this.loop(this.lastTime);
  }
  public pause() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
  }
  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
  }
  public reset() {
    const store = useGameStore.getState();
    const skinId = store.profile?.equippedSkinId || 'default';
    const skin = SKINS.find(s => s.id === skinId) || SKINS[0];
    let seed = Math.random().toString(36).substring(7);
    if (store.gameMode === 'daily') seed = new Date().toISOString().split('T')[0];
    else if (store.gameMode === 'challenge' && store.pendingSeed) seed = store.pendingSeed;
    store.setLastSeed(seed);
    this.rng = createRNG(seed);
    this.duck = this.createDuck();
    this.duck.skinId = skin.id;
    this.duck.color = skin.color;
    this.hazardSystem.reset(this.rng);
    this.particleSystem.reset();
    this.replaySystem.reset();
    this.renderer.reset();
    this.timeElapsed = 0;
    this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0, startTime: 0 };
    this.shockwave = null;
    this.nearMisses = 0;
    this.maxSpeed = 0;
    this.explosionsTriggered = 0;
    this.showerPushes = 0;
    this.wrenchDodges = 0;
    this.ballsPocketed = 0;
    // Explicitly clear references to help GC
    this.killer = null;
    this.ghostRun = null;
    this.opponentGhostRun = null;
    this.hasSubmittedScore = false;
    this.internalMode = 'playing';
    this.dyingTimer = 0;
    this.timeScale = 1;
    this.currentZoom = 1;
    this.quackTimer = Math.random() * 10 + 5;
    // Ghosts Logic
    const isCompetitiveMode = store.gameMode === 'daily' || store.gameMode === 'challenge';
    const isRacingGhost = !!store.activeOpponentGhost;
    const allowPBGhost = isCompetitiveMode || isRacingGhost;
    if (store.isGhostEnabled && allowPBGhost && store.pbGhost) {
        try { this.ghostRun = JSON.parse(store.pbGhost); } catch (e) { this.ghostRun = null; }
    } else {
        this.ghostRun = null;
    }
    if (store.isGhostEnabled && store.activeOpponentGhost) {
        try { this.opponentGhostRun = JSON.parse(store.activeOpponentGhost); } catch (e) { this.opponentGhostRun = null; }
    } else {
        this.opponentGhostRun = null;
    }
    this.ghostIndex = 0;
    this.opponentGhostIndex = 0;
    this.previousBest = store.profile?.mapStats?.[store.biome]?.bestTime || 0;
    this.newRecordTriggered = false;
    useGameStore.getState().setScore(0);
  }
  public destroy() {
    this.stop();
    this.reset(); // Explicit cleanup of subsystems
    this.input.detach();
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
  public enterReplayMode() {
      const buffer = this.replaySystem.getReplayBuffer();
      if (buffer.length === 0) {
          this.replaySystem.recordFrame(this.duck, [], this.timeElapsed, this.hasSubmittedScore, this.internalMode, this.dyingTimer);
      }
      this.internalMode = 'replay';
      this.lastReplayInternalMode = 'playing';
      this.replayTime = buffer.length > 0 ? buffer[0].timestamp : 0;
      const store = useGameStore.getState();
      const bestTime = store.profile?.bestTime || 0;
      if (store.score >= bestTime && this.replaySystem.getGhostBuffer().length > 0) {
          const downsampled = this.replaySystem.getGhostBuffer().filter((_, i) => i % 4 === 0);
          store.setPbGhost(JSON.stringify(downsampled));
      }
      if (!this.isRunning) {
          this.isRunning = true;
          this.lastTime = performance.now();
          this.lastFrameTime = this.lastTime;
          this.loop(this.lastTime);
      }
  }
  public async generateReplayVideo(): Promise<Blob | null> {
      // 1. Get buffer and validate
      const buffer = this.replaySystem.getReplayBuffer();
      if (buffer.length < 2) return null;
      // 2. Calculate dynamic duration
      const startTime = buffer[0].timestamp;
      const endTime = buffer[buffer.length - 1].timestamp;
      // Add padding to ensure we capture the final state/death animation fully
      const duration = (endTime - startTime) + 1000;
      // 3. Strict State Reset for Synchronization
      this.internalMode = 'replay';
      this.replayTime = startTime;
      this.lastReplayInternalMode = 'playing'; // Reset mode tracker to re-trigger death events
      this.particleSystem.reset(); // Clear any existing particles to start fresh
      // 4. Start Recording
      this.isRunning = true;
      this.isRecording = true;
      // Pass calculated duration to ReplaySystem
      const blob = await this.replaySystem.generateVideo(this.canvas, duration);
      this.isRecording = false;
      return blob;
  }
  private loop = (timestamp: number) => {
    if (!this.isRunning) return;
    const isBatterySaver = useGameStore.getState().isBatterySaver;
    const targetFPS = isBatterySaver ? 30 : 60;
    const interval = 1000 / targetFPS;
    const elapsed = timestamp - this.lastFrameTime;
    if (elapsed > interval) {
        if (this.lastFrameTime === 0) { this.lastFrameTime = timestamp; this.lastTime = timestamp; }
        this.lastFrameTime = timestamp - (elapsed % interval);
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        const safeDt = Math.min(dt, 0.1);
        this.update(safeDt);
        this.draw(safeDt);
    }
    this.animationId = requestAnimationFrame(this.loop);
  };
  private update(dt: number) {
    if (this.internalMode === 'replay') {
        this.replayTime += dt * 1000;
        this.particleSystem.update(dt, this.logicalWidth, this.effectiveHeight); // Use effectiveHeight
        const buffer = this.replaySystem.getReplayBuffer();
        const frame = buffer.find(f => f.timestamp >= this.replayTime);
        if (frame) {
            this.duck.position.x = frame.x;
            this.duck.position.y = frame.y;
            this.duck.rotation = frame.rotation;
            this.duck.scale = frame.scale;
            this.duck.faceDirection = frame.faceDirection;
            this.duck.skinId = frame.skinId;
            this.duck.velocity.x = frame.vx || 0;
            this.duck.velocity.y = frame.vy || 0;
            if (frame.state) this.duck.state = frame.state;
            const currentFrameMode = frame.internalMode || 'playing';
            if (this.lastReplayInternalMode === 'playing' && currentFrameMode === 'dying') {
                 const skin = SKINS.find(s => s.id === this.duck.skinId) || SKINS[0];
                 this.particleSystem.spawnDeathFeathers(this.duck.position.x, this.duck.position.y, skin);
                 soundSynth.playDie();
            }
            this.lastReplayInternalMode = currentFrameMode;
            if (frame.hazards) {
                this.hazardSystem.setHazards(frame.hazards);
                this.updatePanicLevel(dt);
            }
        } else if (buffer.length > 0 && this.replayTime > buffer[buffer.length - 1].timestamp + 2000) {
            this.replayTime = buffer[0].timestamp;
            this.particleSystem.reset();
            this.lastReplayInternalMode = 'playing';
        }
        this.trailTimer += dt;
        if (this.trailTimer > 0.05) {
             this.duck.trail.push({ x: this.duck.position.x, y: this.duck.position.y, opacity: 1, width: this.duck.radius * 0.8 });
             const skin = SKINS.find(s => s.id === this.duck.skinId);
             if (skin && skin.trailType && skin.trailType !== 'standard') {
                  this.particleSystem.spawnTrailParticle(skin.trailType as ParticleType, this.duck.position, this.duck.velocity, skin.color);
             }
             this.trailTimer = 0;
        }
        this.duck.trail.forEach(t => { t.opacity -= dt * 2; t.width -= dt * 10; });
        this.duck.trail = this.duck.trail.filter(t => t.opacity > 0 && t.width > 0);
        return;
    }
    const scaledDt = dt * this.timeScale;
    if (this.internalMode === 'dying') {
        this.dyingTimer += dt;
        this.particleSystem.update(dt, this.logicalWidth, this.effectiveHeight); // Use effectiveHeight
        this.duck.trail.forEach(t => { t.opacity -= scaledDt * 2; t.width -= scaledDt * 10; });
        this.duck.trail = this.duck.trail.filter(t => t.opacity > 0 && t.width > 0);
        this.replaySystem.recordFrame(this.duck, this.hazardSystem.getHazards(), this.timeElapsed, this.hasSubmittedScore, this.internalMode, this.dyingTimer);
        if (this.dyingTimer > 1.5) this.finalizeGameOver();
        return;
    }
    this.timeElapsed += scaledDt * 1000;
    useGameStore.getState().setScore(Math.floor(this.timeElapsed));
    // Input & Physics
    const inputState = this.input.getState();
    if (inputState.active && !this.wasInputActive) haptics.soft();
    this.wasInputActive = inputState.active;
    if (inputState.active) {
        const targetVx = inputState.vector.x * GAME_CONSTANTS.DUCK_SPEED;
        const targetVy = inputState.vector.y * GAME_CONSTANTS.DUCK_SPEED;
        this.duck.velocity.x += (targetVx - this.duck.velocity.x) * GAME_CONSTANTS.DUCK_DAMPING;
        this.duck.velocity.y += (targetVy - this.duck.velocity.y) * GAME_CONSTANTS.DUCK_DAMPING;
        this.duck.state = 'moving';
        this.duck.wobble += scaledDt * GAME_CONSTANTS.DUCK_WOBBLE_SPEED;
        if (Math.abs(this.duck.velocity.x) > 10 || Math.abs(this.duck.velocity.y) > 10) {
            this.duck.faceDirection = Math.atan2(this.duck.velocity.y, this.duck.velocity.x);
        }
    } else {
        this.duck.velocity.x *= (1 - GAME_CONSTANTS.DUCK_DAMPING);
        this.duck.velocity.y *= (1 - GAME_CONSTANTS.DUCK_DAMPING);
        this.duck.state = 'idle';
        this.duck.wobble = 0;
    }
    this.duck.position.x += this.duck.velocity.x * scaledDt;
    this.duck.position.y += this.duck.velocity.y * scaledDt;
    // Bounds - Ensure duck stays within logical dimensions
    const r = this.duck.radius;
    if (this.duck.position.x < r) { this.duck.position.x = r; this.duck.velocity.x = 0; }
    if (this.duck.position.x > this.logicalWidth - r) { this.duck.position.x = this.logicalWidth - r; this.duck.velocity.x = 0; }
    if (this.duck.position.y < r) { this.duck.position.y = r; this.duck.velocity.y = 0; }
    // Updated bottom check with effectiveHeight
    if (this.duck.position.y > this.effectiveHeight - r) {
        this.duck.position.y = this.effectiveHeight - r;
        this.duck.velocity.y = 0;
    }
    // Systems Update
    this.hazardSystem.update(
        scaledDt,
        this.timeElapsed,
        this.logicalWidth,
        this.effectiveHeight, // Use effectiveHeight
        this.duck.position,
        (event, data) => {
            if (event === 'pocket_fall') {
                const h = data as Hazard;
                // Spawn smoke particles at hazard position
                for (let i = 0; i < 5; i++) {
                    this.particleSystem.spawnParticle('smoke', h.position.x, h.position.y);
                }
                this.ballsPocketed++; // Track pocketed balls
                // Visual Feedback
                this.renderer.addFloatingText(h.position.x, h.position.y - 30, "POCKET!", "#FFFFFF");
            } else if (event === 'explosion') {
                this.explosionsTriggered++; // Track explosions
            } else if (event === 'barrage_warning') {
                soundSynth.playWhistle();
                // Rendering is now handled via state polling in draw()
            } else if (event === 'barrage_start') {
                haptics.warning();
            }
        }
    );
    this.particleSystem.update(scaledDt, this.logicalWidth, this.effectiveHeight); // Use effectiveHeight
    // Panic Level Update
    this.updatePanicLevel(scaledDt);
    // Collisions
    const hazards = this.hazardSystem.getHazards();
    // Note: Drone collisions are now handled inside HazardSystem.update()
    // which emits 'explosion' event to update stats.
    for (const h of hazards) {
        if (this.collisionSystem.checkCollision(this.duck, h)) {
            if (h.hazardType === 'shower_jet') {
                // Push logic: Apply force in direction of jet velocity
                const pushStrength = 5.0;
                this.duck.velocity.x += h.velocity.x * scaledDt * pushStrength;
                this.duck.velocity.y += h.velocity.y * scaledDt * pushStrength;
                // Add turbulence
                this.duck.velocity.x += (Math.random() - 0.5) * 300 * scaledDt;
                this.duck.velocity.y += (Math.random() - 0.5) * 300 * scaledDt;
                // Track shower pushes
                if (!h.hasPushedPlayer) {
                    this.showerPushes++;
                    h.hasPushedPlayer = true;
                    // Visual Feedback
                    soundSynth.playSplash();
                    this.renderer.addFloatingText(this.duck.position.x, this.duck.position.y - 50, "SLIP!", "#4FC3F7");
                }
            } else if (h.hazardType === 'explosion') {
                // Push logic: Radial push away from explosion center
                const dx = this.duck.position.x - h.position.x;
                const dy = this.duck.position.y - h.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = 2000; // Strong impulse
                this.duck.velocity.x += (dx / dist) * force * scaledDt;
                this.duck.velocity.y += (dy / dist) * force * scaledDt;
            } else {
                this.gameOver(h);
                break;
            }
        } else if (!h.hasTriggeredCloseCall && this.collisionSystem.checkNearMiss(this.duck, h)) {
            h.hasTriggeredCloseCall = true;
            this.nearMisses++;
            // Track wrench dodges
            if (h.hazardType === 'wrench') {
                this.wrenchDodges++;
                // Visual Feedback
                this.renderer.addFloatingText(this.duck.position.x, this.duck.position.y - 50, "DODGE!", "#C0C0C0");
            }
            const phrases = ["CLOSE!", "NICE!", "WOAH!", "SHARP!", "DODGE!", "YIKES!"];
            const text = phrases[Math.floor(Math.random() * phrases.length)];
            this.renderer.addFloatingText(this.duck.position.x, this.duck.position.y - 50, text, "#40E0D0");
            soundSynth.playWhoosh();
        }
    }
    // Environmental Hazards
    const envHazard = this.collisionSystem.checkEnvironmentHazards(this.duck, this.logicalWidth, this.effectiveHeight, useGameStore.getState().biome); // Use effectiveHeight
    if (envHazard) this.gameOver(envHazard);
    // Recording
    this.replaySystem.recordFrame(this.duck, hazards, this.timeElapsed, this.hasSubmittedScore, this.internalMode, this.dyingTimer);
    // Trail
    this.trailTimer += scaledDt;
    if (this.trailTimer > 0.05) {
        this.duck.trail.push({ x: this.duck.position.x, y: this.duck.position.y, opacity: 1, width: this.duck.radius * 0.8 });
        const skin = SKINS.find(s => s.id === this.duck.skinId);
        if (skin && skin.trailType && skin.trailType !== 'standard') {
             this.particleSystem.spawnTrailParticle(skin.trailType as ParticleType, this.duck.position, this.duck.velocity, skin.color);
        }
        this.trailTimer = 0;
    }
    this.duck.trail.forEach(t => { t.opacity -= scaledDt * 2; t.width -= scaledDt * 10; });
    this.duck.trail = this.duck.trail.filter(t => t.opacity > 0 && t.width > 0);
  }
  private updatePanicLevel(dt: number) {
      const hazards = this.hazardSystem.getHazards();
      let minDistance = Infinity;
      const panicThreshold = GAME_CONSTANTS.VISUALS.PANIC_DISTANCE;
      for (const h of hazards) {
          if (h.hazardType === 'shower_jet' || h.hazardType === 'explosion') continue;
          if (h.spawnTimer < 0.5 && h.hazardType !== 'laser') continue;
          const dx = this.duck.position.x - h.position.x;
          const dy = this.duck.position.y - h.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy) - h.radius - this.duck.radius;
          if (dist < minDistance) minDistance = dist;
      }
      let targetPanic = 0;
      if (minDistance < panicThreshold) {
          const normalized = 1 - (Math.max(0, minDistance) / panicThreshold);
          targetPanic = normalized * normalized;
      }
      const lerpSpeed = 5;
      this.duck.panicLevel += (targetPanic - this.duck.panicLevel) * lerpSpeed * dt;
      this.duck.panicLevel = Math.max(0, Math.min(1, this.duck.panicLevel));
  }
  private gameOver(killer: Hazard) {
      this.internalMode = 'dying';
      this.duck.state = 'dead';
      this.killer = killer;
      this.timeScale = 0.2;
      soundSynth.playDie();
      haptics.impact();
      const skin = SKINS.find(s => s.id === this.duck.skinId) || SKINS[0];
      this.particleSystem.spawnDeathFeathers(this.duck.position.x, this.duck.position.y, skin);
      if (!useGameStore.getState().isReducedMotion) {
          this.screenShake = { x: 0, y: 0, intensity: 20, duration: 0.5, startTime: performance.now() };
      }
  }
  private finalizeGameOver() {
      if (this.hasSubmittedScore) return;
      this.hasSubmittedScore = true;
      useGameStore.getState().setStatus('game_over');
      const stats: RunStats = {
          score: Math.floor(this.timeElapsed),
          nearMisses: this.nearMisses,
          topSpeed: Math.round(this.maxSpeed),
          biome: useGameStore.getState().biome,
          killerHazardType: this.killer?.hazardType,
          isNewRecord: this.newRecordTriggered,
          explosionsTriggered: this.explosionsTriggered,
          showerPushes: this.showerPushes,
          wrenchDodges: this.wrenchDodges,
          ballsPocketed: this.ballsPocketed
      };
      useGameStore.getState().updateStats(stats);
      useGameStore.getState().startReplayGeneration();
      this.internalMode = 'replay';
      const buffer = this.replaySystem.getReplayBuffer();
      this.replayTime = buffer.length > 0 ? buffer[0].timestamp : 0;
  }
  private draw(dt: number) {
    // Clear full canvas area to avoid artifacts in non-visible zones
    // We use the canvas internal height divided by current scale (dpr)
    // Note: ctx.setTransform was set in handleResize with dpr scaling
    // So we clear in logical coordinates, but covering the full physical canvas
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fullHeight = this.canvas.height / dpr;
    this.ctx.clearRect(0, 0, this.logicalWidth, fullHeight);
    this.ctx.save();
    // Shake & Zoom
    this.ctx.translate(this.screenShake.x, this.screenShake.y);
    const cx = this.logicalWidth / 2;
    const cy = this.logicalHeight / 2;
    this.ctx.translate(cx, cy);
    this.ctx.scale(this.currentZoom, this.currentZoom);
    this.ctx.translate(-cx, -cy);
    this.renderer.drawBackground(useGameStore.getState().biome);
    this.ctx.save();
    this.ctx.translate(0, -this.cameraOffset.y);
    this.renderer.drawParticles(this.particleSystem.getAmbientParticles());
    this.hazardSystem.getHazards().forEach(h => this.renderer.drawHazard(h));
    // Ghosts Drawing
    const isGhostEnabled = useGameStore.getState().isGhostEnabled;
    if (this.internalMode === 'playing' && isGhostEnabled) {
        if (this.ghostRun) {
            while (this.ghostIndex < this.ghostRun.length - 1 && this.ghostRun[this.ghostIndex].timestamp < this.timeElapsed) {
                this.ghostIndex++;
            }
            const frame = this.ghostRun[this.ghostIndex];
            if (frame) {
                this.renderer.drawGhost(frame, 'PB');
            }
        }
        if (this.opponentGhostRun) {
             while (this.opponentGhostIndex < this.opponentGhostRun.length - 1 && this.opponentGhostRun[this.opponentGhostIndex].timestamp < this.timeElapsed) {
                this.opponentGhostIndex++;
            }
            const frame = this.opponentGhostRun[this.opponentGhostIndex];
            if (frame) {
                this.renderer.drawGhost(frame, 'RIVAL', '#FF0000');
            }
        }
    }
    // Draw particles (trails) BEFORE duck to ensure they appear underneath
    this.renderer.drawParticles(this.particleSystem.getParticles());
    this.renderer.drawDuck(this.duck);
    if (this.shockwave) this.renderer.drawShockwave(this.shockwave);
    if (this.internalMode === 'playing') this.renderer.drawJoystick(this.input.getState());
    this.ctx.restore(); // End Camera
    this.ctx.restore(); // End Shake/Zoom
    this.renderer.drawPanicVignette(this.duck.panicLevel);
    if (this.internalMode === 'playing') {
        this.renderer.drawUIEffects(dt);
        // Draw Barrage Overlay (State-Driven)
        const barrageState = this.hazardSystem.getBarrageState();
        this.renderer.drawBarrageOverlay(barrageState);
    }
    if (this.internalMode === 'replay') {
        this.renderer.drawReplayOverlay();
        this.renderer.drawInGameTime(this.replayTime);
    }
    if (this.isRecording) this.renderer.drawVideoOverlay(this.timeElapsed);
  }
}