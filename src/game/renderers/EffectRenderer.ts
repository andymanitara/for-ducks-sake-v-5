import { Particle, Shockwave } from '@/types/game';
import { GAME_CONSTANTS } from '@/game/constants';
export class EffectRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }
  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  public drawParticles(list: Particle[]) {
      list.forEach(p => {
          this.ctx.save();
          this.ctx.translate(p.position.x, p.position.y);
          this.ctx.rotate(p.rotation);
          this.ctx.scale(p.scale, p.scale);
          this.ctx.globalAlpha = p.opacity;
          this.ctx.fillStyle = p.color;
          // Emissive Glow Logic
          if (p.particleType === 'fire') {
              this.ctx.shadowBlur = 10;
              this.ctx.shadowColor = '#FF4500';
          } else if (p.particleType === 'binary') {
              this.ctx.shadowBlur = 5;
              this.ctx.shadowColor = p.color; // Use particle color for glow
          } else if (p.particleType === 'sparkle') {
              this.ctx.shadowBlur = 5;
              this.ctx.shadowColor = '#FFFFE0';
          } else if (p.particleType === 'glitch') {
              this.ctx.shadowBlur = 5;
              this.ctx.shadowColor = '#00FF00';
          }
          if (p.particleType === 'feather_death') {
              const w = 12;
              const h = 24;
              if (p.wobble) this.ctx.rotate(Math.sin(p.wobble) * 0.2);
              this.ctx.beginPath();
              this.ctx.moveTo(0, -h/2);
              this.ctx.quadraticCurveTo(w, -h/4, w/2, h/2);
              this.ctx.quadraticCurveTo(0, h/2 + 5, -w/2, h/2);
              this.ctx.quadraticCurveTo(-w, -h/4, 0, -h/2);
              this.ctx.fill();
              this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
              this.ctx.lineWidth = 1;
              this.ctx.stroke();
              this.ctx.beginPath();
              this.ctx.moveTo(0, -h/2 + 2);
              this.ctx.quadraticCurveTo(2, 0, 0, h/2 - 2);
              this.ctx.strokeStyle = p.colorSecondary || 'rgba(0,0,0,0.1)';
              this.ctx.lineWidth = 2;
              this.ctx.stroke();
          } else if (p.particleType === 'binary' || p.particleType === 'glitch') {
              this.ctx.font = 'bold 12px monospace';
              this.ctx.fillStyle = p.color; // Use particle color
              this.ctx.fillText(p.text || '1', 0, 0);
          } else if (p.particleType === 'pixel') {
              this.ctx.fillRect(-2, -2, 4, 4);
          } else if (p.particleType === 'dust') {
              this.ctx.beginPath();
              this.ctx.arc(0, 0, p.radius * 3, 0, Math.PI * 2);
              this.ctx.fill();
          } else if (p.particleType === 'feather') {
              this.ctx.beginPath();
              this.ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
              this.ctx.fill();
          } else if (p.particleType === 'sparkle') {
              this.ctx.beginPath();
              this.ctx.moveTo(0, -5);
              this.ctx.lineTo(1, -1);
              this.ctx.lineTo(5, 0);
              this.ctx.lineTo(1, 1);
              this.ctx.lineTo(0, 5);
              this.ctx.lineTo(-1, 1);
              this.ctx.lineTo(-5, 0);
              this.ctx.lineTo(-1, -1);
              this.ctx.fill();
          } else if (p.particleType === 'leaf') {
              this.ctx.beginPath();
              this.ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
              this.ctx.fill();
          } else if (p.particleType === 'sweat') {
              this.ctx.beginPath();
              this.ctx.moveTo(0, -5);
              this.ctx.quadraticCurveTo(3, 0, 0, 5);
              this.ctx.quadraticCurveTo(-3, 0, 0, -5);
              this.ctx.fill();
          } else if (p.particleType === 'bubble') {
              this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
              this.ctx.lineWidth = 1;
              this.ctx.beginPath();
              this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
              this.ctx.stroke();
              this.ctx.beginPath();
              this.ctx.arc(-p.radius/3, -p.radius/3, p.radius/4, 0, Math.PI * 2);
              this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              this.ctx.fill();
          } else if (p.particleType === 'bubble_pop') {
              this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
              this.ctx.lineWidth = 2;
              this.ctx.beginPath();
              this.ctx.arc(0, 0, p.radius * p.scale, 0, Math.PI * 2);
              this.ctx.stroke();
          } else if (p.particleType === 'fire') {
              // Draw a flame shape
              this.ctx.beginPath();
              this.ctx.moveTo(-p.radius, p.radius);
              this.ctx.quadraticCurveTo(0, -p.radius * 2, p.radius, p.radius);
              this.ctx.quadraticCurveTo(0, p.radius * 0.5, -p.radius, p.radius);
              this.ctx.fill();
          } else if (p.particleType === 'smoke') {
              this.ctx.beginPath();
              this.ctx.arc(0, 0, p.radius * p.scale, 0, Math.PI * 2);
              this.ctx.fill();
          } else {
              this.ctx.beginPath();
              this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
              this.ctx.fill();
          }
          this.ctx.restore();
      });
  }
  public drawShockwave(shockwave: Shockwave) {
      this.ctx.save();
      this.ctx.translate(shockwave.x, shockwave.y);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, shockwave.radius, 0, Math.PI * 2);
      this.ctx.globalAlpha = shockwave.opacity;
      this.ctx.strokeStyle = shockwave.color || '#FFFFFF';
      this.ctx.lineWidth = 10 * shockwave.opacity;
      this.ctx.stroke();
      this.ctx.restore();
  }
  public drawPanicVignette(panicLevel: number) {
      if (panicLevel > 0) {
          const panicGrad = this.ctx.createRadialGradient(
              this.width / 2, this.height / 2, this.width * 0.3,
              this.width / 2, this.height / 2, this.width * 0.9
          );
          panicGrad.addColorStop(0, 'transparent');
          panicGrad.addColorStop(1, `rgba(255, 0, 0, ${panicLevel * 0.4})`);
          this.ctx.fillStyle = panicGrad;
          this.ctx.fillRect(0, 0, this.width, this.height);
      }
  }
}