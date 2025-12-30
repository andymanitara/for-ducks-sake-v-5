import { BiomeType } from '@/types/game';
import { GAME_CONSTANTS } from '@/game/constants';
import { adjustColor } from '@/lib/utils';
export class BackgroundRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private safeBottom: number = 0;
  private cachedBackground: HTMLCanvasElement | null = null;
  private lastBiome: BiomeType | null = null;
  // Background Elements Data
  private lilyPads: { x: number, y: number, r: number, rotation: number }[] = [];
  private iceCracks: { x: number, y: number, path: Path2D }[] = [];
  private roadMarkings: { x: number, y: number, w: number, h: number }[] = [];
  private glitchGrid: { x: number, y: number, w: number, h: number }[] = [];
  private snowPiles: { x: number, y: number, r: number }[] = [];
  private bathBubbles: { x: number, y: number, r: number, alpha: number }[] = [];
  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.generateElements();
  }
  public resize(width: number, height: number, safeBottom: number = 0) {
    this.width = width;
    this.height = height;
    this.safeBottom = safeBottom;
    this.cachedBackground = null;
    this.lastBiome = null;
    this.generateElements();
  }
  private generateElements() {
    this.lilyPads = [];
    this.iceCracks = [];
    this.roadMarkings = [];
    this.glitchGrid = [];
    this.snowPiles = [];
    this.bathBubbles = [];
    const buffer = GAME_CONSTANTS.VISUALS.RENDER_BUFFER;
    const extendedWidth = this.width + buffer * 2;
    const extendedHeight = this.height + buffer * 2;
    // Pond
    for (let i = 0; i < 12; i++) {
      this.lilyPads.push({
        x: Math.random() * extendedWidth - buffer,
        y: Math.random() * extendedHeight - buffer,
        r: 30 + Math.random() * 25,
        rotation: Math.random() * Math.PI * 2
      });
    }
    // Glacier
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * extendedWidth - buffer;
      const y = Math.random() * extendedHeight - buffer;
      const path = new Path2D();
      path.moveTo(0, 0);
      path.lineTo(Math.random() * 40 - 20, Math.random() * 40 - 20);
      path.lineTo(Math.random() * 40 - 20, Math.random() * 40 - 20);
      this.iceCracks.push({ x, y, path });
    }
    // City
    for (let i = 0; i < 15; i++) {
        this.roadMarkings.push({
            x: Math.random() * extendedWidth - buffer,
            y: Math.random() * extendedHeight - buffer,
            w: 10 + Math.random() * 20,
            h: 4
        });
    }
    // Glitch
    const gridSize = 100;
    for (let x = -buffer; x < extendedWidth; x += gridSize) {
        for (let y = -buffer; y < extendedHeight; y += gridSize) {
            if (Math.random() > 0.7) {
                this.glitchGrid.push({ x, y, w: gridSize, h: gridSize });
            }
        }
    }
    // Christmas
    for (let i = 0; i < 10; i++) {
        this.snowPiles.push({
            x: Math.random() * extendedWidth - buffer,
            y: Math.random() * extendedHeight - buffer,
            r: 20 + Math.random() * 30
        });
    }
    // Bathtub
    for (let i = 0; i < 20; i++) {
        this.bathBubbles.push({
            x: Math.random() * extendedWidth - buffer,
            y: Math.random() * extendedHeight - buffer,
            r: 5 + Math.random() * 15,
            alpha: 0.1 + Math.random() * 0.3
        });
    }
  }
  public draw(biome: BiomeType) {
    if (this.lastBiome !== biome || !this.cachedBackground) {
        this.cacheBackground(biome);
        this.lastBiome = biome;
    }
    const buffer = GAME_CONSTANTS.VISUALS.RENDER_BUFFER;
    if (this.cachedBackground) {
        this.ctx.drawImage(this.cachedBackground, -buffer, -buffer);
    }
    // Dynamic overlays
    if (biome === 'pond') this.drawPondDynamic();
    else if (biome === 'glitch') this.drawGlitchDynamic();
    else if (biome === 'christmas') this.drawChristmasDynamic();
    else if (biome === 'gym') this.drawGymDynamic();
  }
  private cacheBackground(biome: BiomeType) {
      const buffer = GAME_CONSTANTS.VISUALS.RENDER_BUFFER;
      const totalWidth = this.width + buffer * 2;
      const totalHeight = this.height + buffer * 2;
      if (!this.cachedBackground) {
          this.cachedBackground = document.createElement('canvas');
      }
      if (this.cachedBackground.width !== totalWidth || this.cachedBackground.height !== totalHeight) {
          this.cachedBackground.width = totalWidth;
          this.cachedBackground.height = totalHeight;
      }
      const ctx = this.cachedBackground.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, totalWidth, totalHeight);
      ctx.save();
      ctx.translate(buffer, buffer);
      if (biome === 'pond') this.drawPondStatic(ctx);
      else if (biome === 'glacier') this.drawGlacierStatic(ctx);
      else if (biome === 'city') this.drawCityStatic(ctx);
      else if (biome === 'glitch') this.drawGlitchStatic(ctx);
      else if (biome === 'christmas') this.drawChristmasStatic(ctx);
      else if (biome === 'gym') this.drawGymStatic(ctx);
      else if (biome === 'bathtub') this.drawBathtubStatic(ctx);
      else if (biome === 'billiards') this.drawBilliardsStatic(ctx);
      ctx.restore();
  }
  // --- Static Drawing Methods ---
  private drawPondStatic(ctx: CanvasRenderingContext2D) {
    const buffer = GAME_CONSTANTS.VISUALS.RENDER_BUFFER;
    const grad = ctx.createLinearGradient(0, -buffer, 0, this.height + buffer);
    grad.addColorStop(0, '#4FC3F7');
    grad.addColorStop(1, '#0288D1');
    ctx.fillStyle = grad;
    ctx.fillRect(-buffer, -buffer, this.width + 2*buffer, this.height + 2*buffer);
    this.lilyPads.forEach(pad => {
        ctx.save();
        ctx.translate(pad.x, pad.y);
        ctx.rotate(pad.rotation);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.arc(5, 5, pad.r, 0.2, Math.PI * 2 - 0.2);
        ctx.fill();
        const padGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, pad.r);
        padGrad.addColorStop(0, '#AED581');
        padGrad.addColorStop(1, '#7CB342');
        ctx.fillStyle = padGrad;
        ctx.strokeStyle = '#33691E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, pad.r, 0.2, Math.PI * 2 - 0.2);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    });
  }
  private drawGlacierStatic(ctx: CanvasRenderingContext2D) {
      const buffer = GAME_CONSTANTS.VISUALS.RENDER_BUFFER;
      const grad = ctx.createLinearGradient(0, -buffer, 0, this.height + buffer);
      grad.addColorStop(0, '#E0F7FA');
      grad.addColorStop(1, '#B2EBF2');
      ctx.fillStyle = grad;
      ctx.fillRect(-buffer, -buffer, this.width + 2*buffer, this.height + 2*buffer);
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 3;
      this.iceCracks.forEach(crack => {
          ctx.save();
          ctx.translate(crack.x, crack.y);
          ctx.stroke(crack.path);
          ctx.restore();
      });
  }
  private drawCityStatic(ctx: CanvasRenderingContext2D) {
      const buffer = GAME_CONSTANTS.VISUALS.RENDER_BUFFER;
      ctx.fillStyle = '#EEEEEE';
      ctx.fillRect(-buffer, -buffer, this.width + 2*buffer, this.height + 2*buffer);
      ctx.fillStyle = '#E0E0E0';
      this.roadMarkings.forEach(mark => {
          ctx.fillRect(mark.x, mark.y, mark.w, mark.h);
      });
  }
  private drawGlitchStatic(ctx: CanvasRenderingContext2D) {
      const buffer = GAME_CONSTANTS.VISUALS.RENDER_BUFFER;
      ctx.fillStyle = '#0F0F1A';
      ctx.fillRect(-buffer, -buffer, this.width + 2*buffer, this.height + 2*buffer);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.03)';
      this.glitchGrid.forEach(g => {
          if (Math.random() > 0.5) ctx.fillRect(g.x, g.y, g.w, g.h);
      });
  }
  private drawChristmasStatic(ctx: CanvasRenderingContext2D) {
      const buffer = GAME_CONSTANTS.VISUALS.RENDER_BUFFER;
      const grad = ctx.createLinearGradient(0, -buffer, 0, this.height + buffer);
      grad.addColorStop(0, '#F0F8FF');
      grad.addColorStop(1, '#E3F2FD');
      ctx.fillStyle = grad;
      ctx.fillRect(-buffer, -buffer, this.width + 2*buffer, this.height + 2*buffer);
      ctx.fillStyle = '#FFFFFF';
      this.snowPiles.forEach(pile => {
          ctx.beginPath();
          ctx.arc(pile.x, pile.y, pile.r, 0, Math.PI * 2);
          ctx.fill();
      });
  }
  private drawGymStatic(ctx: CanvasRenderingContext2D) {
      const buffer = GAME_CONSTANTS.VISUALS.RENDER_BUFFER;
      const plankHeight = 40;
      const plankWidth = 200;
      // Base fill for safe area
      ctx.fillStyle = GAME_CONSTANTS.COLORS.BIOME_GYM_FLOOR;
      ctx.fillRect(-buffer, -buffer, this.width + 2*buffer, this.height + 2*buffer);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 2;
      // Limit planks to effective height
      for (let y = -buffer; y < this.height - this.safeBottom + buffer; y += plankHeight) {
          const xOffset = (y / plankHeight) % 2 === 0 ? 0 : plankWidth / 2;
          for (let x = -buffer - plankWidth; x < this.width + buffer; x += plankWidth) {
             const variance = (Math.sin(x * 0.01 + y * 0.01) + 1) / 2;
             const baseColor = GAME_CONSTANTS.COLORS.BIOME_GYM_FLOOR;
             ctx.fillStyle = variance > 0.5 ? baseColor : adjustColor(baseColor, -10);
             ctx.fillRect(x + xOffset, y, plankWidth, plankHeight);
             ctx.strokeRect(x + xOffset, y, plankWidth, plankHeight);
          }
      }
      // Court Lines
      ctx.strokeStyle = GAME_CONSTANTS.COLORS.BIOME_GYM_LINES;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(this.width / 2, this.height / 2, 100, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, this.height / 2);
      ctx.lineTo(this.width, this.height / 2);
      ctx.stroke();
      // Bottom Boundary Line
      ctx.beginPath();
      ctx.moveTo(0, this.height - this.safeBottom);
      ctx.lineTo(this.width, this.height - this.safeBottom);
      ctx.stroke();
  }
  private drawBathtubStatic(ctx: CanvasRenderingContext2D) {
      const buffer = GAME_CONSTANTS.VISUALS.RENDER_BUFFER;
      ctx.fillStyle = GAME_CONSTANTS.COLORS.BIOME_BATHTUB_WALL;
      ctx.fillRect(-buffer, -buffer, this.width + 2*buffer, this.height + 2*buffer);
      const cornerRadius = 60;
      ctx.fillStyle = GAME_CONSTANTS.COLORS.BIOME_BATHTUB_WATER;
      ctx.beginPath();
      // Adjust water height to respect safe area
      if (ctx.roundRect) ctx.roundRect(0, 0, this.width, this.height - this.safeBottom, cornerRadius);
      else ctx.rect(0, 0, this.width, this.height - this.safeBottom);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 4;
      ctx.stroke();
      // Bubbles
      this.bathBubbles.forEach(bubble => {
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${bubble.alpha})`;
          ctx.fill();
      });
      // Tap - Shifted up by safeBottom
      const tapX = this.width / 2;
      const tapY = this.height - this.safeBottom; // Bottom edge of playable area
      // Draw Tap
      ctx.fillStyle = '#C0C0C0';
      ctx.beginPath();
      ctx.rect(tapX - 15, tapY - 60, 30, 60); // Stem
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tapX, tapY - 60, 20, 0, Math.PI * 2); // Knob
      ctx.fill();
      // Plug and Chain - Shifted up
      const plugX = this.width / 2 + 80;
      const plugY = this.height - 80 - this.safeBottom;
      // Chain
      ctx.beginPath();
      ctx.moveTo(tapX, tapY - 40);
      ctx.quadraticCurveTo(tapX + 40, tapY - 20, plugX, plugY);
      ctx.strokeStyle = '#A0A0A0';
      ctx.lineWidth = 3;
      ctx.stroke();
      // Plug
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.ellipse(plugX, plugY, 15, 10, 0, 0, Math.PI * 2);
      ctx.fill();
  }
  private drawBilliardsStatic(ctx: CanvasRenderingContext2D) {
      const buffer = GAME_CONSTANTS.VISUALS.RENDER_BUFFER;
      ctx.fillStyle = GAME_CONSTANTS.COLORS.BIOME_BILLIARDS_FELT;
      ctx.fillRect(-buffer, -buffer, this.width + 2*buffer, this.height + 2*buffer);
      const railSize = 20;
      ctx.fillStyle = GAME_CONSTANTS.COLORS.BIOME_BILLIARDS_WOOD;
      // Top Rail
      ctx.fillRect(-buffer, -buffer, this.width + 2*buffer, railSize + buffer);
      // Bottom Rail - Shifted up, extended down to cover safe area
      ctx.fillRect(-buffer, this.height - railSize - this.safeBottom, this.width + 2*buffer, railSize + buffer + this.safeBottom);
      // Side Rails
      ctx.fillRect(-buffer, -buffer, railSize + buffer, this.height + 2*buffer);
      ctx.fillRect(this.width - railSize, -buffer, railSize + buffer, this.height + 2*buffer);
      // Pockets
      const pocketRadius = GAME_CONSTANTS.BILLIARDS_POCKET_RADIUS;
      const effectiveH = this.height - this.safeBottom;
      const pockets = [
          { x: 0, y: 0 }, { x: this.width, y: 0 },
          { x: 0, y: effectiveH }, { x: this.width, y: effectiveH },
          { x: 0, y: effectiveH / 2 }, { x: this.width, y: effectiveH / 2 }
      ];
      pockets.forEach(p => {
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(p.x, p.y, pocketRadius, 0, Math.PI * 2);
          ctx.fill();
      });
  }
  // --- Dynamic Drawing Methods ---
  private drawPondDynamic() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 2;
    for(let i=0; i<5; i++) {
        const t = (Date.now() / 2000 + i * 0.5) % 1;
        const r = t * 100;
        this.ctx.globalAlpha = 1 - t;
        this.ctx.beginPath();
        this.ctx.arc(this.width/2, this.height/2, r * (i+1), 0, Math.PI * 2);
        this.ctx.stroke();
    }
    this.ctx.globalAlpha = 1;
  }
  private drawGlitchDynamic() {
      this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
      this.ctx.lineWidth = 1;
      const gridSize = 50;
      const offset = (Date.now() / 50) % gridSize;
      this.ctx.beginPath();
      for(let x=0; x<=this.width; x+=gridSize) {
          this.ctx.moveTo(x, 0);
          this.ctx.lineTo(x, this.height);
      }
      for(let y=offset; y<=this.height; y+=gridSize) {
          this.ctx.moveTo(0, y);
          this.ctx.lineTo(this.width, y);
      }
      this.ctx.stroke();
  }
  private drawChristmasDynamic() {
      this.snowPiles.forEach(pile => {
          if (Math.random() > 0.98) {
              this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              this.ctx.beginPath();
              this.ctx.arc(pile.x + (Math.random()-0.5)*pile.r, pile.y + (Math.random()-0.5)*pile.r, 2, 0, Math.PI*2);
              this.ctx.fill();
          }
      });
  }
  private drawGymDynamic() {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      const lightSize = 150;
      const spacing = 300;
      for (let y = 100; y < this.height; y += spacing) {
          for (let x = 100; x < this.width; x += spacing) {
              this.ctx.beginPath();
              this.ctx.ellipse(x, y, lightSize, lightSize / 2, 0, 0, Math.PI * 2);
              this.ctx.fill();
          }
      }
  }
}