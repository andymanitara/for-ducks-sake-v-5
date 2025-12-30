import { Particle, ParticleType, Skin, Vector2D } from '@/types/game';
import { GAME_CONSTANTS } from '@/game/constants';
import { adjustColor } from '@/lib/utils';
import { useGameStore } from '@/lib/store';
export class ParticleSystem {
  private particles: Particle[] = [];
  private ambientParticles: Particle[] = [];
  private ambientTimer: number = 0;
  public reset() {
    this.particles = [];
    this.ambientParticles = [];
    this.ambientTimer = 0;
  }
  public getParticles() { return this.particles; }
  public getAmbientParticles() { return this.ambientParticles; }
  public update(dt: number, width: number, height: number) {
    this.updateList(this.particles, dt);
    this.updateList(this.ambientParticles, dt);
    this.ambientTimer += dt;
    if (this.ambientTimer > 0.2) {
        this.spawnAmbientParticle(width, height);
        this.ambientTimer = 0;
    }
  }
  private updateList(list: Particle[], dt: number) {
      for (let i = list.length - 1; i >= 0; i--) {
          const p = list[i];
          p.life -= dt / p.maxLife;
          if (p.particleType === 'feather_death') {
              p.velocity.y += (p.gravity || 0) * dt;
              p.velocity.x *= (p.drag || 1);
              p.velocity.y *= (p.drag || 1);
              if (p.wobble !== undefined && p.wobbleSpeed !== undefined) {
                  p.wobble += p.wobbleSpeed * dt;
              }
          } else if (p.particleType === 'bubble') {
              p.velocity.y = -50;
              p.position.x += Math.sin(p.life * 10) * 0.5;
          }
          p.position.x += p.velocity.x * dt;
          p.position.y += p.velocity.y * dt;
          p.rotation += p.rotationSpeed * dt;
          p.opacity = p.life;
          if (p.life <= 0) list.splice(i, 1);
      }
  }
  public spawnParticle(type: ParticleType, x: number, y: number) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 50 + 20;
      let life = 1;
      let color = '#FFF';
      let scale = 1;
      if (type === 'dust') {
          life = GAME_CONSTANTS.PARTICLES.LIFETIME_DUST;
          color = GAME_CONSTANTS.PARTICLES.DUST_COLOR;
          scale = Math.random() * 0.5 + 0.5;
      }
      // ... other types
      const isBatterySaver = useGameStore.getState().isBatterySaver;
      const maxParticles = isBatterySaver ? 80 : 200;
      if (this.particles.length >= maxParticles) this.particles.shift();
      this.particles.push({
          id: Math.random().toString(),
          type: 'particle',
          particleType: type,
          position: { x, y },
          velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
          radius: 2, color, life: 1, maxLife: life,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 10,
          opacity: 1, scale
      });
  }
  public spawnTrailParticle(type: ParticleType, position: Vector2D, velocity: Vector2D, color: string) {
      const isBatterySaver = useGameStore.getState().isBatterySaver;
      const maxParticles = isBatterySaver ? 80 : 200;
      if (this.particles.length >= maxParticles) this.particles.shift();
      let life = 0.5;
      let scale = 1;
      let rotationSpeed = (Math.random() - 0.5) * 5;
      let particleVelocity = { x: 0, y: 0 };
      let particleColor = color;
      let radius = 3;
      // Drift opposite to movement
      const driftX = -velocity.x * 0.1 + (Math.random() - 0.5) * 20;
      const driftY = -velocity.y * 0.1 + (Math.random() - 0.5) * 20;
      if (type === 'smoke' || type === 'dust') {
          life = 0.8;
          scale = Math.random() * 0.5 + 0.5;
          particleVelocity = { x: driftX * 0.5, y: driftY * 0.5 };
          particleColor = type === 'dust' ? 'rgba(200, 200, 200, 0.5)' : 'rgba(100, 100, 100, 0.4)';
          radius = 4;
      } else if (type === 'sparkle') {
          life = 0.4;
          scale = Math.random() * 0.5 + 0.5;
          particleVelocity = { x: 0, y: 0 }; // Sparkles stay in place
          particleColor = '#FFFFE0';
          rotationSpeed = 10;
          radius = 2;
      } else if (type === 'bubble') {
          life = 1.0;
          scale = Math.random() * 0.5 + 0.5;
          particleVelocity = { x: driftX * 0.2, y: -30 }; // Float up
          particleColor = 'rgba(255, 255, 255, 0.6)';
          radius = 3;
      } else if (type === 'snow') {
          life = 0.6;
          scale = Math.random() * 0.5 + 0.5;
          particleVelocity = { x: driftX * 0.2, y: 20 }; // Fall down slightly
          particleColor = '#FFFFFF';
          radius = 2;
      } else if (type === 'binary') {
          life = 0.8;
          particleVelocity = { x: 0, y: -10 }; // Slight upward drift
          radius = 0; // Text based
          scale = 0.8 + Math.random() * 0.4;
          // Custom color logic for Cyber Duck vs Glitch Duck
          if (color === '#000000') {
             particleColor = '#00FF00'; // Matrix Green for Glitch Duck
          } else {
             particleColor = color; // Use passed color (e.g. Cyan for Cyber)
          }
      } else if (type === 'fire') {
          life = 0.6;
          particleVelocity = { x: driftX * 0.1, y: -40 - Math.random() * 20 }; // Strong upward drift
          particleColor = GAME_CONSTANTS.PARTICLES.FIRE_COLORS[Math.floor(Math.random() * GAME_CONSTANTS.PARTICLES.FIRE_COLORS.length)];
          radius = 4 + Math.random() * 3;
          scale = 1.2;
      } else if (type === 'lafleur_trail') {
          life = 0.6;
          scale = 0.5 + Math.random() * 0.5;
          particleVelocity = { x: driftX * 0.2, y: driftY * 0.2 };
          particleColor = Math.random() > 0.5 ? '#FF0000' : '#FFD700';
          radius = 3;
          rotationSpeed = 5;
      }
      this.particles.push({
          id: Math.random().toString(),
          type: 'particle',
          particleType: type,
          position: { x: position.x + (Math.random() - 0.5) * 10, y: position.y + (Math.random() - 0.5) * 10 },
          velocity: particleVelocity,
          radius,
          color: particleColor,
          life: 1,
          maxLife: life,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed,
          opacity: 1,
          scale,
          text: type === 'binary' ? (Math.random() > 0.5 ? '1' : '0') : undefined
      });
  }
  public spawnDeathFeathers(x: number, y: number, skin: Skin) {
      const config = GAME_CONSTANTS.FEATHER_EXPLOSION;
      const isBatterySaver = useGameStore.getState().isBatterySaver;
      const maxParticles = isBatterySaver ? 80 : 200;
      const count = isBatterySaver ? Math.floor(config.COUNT / 2) : config.COUNT;
      while (this.particles.length + count > maxParticles) this.particles.shift();
      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = config.SPEED_MIN + Math.random() * (config.SPEED_MAX - config.SPEED_MIN);
          const life = config.LIFETIME_MIN + Math.random() * (config.LIFETIME_MAX - config.LIFETIME_MIN);
          const isSecondary = Math.random() > 0.7;
          const baseColor = skin.color;
          const color = isSecondary ? adjustColor(baseColor, 40) : baseColor;
          const colorSecondary = isSecondary ? baseColor : adjustColor(baseColor, -30);
          this.particles.push({
              id: Math.random().toString(),
              type: 'particle',
              particleType: 'feather_death',
              position: { x, y },
              velocity: {
                  x: Math.cos(angle) * speed,
                  y: Math.sin(angle) * speed - 200
              },
              radius: 10, color, colorSecondary, life: 1, maxLife: life,
              rotation: Math.random() * Math.PI * 2,
              rotationSpeed: (Math.random() - 0.5) * 15,
              opacity: 1, scale: 0.8 + Math.random() * 0.4,
              gravity: config.GRAVITY, drag: config.DRAG,
              wobble: Math.random() * Math.PI * 2, wobbleSpeed: config.WOBBLE_SPEED
          });
      }
  }
  private spawnAmbientParticle(w: number, h: number) {
      const isBatterySaver = useGameStore.getState().isBatterySaver;
      if (isBatterySaver && Math.random() > 0.5) return;
      const biome = useGameStore.getState().biome;
      let type: ParticleType = 'leaf';
      let color = GAME_CONSTANTS.PARTICLES.LEAF_COLOR;
      if (biome === 'glacier') { type = 'snow'; color = GAME_CONSTANTS.PARTICLES.SNOW_COLOR; }
      // ... other biomes
      const x = Math.random() * w;
      const y = Math.random() * h;
      const maxParticles = isBatterySaver ? 80 : 200;
      if (this.ambientParticles.length >= maxParticles) this.ambientParticles.shift();
      this.ambientParticles.push({
          id: Math.random().toString(),
          type: 'particle',
          particleType: type,
          position: { x, y },
          velocity: { x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20 + 10 },
          radius: Math.random() * 3 + 1, color, life: 1,
          maxLife: GAME_CONSTANTS.PARTICLES.LIFETIME_AMBIENT,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 2,
          opacity: 0, scale: Math.random() * 0.5 + 0.5
      });
  }
}