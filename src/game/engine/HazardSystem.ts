import { Hazard, Vector2D, BarrageState } from '@/types/game';
import { GAME_CONSTANTS, BIOME_DIFFICULTY, COACH_BARRAGE } from '@/game/constants';
import { soundSynth } from '@/game/SoundSynth';
import { haptics } from '@/game/Haptics';
import { useGameStore } from '@/lib/store';
export class HazardSystem {
  private hazards: Hazard[] = [];
  private hazardTimer: number = 0;
  private rng: () => number;
  // Coach Barrage State
  private barrageTimer: number = 0;
  private barrageState: 'idle' | 'warning' | 'active' = 'idle';
  private nextBarrageInterval: number = 0;
  private barrageDuration: number = 0;
  private barrageElapsed: number = 0;
  private barrageSpawnTimer: number = 0;
  private barrageDirection: number = 0; // 0: Top, 1: Right, 2: Bottom, 3: Left
  constructor(rng: () => number) {
    this.rng = rng;
    this.reset(rng);
  }
  public reset(rng: () => number) {
    this.hazards = [];
    this.hazardTimer = 0;
    this.rng = rng;
    this.barrageTimer = 0;
    this.barrageState = 'idle';
    this.nextBarrageInterval = COACH_BARRAGE.INTERVAL_INITIAL;
    this.barrageDuration = 0;
    this.barrageElapsed = 0;
    this.barrageSpawnTimer = 0;
    this.barrageDirection = 0;
  }
  public getHazards() {
    return this.hazards;
  }
  public setHazards(hazards: Hazard[]) {
    this.hazards = hazards;
  }
  public getBarrageState(): BarrageState {
      let progress = 0;
      let timeLeft = 0;
      if (this.barrageState === 'warning') {
          timeLeft = Math.max(0, this.nextBarrageInterval - this.barrageTimer);
          progress = 1 - (timeLeft / COACH_BARRAGE.WARNING_TIME);
      } else if (this.barrageState === 'active') {
          timeLeft = Math.max(0, this.barrageDuration - this.barrageElapsed);
          progress = this.barrageElapsed / this.barrageDuration;
      } else {
          // Idle but check if warning is imminent for smooth UI transition if needed
          // Currently just return 0 progress
          timeLeft = 0;
          progress = 0;
      }
      return {
          state: this.barrageState,
          direction: this.barrageDirection,
          progress: Math.max(0, Math.min(1, progress)),
          timeLeft
      };
  }
  public update(dt: number, timeElapsed: number, width: number, height: number, duckPos: Vector2D, onEvent?: (event: string, data: any) => void) {
    const biome = useGameStore.getState().biome;
    const difficulty = BIOME_DIFFICULTY[biome] || BIOME_DIFFICULTY['default'];
    // --- Coach Barrage Logic (Gym Only) ---
    if (biome === 'gym') {
        if (this.barrageState === 'idle') {
            this.barrageTimer += dt * 1000;
            if (this.barrageTimer > this.nextBarrageInterval - COACH_BARRAGE.WARNING_TIME) {
                this.barrageState = 'warning';
                // Determine direction for this wave ONCE at the start of warning
                // User Request: Only Left (3) or Right (1)
                this.barrageDirection = this.rng() > 0.5 ? 1 : 3;
                if (onEvent) onEvent('barrage_warning', this.barrageDirection);
            }
        } else if (this.barrageState === 'warning') {
            this.barrageTimer += dt * 1000;
            if (this.barrageTimer > this.nextBarrageInterval) {
                this.barrageState = 'active';
                // Calculate duration based on survival time (escalation)
                // User Request: Fixed 2000ms, remove escalation logic for duration
                this.barrageDuration = 2000; // Fixed 2s
                this.barrageElapsed = 0;
                this.barrageSpawnTimer = 0;
                if (onEvent) onEvent('barrage_start', null);
            }
        } else if (this.barrageState === 'active') {
            this.barrageElapsed += dt * 1000;
            this.barrageSpawnTimer += dt * 1000;
            // Escalated spawn rate
            const escalation = Math.min(1, timeElapsed / 60000);
            const currentSpawnRate = COACH_BARRAGE.SPAWN_RATE * (1 - escalation * 0.3); // Up to 30% faster
            if (this.barrageSpawnTimer > currentSpawnRate) {
                this.spawnBarrageHazard(width, height, duckPos, timeElapsed);
                this.barrageSpawnTimer = 0;
            }
            if (this.barrageElapsed > this.barrageDuration) {
                this.barrageState = 'idle';
                this.barrageTimer = 0;
                // Next interval decreases with time
                const nextInterval = Math.max(COACH_BARRAGE.INTERVAL_MIN, COACH_BARRAGE.INTERVAL_INITIAL - (timeElapsed / 1000) * 100);
                this.nextBarrageInterval = nextInterval;
            }
        }
    }
    // --- Normal Spawning ---
    // Suppress normal spawning during active barrage in Gym
    if (biome !== 'gym' || this.barrageState !== 'active') {
        this.hazardTimer += dt * 1000;
        const spawnRate = Math.max(
            difficulty.hazardSpawnCap,
            difficulty.spawnRateInitial - (timeElapsed / 1000) * difficulty.spawnRateDecay
        );
        if (this.hazardTimer > spawnRate) {
            this.spawnHazard(width, height, timeElapsed, difficulty, duckPos);
            this.hazardTimer = 0;
        }
    }
    // Check drone collisions - Pass onEvent to notify GameEngine of explosions
    this.handleDroneCollisions(onEvent);
    // Check pool ball pockets if in billiards biome
    if (biome === 'billiards') {
        this.handlePoolBallPockets(width, height, onEvent);
    }
    // Updates
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      // Fade In
      if (h.aiState !== 'leave' && h.spawnTimer < 1) {
          h.spawnTimer += dt / GAME_CONSTANTS.ANIMATION.SPAWN_FADE_DURATION;
          if (h.spawnTimer > 1) h.spawnTimer = 1;
      }
      // Explosion Lifecycle
      if (h.hazardType === 'explosion') {
          h.aiTimer = (h.aiTimer || 0) + dt;
          if (h.aiTimer > GAME_CONSTANTS.EXPLOSION_DURATION) {
              this.hazards.splice(i, 1);
              continue;
          }
      }
      // AI Updates - PASS WIDTH AND HEIGHT HERE
      this.updateHazardAI(h, dt, duckPos, width, height, onEvent);
      // Physics (Movement)
      if (h.hazardType !== 'shower_jet' && h.hazardType !== 'explosion') {
          h.position.x += h.velocity.x * dt;
          h.position.y += h.velocity.y * dt;
          if (h.shape === 'rectangle' || h.hazardType === 'snowball' || h.hazardType === 'ornament') {
            h.rotation += dt * 2;
          }
      } else if (h.hazardType === 'shower_jet') {
          h.aiTimer = (h.aiTimer || 0) + dt;
          if (h.aiTimer > 3.0) {
              this.hazards.splice(i, 1);
              continue;
          }
      }
      // Bouncing
      if (h.maxBounces !== undefined && (h.bounces || 0) < h.maxBounces) {
          this.handleBounce(h, width, height);
      }
      // Boundary Check
      if (h.hazardType !== 'laser' && h.hazardType !== 'explosion') {
          const buffer = 150;
          const maxDim = Math.max(h.width || 0, h.height || 0, h.radius * 2) / 2;
          if (
            h.position.x + maxDim < -buffer ||
            h.position.x - maxDim > width + buffer ||
            h.position.y + maxDim < -buffer ||
            h.position.y - maxDim > height + buffer
          ) {
            this.hazards.splice(i, 1);
            continue;
          }
      } else if (h.hazardType === 'laser') {
          if (h.aiState === 'active' && (h.aiTimer || 0) > GAME_CONSTANTS.AI.LASER_ACTIVE_TIME) {
              this.hazards.splice(i, 1);
              continue;
          }
      }
    }
  }
  private spawnHazard(width: number, height: number, timeElapsed: number, difficulty: any, duckPos: Vector2D) {
      const biome = useGameStore.getState().biome;
      const rand = this.rng();
      let pattern = 'random';
      // Simple probability for patterns
      if (rand < 0.15) pattern = 'line';
      else if (rand < 0.20) pattern = 'surround';
      this.spawnRandomHazard(width, height, difficulty, biome, pattern);
  }
  private spawnBarrageHazard(w: number, h: number, duckPos: Vector2D, timeElapsed: number) {
      // Barrage is ALWAYS wrenches now
      const type: Hazard['hazardType'] = 'wrench';
      // STRICTLY use the pre-determined direction for this wave
      // This ensures all wrenches come from the same side as the warning
      const edge = this.barrageDirection;
      let x = 0, y = 0;
      const buffer = 50;
      // FIXED POINT SPAWNING: Use center of the edge instead of random position
      switch(edge) {
          case 0: // Top
              x = w / 2;
              y = -buffer;
              break;
          case 1: // Right
              x = w + buffer;
              y = h / 2;
              break;
          case 2: // Bottom
              x = w / 2;
              y = h + buffer;
              break;
          case 3: // Left
              x = -buffer;
              y = h / 2;
              break;
          default: // Fallback to Top
              x = w / 2;
              y = -buffer;
              break;
      }
      // Aim at duck with variance
      const dx = duckPos.x - x;
      const dy = duckPos.y - y;
      const angle = Math.atan2(dy, dx);
      // Variance decreases slightly with time (more accurate) but keeps some for dodgeability
      const variance = (this.rng() - 0.5) * 0.5;
      const finalAngle = angle + variance;
      // User Request: Slow down wrenches
      // Previous: const speed = 600 + (timeElapsed / 1000) * 5;
      // New: const speed = 400 + (timeElapsed / 1000) * 2;
      const speed = 400 + (timeElapsed / 1000) * 2;
      const vx = Math.cos(finalAngle) * speed;
      const vy = Math.sin(finalAngle) * speed;
      const shape: Hazard['shape'] = 'rectangle';
      const width = GAME_CONSTANTS.HAZARD_WRENCH_WIDTH;
      const height = GAME_CONSTANTS.HAZARD_WRENCH_HEIGHT;
      const color = GAME_CONSTANTS.COLORS.HAZARD_WRENCH;
      const radius = 0; // Not used for rectangle
      this.hazards.push({
          id: this.rng().toString(36).substr(2, 9),
          type: 'hazard',
          hazardType: type,
          shape,
          position: { x, y },
          velocity: { x: vx, y: vy },
          radius, width, height, rotation: this.rng() * Math.PI * 2,
          color, spawnTimer: 1, wobbleOffset: 0,
          aiState: undefined, aiTimer: 0, bounces: 0, maxBounces: 0 // No bounces for barrage
      });
      soundSynth.playHazardSpawn('metal');
  }
  private handleDroneCollisions(onEvent?: (event: string, data: any) => void) {
      const drones = this.hazards.filter(h => h.hazardType === 'drone' && h.aiState !== 'dead');
      const toRemove = new Set<string>();
      for (let i = 0; i < drones.length; i++) {
          for (let j = i + 1; j < drones.length; j++) {
              const d1 = drones[i];
              const d2 = drones[j];
              if (toRemove.has(d1.id) || toRemove.has(d2.id)) continue;
              const dx = d1.position.x - d2.position.x;
              const dy = d1.position.y - d2.position.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < d1.radius + d2.radius) {
                  // Collision!
                  toRemove.add(d1.id);
                  toRemove.add(d2.id);
                  // Spawn Explosion
                  const midX = (d1.position.x + d2.position.x) / 2;
                  const midY = (d1.position.y + d2.position.y) / 2;
                  this.hazards.push({
                      id: Math.random().toString(),
                      type: 'hazard',
                      hazardType: 'explosion',
                      shape: 'circle',
                      position: { x: midX, y: midY },
                      velocity: { x: 0, y: 0 },
                      radius: GAME_CONSTANTS.DRONE_EXPLOSION_RADIUS,
                      width: 0, height: 0, rotation: Math.random() * Math.PI * 2,
                      color: '#FF4500',
                      spawnTimer: 1,
                      wobbleOffset: 0,
                      aiState: 'active',
                      aiTimer: 0
                  });
                  soundSynth.playExplosion();
                  haptics.impact();
                  // Notify GameEngine for stat tracking
                  if (onEvent) {
                      onEvent('explosion', null);
                  }
              }
          }
      }
      if (toRemove.size > 0) {
          this.hazards = this.hazards.filter(h => !toRemove.has(h.id));
      }
  }
  private handlePoolBallPockets(width: number, height: number, onEvent?: (event: string, data: any) => void) {
      const pocketRadius = GAME_CONSTANTS.BILLIARDS_POCKET_RADIUS;
      const pockets = [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: 0, y: height },
          { x: width, y: height },
          { x: 0, y: height / 2 },
          { x: width, y: height / 2 }
      ];
      // Iterate backwards to safely remove
      for (let i = this.hazards.length - 1; i >= 0; i--) {
          const h = this.hazards[i];
          if (h.hazardType.startsWith('pool_ball')) {
              // Grace period check: ensure ball is fully spawned/visible
              if (h.spawnTimer < 1.0) continue;
              for (const p of pockets) {
                  const dx = h.position.x - p.x;
                  const dy = h.position.y - p.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist < pocketRadius) {
                      if (onEvent) onEvent('pocket_fall', h);
                      this.hazards.splice(i, 1);
                      soundSynth.playFall();
                      break;
                  }
              }
          }
      }
  }
  private handleBounce(h: Hazard, width: number, height: number) {
      const boundRadius = h.shape === 'rectangle' ? Math.max(h.width, h.height) / 2 : h.radius;
      let bounced = false;
      if (h.position.x < boundRadius && h.velocity.x < 0) {
          h.velocity.x = -h.velocity.x; h.position.x = boundRadius; bounced = true;
      } else if (h.position.x > width - boundRadius && h.velocity.x > 0) {
          h.velocity.x = -h.velocity.x; h.position.x = width - boundRadius; bounced = true;
      } else if (h.position.y < boundRadius && h.velocity.y < 0) {
          h.velocity.y = -h.velocity.y; h.position.y = boundRadius; bounced = true;
      } else if (h.position.y > height - boundRadius && h.velocity.y > 0) {
          h.velocity.y = -h.velocity.y; h.position.y = height - boundRadius; bounced = true;
      }
      if (bounced) {
          h.bounces = (h.bounces || 0) + 1;
          if (h.hazardType.startsWith('pool_ball')) soundSynth.playClack();
          else soundSynth.playBounce();
      }
  }
  private updateHazardAI(h: Hazard, dt: number, duckPos: Vector2D, width: number, height: number, onEvent?: (event: string, data: any) => void) {
      if (!h.aiState) return;
      h.aiTimer = (h.aiTimer || 0) + dt;
      if (h.hazardType === 'frog') {
          if (h.aiState === 'idle') {
              h.velocity = { x: 0, y: 0 };
              if (h.aiTimer > GAME_CONSTANTS.AI.FROG_IDLE_TIME) {
                  h.aiState = 'charge';
                  h.aiTimer = 0;
                  const dx = duckPos.x - h.position.x;
                  const dy = duckPos.y - h.position.y;
                  const angle = Math.atan2(dy, dx);
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const inaccuracy = (this.rng() - 0.5) * 0.6;
                  const finalAngle = angle + inaccuracy;
                  h.target = { x: Math.cos(finalAngle) * dist, y: Math.sin(finalAngle) * dist };
              }
          } else if (h.aiState === 'charge') {
              if (h.aiTimer > GAME_CONSTANTS.AI.FROG_CHARGE_TIME) {
                  h.aiState = 'jump';
                  h.aiTimer = 0;
                  if (h.target) {
                      const dist = Math.sqrt(h.target.x**2 + h.target.y**2);
                      const speed = GAME_CONSTANTS.AI.FROG_JUMP_SPEED;
                      h.velocity = { x: (h.target.x / dist) * speed, y: (h.target.y / dist) * speed };
                  }
                  soundSynth.playMove();
              }
          } else if (h.aiState === 'jump') {
              h.velocity.x *= 0.98;
              h.velocity.y *= 0.98;
              if (Math.sqrt(h.velocity.x**2 + h.velocity.y**2) < 50) {
                  h.aiState = 'leave';
                  h.aiTimer = 0;
                  // Calculate nearest edge to jump away
                  const speed = GAME_CONSTANTS.AI.FROG_JUMP_SPEED;
                  const x = h.position.x;
                  const y = h.position.y;
                  const distLeft = x;
                  const distRight = width - x;
                  const distTop = y;
                  const distBottom = height - y;
                  const minDist = Math.min(distLeft, distRight, distTop, distBottom);
                  if (minDist === distLeft) {
                      h.velocity = { x: -speed, y: 0 };
                  } else if (minDist === distRight) {
                      h.velocity = { x: speed, y: 0 };
                  } else if (minDist === distTop) {
                      h.velocity = { x: 0, y: -speed };
                  } else {
                      h.velocity = { x: 0, y: speed };
                  }
                  soundSynth.playMove();
              }
          }
      } else if (h.hazardType === 'drone') {
          if (h.aiState === 'track') {
              h.trackingTimer = (h.trackingTimer || 0) + dt;
              const dx = duckPos.x - h.position.x;
              const dy = duckPos.y - h.position.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist > 0) {
                  const targetDirX = dx / dist;
                  const targetDirY = dy / dist;
                  const turnSpeed = GAME_CONSTANTS.AI.DRONE_TURN_SPEED * dt;
                  const currentSpeed = Math.sqrt(h.velocity.x**2 + h.velocity.y**2);
                  h.velocity.x += (targetDirX * currentSpeed - h.velocity.x) * turnSpeed;
                  h.velocity.y += (targetDirY * currentSpeed - h.velocity.y) * turnSpeed;
              }
              // Stop tracking after 2.5 seconds and fly away
              if (h.trackingTimer > 2.5) {
                  // Trigger lock event BEFORE changing state to ensure it happens once
                  if (onEvent) onEvent('drone_lock', h);
                  h.aiState = 'leave';
                  h.aiTimer = 0;
                  // Drone now maintains its current velocity vector and continues
                  // in the direction it was last tracking, instead of retreating from center.
              }
          }
      } else if (h.hazardType === 'laser') {
          if (h.aiState === 'warning') {
              if (h.aiTimer < GAME_CONSTANTS.AI.LASER_WARNING_TIME * 0.8 && h.laserEndpoints) {
                  h.laserEndpoints.end = { ...duckPos };
              }
              if (h.aiTimer > GAME_CONSTANTS.AI.LASER_WARNING_TIME) {
                  h.aiState = 'active';
                  h.aiTimer = 0;
                  soundSynth.playSpawn();
                  haptics.warning();
              }
          }
      }
  }
  private spawnRandomHazard(w: number, h: number, difficulty: any, biome: string, pattern: string) {
      if (pattern === 'line') {
        const side = Math.floor(this.rng() * 4);
        const baseSpeed = GAME_CONSTANTS.HAZARD_MIN_SPEED + this.rng() * (GAME_CONSTANTS.HAZARD_MAX_SPEED - GAME_CONSTANTS.HAZARD_MIN_SPEED);
        const speed = baseSpeed * difficulty.hazardSpeedMultiplier;
        const gap = 80;
        for (let i = 0; i < GAME_CONSTANTS.PATTERN_LINE_COUNT; i++) {
            let x = 0, y = 0, vx = 0, vy = 0;
            const offset = (i - 1) * gap;
            switch(side) {
                case 0: x = w/2 + offset; y = -100; vy = speed; break;
                case 1: x = w + 100; y = h/2 + offset; vx = -speed; break;
                case 2: x = w/2 + offset; y = h + 100; vy = -speed; break;
                case 3: x = -100; y = h/2 + offset; vx = speed; break;
            }
            this.createSingleHazard(w, h, x, y, vx, vy, biome);
        }
        return;
      }
      if (pattern === 'surround') {
        const baseSpeed = GAME_CONSTANTS.HAZARD_MIN_SPEED * 0.8;
        const speed = baseSpeed * difficulty.hazardSpeedMultiplier;
        const corners = [
            { x: 0, y: 0, vx: speed, vy: speed },
            { x: w, y: 0, vx: -speed, vy: speed },
            { x: w, y: h, vx: -speed, vy: -speed },
            { x: 0, y: h, vx: speed, vy: -speed }
        ];
        corners.forEach(c => this.createSingleHazard(w, h, c.x, c.y, c.vx, c.vy, biome));
        return;
      }
      const side = Math.floor(this.rng() * 4);
      let x = 0, y = 0, vx = 0, vy = 0;
      const baseSpeed = GAME_CONSTANTS.HAZARD_MIN_SPEED + this.rng() * (GAME_CONSTANTS.HAZARD_MAX_SPEED - GAME_CONSTANTS.HAZARD_MIN_SPEED);
      const speed = baseSpeed * difficulty.hazardSpeedMultiplier;
      switch(side) {
        case 0: x = this.rng() * w; y = -100; vy = speed; vx = (this.rng() - 0.5) * speed * 0.5; break;
        case 1: x = w + 100; y = this.rng() * h; vx = -speed; vy = (this.rng() - 0.5) * speed * 0.5; break;
        case 2: x = this.rng() * w; y = h + 100; vy = -speed; vx = (this.rng() - 0.5) * speed * 0.5; break;
        case 3: x = -100; y = this.rng() * h; vx = speed; vy = (this.rng() - 0.5) * speed * 0.5; break;
      }
      this.createSingleHazard(w, h, x, y, vx, vy, biome);
  }
  private createSingleHazard(w: number, h: number, x: number, y: number, vx: number, vy: number, biome: string) {
    let type: Hazard['hazardType'] = 'rock';
    let shape: Hazard['shape'] = 'circle';
    let width = 0;
    let height = 0;
    let radius = GAME_CONSTANTS.HAZARD_RADIUS_MIN + this.rng() * (GAME_CONSTANTS.HAZARD_RADIUS_MAX - GAME_CONSTANTS.HAZARD_RADIUS_MIN);
    let color = GAME_CONSTANTS.COLORS.HAZARD_ROCK;
    let aiState: Hazard['aiState'] = undefined;
    let rotation = this.rng() * Math.PI * 2;
    if (biome === 'pond') {
      const rand = this.rng();
      if (rand < 0.4) {
        type = 'log'; shape = 'rectangle'; width = GAME_CONSTANTS.HAZARD_LOG_WIDTH; height = GAME_CONSTANTS.HAZARD_LOG_HEIGHT; color = GAME_CONSTANTS.COLORS.HAZARD_LOG;
      } else if (rand < 0.7) {
        type = 'frog'; shape = 'circle'; radius = GAME_CONSTANTS.HAZARD_FROG_RADIUS; color = GAME_CONSTANTS.COLORS.HAZARD_FROG;
        aiState = 'idle';
      }
    } else if (biome === 'glacier') {
        const rand = this.rng();
        if (rand < 0.5) {
            type = 'icicle'; shape = 'rectangle'; width = GAME_CONSTANTS.HAZARD_ICICLE_WIDTH; height = GAME_CONSTANTS.HAZARD_ICICLE_HEIGHT; color = GAME_CONSTANTS.COLORS.HAZARD_ICICLE;
        } else {
            type = 'snowball'; shape = 'circle'; radius = GAME_CONSTANTS.HAZARD_SNOWBALL_RADIUS; color = GAME_CONSTANTS.COLORS.HAZARD_SNOWBALL;
        }
    } else if (biome === 'city') {
        const rand = this.rng();
        if (rand < 0.5) {
            type = 'drone'; shape = 'circle'; radius = GAME_CONSTANTS.HAZARD_DRONE_RADIUS; color = GAME_CONSTANTS.COLORS.HAZARD_DRONE;
            aiState = 'track';
        } else {
            type = 'frisbee'; shape = 'rectangle'; width = GAME_CONSTANTS.HAZARD_FRISBEE_WIDTH; height = GAME_CONSTANTS.HAZARD_FRISBEE_HEIGHT; color = GAME_CONSTANTS.COLORS.HAZARD_FRISBEE;
        }
    } else if (biome === 'glitch') {
        const rand = this.rng();
        if (rand < 0.5) {
            type = 'glitch_square'; shape = 'rectangle'; width = GAME_CONSTANTS.HAZARD_GLITCH_SQUARE_SIZE; height = GAME_CONSTANTS.HAZARD_GLITCH_SQUARE_SIZE; color = GAME_CONSTANTS.COLORS.HAZARD_GLITCH_SQUARE;
        } else {
            type = 'pixel_orb'; shape = 'circle'; radius = GAME_CONSTANTS.HAZARD_PIXEL_ORB_RADIUS; color = GAME_CONSTANTS.COLORS.HAZARD_PIXEL_ORB;
        }
    } else if (biome === 'christmas') {
        const rand = this.rng();
        if (rand < 0.33) {
            type = 'gift'; shape = 'rectangle'; width = GAME_CONSTANTS.HAZARD_GIFT_WIDTH; height = GAME_CONSTANTS.HAZARD_GIFT_HEIGHT; color = GAME_CONSTANTS.COLORS.HAZARD_GIFT;
        } else if (rand < 0.66) {
            type = 'ornament'; shape = 'circle'; radius = GAME_CONSTANTS.HAZARD_ORNAMENT_RADIUS; color = GAME_CONSTANTS.COLORS.HAZARD_ORNAMENT;
        } else {
            type = 'candy_cane'; shape = 'rectangle'; width = GAME_CONSTANTS.HAZARD_CANDY_CANE_WIDTH; height = GAME_CONSTANTS.HAZARD_CANDY_CANE_HEIGHT; color = GAME_CONSTANTS.COLORS.HAZARD_CANDY_CANE;
        }
    } else if (biome === 'gym') {
        // Gym Normal Spawning: ALWAYS Dodgeballs
        type = 'dodgeball';
        shape = 'circle';
        radius = GAME_CONSTANTS.HAZARD_DODGEBALL_RADIUS;
        color = GAME_CONSTANTS.COLORS.HAZARD_DODGEBALL;
    } else if (biome === 'bathtub') {
        const rand = this.rng();
        if (rand < 0.6) {
            type = 'soap_bubble'; shape = 'circle'; radius = GAME_CONSTANTS.HAZARD_BUBBLE_RADIUS; color = GAME_CONSTANTS.COLORS.HAZARD_BUBBLE;
            vx *= 0.6; vy *= 0.6;
        } else if (rand < 0.85) {
             type = 'shampoo_bottle'; shape = 'rectangle'; width = GAME_CONSTANTS.HAZARD_SHAMPOO_WIDTH; height = GAME_CONSTANTS.HAZARD_SHAMPOO_HEIGHT; color = GAME_CONSTANTS.COLORS.HAZARD_SHAMPOO_BOTTLE;
        } else {
             type = 'shower_jet'; shape = 'rectangle'; color = GAME_CONSTANTS.COLORS.HAZARD_SHOWER_JET;
             const jetLength = 400; const jetThickness = 30; const pushForce = 800;
             const edge = Math.floor(this.rng() * 4);
             switch(edge) {
                 case 0: width = jetThickness; height = jetLength; x = this.rng() * w; y = jetLength / 2; vx = 0; vy = pushForce; break;
                 case 1: width = jetLength; height = jetThickness; x = w - jetLength / 2; y = this.rng() * h; vx = -pushForce; vy = 0; break;
                 case 2: width = jetThickness; height = jetLength; x = this.rng() * w; y = h - jetLength / 2; vx = 0; vy = -pushForce; break;
                 case 3: width = jetLength; height = jetThickness; x = jetLength / 2; y = this.rng() * h; vx = pushForce; vy = 0; break;
             }
             rotation = 0; aiState = 'active';
        }
    } else if (biome === 'billiards') {
        const rand = this.rng();
        if (rand < 0.4) {
            type = 'pool_ball_white'; shape = 'circle'; radius = GAME_CONSTANTS.HAZARD_POOL_BALL_RADIUS; color = GAME_CONSTANTS.COLORS.HAZARD_POOL_BALL_WHITE;
        } else if (rand < 0.7) {
            type = 'pool_ball_red'; shape = 'circle'; radius = GAME_CONSTANTS.HAZARD_POOL_BALL_RADIUS; color = GAME_CONSTANTS.COLORS.HAZARD_POOL_BALL_RED;
        } else {
            type = 'pool_ball_yellow'; shape = 'circle'; radius = GAME_CONSTANTS.HAZARD_POOL_BALL_RADIUS; color = GAME_CONSTANTS.COLORS.HAZARD_POOL_BALL_YELLOW;
        }
    }
    let maxBounces: number | undefined = undefined;
    if (type === 'dodgeball') maxBounces = 1; // Changed from 3 to 1
    if (type.startsWith('pool_ball')) maxBounces = 1; // Changed from 2 to 1 for better balance
    this.hazards.push({
      id: this.rng().toString(36).substr(2, 9),
      type: 'hazard',
      hazardType: type,
      shape: shape,
      position: { x, y },
      velocity: { x: vx, y: vy },
      radius, width, height, rotation,
      color, spawnTimer: 0, wobbleOffset: this.rng() * Math.PI * 2,
      aiState, aiTimer: 0, bounces: 0, maxBounces, hasTriggeredCloseCall: false,
      trackingTimer: 0
    });
    let material: 'metal' | 'wood' | 'soft' | 'glitch' | 'energy' = 'wood';
    if (['drone', 'wrench', 'spanner', 'dodgeball', 'pool_ball_white', 'pool_ball_red', 'pool_ball_yellow'].includes(type)) material = 'metal';
    else if (['log', 'frog'].includes(type)) material = 'wood';
    else if (['icicle', 'snowball', 'gift', 'ornament', 'soap_bubble', 'shampoo_bottle'].includes(type)) material = 'soft';
    else if (['glitch_square', 'pixel_orb'].includes(type)) material = 'glitch';
    else if (['frisbee', 'shower_jet'].includes(type)) material = 'energy';
    soundSynth.playHazardSpawn(material);
  }
}