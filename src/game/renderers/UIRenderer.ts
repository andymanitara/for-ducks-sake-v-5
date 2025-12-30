import { InputState, FloatingText, BarrageState } from '@/types/game';
import { GAME_CONSTANTS } from '@/game/constants';
import { useGameStore } from '@/lib/store';
export class UIRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private floatingTexts: FloatingText[] = [];
  private newRecordTimer: number = 0;
  private levelUpTimer: number = 0;
  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }
  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  public reset() {
      this.floatingTexts = [];
      this.newRecordTimer = 0;
      this.levelUpTimer = 0;
  }
  public addFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
        id: Math.random().toString(),
        x,
        y,
        text,
        color,
        life: 1.0,
        maxLife: 1.0,
        velocity: { x: (Math.random() - 0.5) * 50, y: -100 },
        scale: 0.5,
        rotation: (Math.random() - 0.5) * 0.4,
        rotationSpeed: (Math.random() - 0.5) * 2,
    });
  }
  public triggerLevelUp() {
      this.levelUpTimer = 2.0;
  }
  public triggerNewRecord() {
      this.newRecordTimer = 2.0;
  }
  private drawWarningArrows(direction: number) {
      const time = Date.now();
      const spacing = 60;
      const speed = 0.2; // pixels per ms
      const offset = (time * speed) % spacing;
      const arrowSize = 20;
      const count = 5; // Number of arrows in the sequence
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.lineWidth = 4;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      this.ctx.shadowBlur = 4;
      // Center the drawing context based on direction
      // 0: Top, 1: Right, 2: Bottom, 3: Left
      if (direction === 0) { // Top -> Down
          this.ctx.translate(this.width / 2, 20);
      } else if (direction === 1) { // Right -> Left
          this.ctx.translate(this.width - 20, this.height / 2);
          this.ctx.rotate(Math.PI / 2);
      } else if (direction === 2) { // Bottom -> Up
          this.ctx.translate(this.width / 2, this.height - 20);
          this.ctx.rotate(Math.PI);
      } else if (direction === 3) { // Left -> Right
          this.ctx.translate(20, this.height / 2);
          this.ctx.rotate(-Math.PI / 2);
      }
      // Draw arrows moving downwards (relative to rotation, which points inwards)
      for (let i = 0; i < count; i++) {
          const y = (i * spacing) + offset;
          const alpha = 1 - (y / (count * spacing)); // Fade out as they move in
          if (alpha <= 0) continue;
          this.ctx.globalAlpha = alpha;
          this.ctx.beginPath();
          this.ctx.moveTo(-arrowSize, y);
          this.ctx.lineTo(0, y + arrowSize);
          this.ctx.lineTo(arrowSize, y);
          this.ctx.stroke();
      }
      this.ctx.restore();
  }
  public drawBarrageOverlay(state: BarrageState) {
      if (state.state === 'idle') return;
      this.ctx.save();
      if (state.state === 'warning') {
          // Directional Warning Gradient
          const flash = Math.abs(Math.sin(Date.now() / 100)); // Fast pulse
          const alpha = (0.3 + flash * 0.4); // Base visibility + pulse
          let grad;
          const depth = 150; // Depth of the warning zone
          if (state.direction === 0) { // Top
              grad = this.ctx.createLinearGradient(0, 0, 0, depth);
              grad.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
              grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
              this.ctx.fillStyle = grad;
              this.ctx.fillRect(0, 0, this.width, depth);
          } else if (state.direction === 1) { // Right
              grad = this.ctx.createLinearGradient(this.width, 0, this.width - depth, 0);
              grad.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
              grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
              this.ctx.fillStyle = grad;
              this.ctx.fillRect(this.width - depth, 0, depth, this.height);
          } else if (state.direction === 2) { // Bottom
              grad = this.ctx.createLinearGradient(0, this.height, 0, this.height - depth);
              grad.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
              grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
              this.ctx.fillStyle = grad;
              this.ctx.fillRect(0, this.height - depth, this.width, depth);
          } else if (state.direction === 3) { // Left
              grad = this.ctx.createLinearGradient(0, 0, depth, 0);
              grad.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
              grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
              this.ctx.fillStyle = grad;
              this.ctx.fillRect(0, 0, depth, this.height);
          }
          // Draw Animated Arrows
          this.drawWarningArrows(state.direction);
          // Text Overlay
          this.ctx.translate(this.width / 2, this.height / 2);
          const scale = 1 + Math.sin(Date.now() / 50) * 0.1;
          this.ctx.scale(scale, scale);
          this.ctx.font = '50px "Rubik Mono One", sans-serif';
          this.ctx.fillStyle = '#FF0000';
          this.ctx.shadowColor = 'rgba(255, 255, 0, 1)';
          this.ctx.shadowBlur = 10;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('WHISTLE!', 0, 0);
          this.ctx.strokeStyle = '#FFFFFF';
          this.ctx.lineWidth = 3;
          this.ctx.strokeText('WHISTLE!', 0, 0);
      } else if (state.state === 'active') {
          // Active Phase: Progress Bar
          const barHeight = 20;
          const progress = state.progress; // 0 to 1
          const remaining = 1 - progress;
          this.ctx.fillStyle = '#FF4500';
          this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
          this.ctx.shadowBlur = 5;
          if (state.direction === 0) { // Top
              this.ctx.fillRect(0, 0, this.width * remaining, barHeight);
          } else if (state.direction === 1) { // Right
              this.ctx.fillRect(this.width - barHeight, 0, barHeight, this.height * remaining);
          } else if (state.direction === 2) { // Bottom
              this.ctx.fillRect(0, this.height - barHeight, this.width * remaining, barHeight);
          } else if (state.direction === 3) { // Left
              this.ctx.fillRect(0, 0, barHeight, this.height * remaining);
          }
          // Timer Text
          this.ctx.translate(this.width / 2, 100);
          this.ctx.font = '30px "Rubik Mono One", sans-serif';
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 4;
          this.ctx.textAlign = 'center';
          this.ctx.shadowBlur = 0;
          const seconds = (state.timeLeft / 1000).toFixed(1);
          this.ctx.strokeText(`SURVIVE! ${seconds}`, 0, 0);
          this.ctx.fillText(`SURVIVE! ${seconds}`, 0, 0);
      }
      this.ctx.restore();
  }
  public drawJoystick(input: InputState) {
    const { joystickMode, joystickOpacity } = useGameStore.getState();
    if (joystickMode === 'dynamic' && !input.active) return;
    this.ctx.save();
    this.ctx.globalAlpha = joystickOpacity;
    let origin = input.origin;
    let current = input.current;
    if (joystickMode === 'static') {
        const staticX = this.width * GAME_CONSTANTS.INPUT.STATIC_ANCHOR_X;
        const staticY = this.height * GAME_CONSTANTS.INPUT.STATIC_ANCHOR_Y;
        origin = { x: staticX, y: staticY };
        if (!input.active) current = origin;
        else current = input.current;
    }
    this.ctx.translate(origin.x, origin.y);
    this.ctx.save();
    this.ctx.rotate(Date.now() / 2000);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 50, 0, Math.PI * 2);
    this.ctx.setLineDash([15, 10]);
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.stroke();
    this.ctx.restore();
    this.ctx.restore();
    if (input.active || (current.x !== origin.x || current.y !== origin.y)) {
        this.ctx.save();
        this.ctx.globalAlpha = joystickOpacity;
        this.ctx.beginPath();
        this.ctx.moveTo(origin.x, origin.y);
        this.ctx.lineTo(current.x, current.y);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.stroke();
        this.ctx.restore();
    }
    const dx = current.x - origin.x;
    const dy = current.y - origin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 50;
    let kx = current.x;
    let ky = current.y;
    if (dist > maxDist) {
      kx = origin.x + (dx / dist) * maxDist;
      ky = origin.y + (dy / dist) * maxDist;
    }
    this.ctx.save();
    this.ctx.globalAlpha = joystickOpacity;
    this.ctx.beginPath();
    this.ctx.arc(kx, ky, 25, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(kx - 10, ky);
    this.ctx.lineTo(kx + 10, ky);
    this.ctx.moveTo(kx, ky - 10);
    this.ctx.lineTo(kx, ky + 10);
    this.ctx.stroke();
    this.ctx.restore();
  }
  public drawUIEffects(dt: number) {
      // New Record Effect
      if (this.newRecordTimer > 0) {
          this.newRecordTimer -= dt;
          this.ctx.save();
          this.ctx.translate(this.width / 2, this.height / 4);
          const scale = 1 + (2 - this.newRecordTimer) * 0.5;
          const alpha = Math.min(1, this.newRecordTimer);
          this.ctx.scale(scale, scale);
          this.ctx.globalAlpha = alpha;
          // Updated Font & Style
          this.ctx.font = '40px "Rubik Mono One", sans-serif';
          // Dynamic color pulse
          const pulse = Math.sin(Date.now() / 100);
          this.ctx.fillStyle = pulse > 0 ? '#FFD700' : '#FFFFFF';
          // Hard Shadow
          this.ctx.shadowColor = 'rgba(0,0,0,1)';
          this.ctx.shadowBlur = 0;
          this.ctx.shadowOffsetX = 4;
          this.ctx.shadowOffsetY = 4;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('NEW BEST!', 0, 0);
          this.ctx.restore();
      }
      // Level Up Effect
      if (this.levelUpTimer > 0) {
          this.levelUpTimer -= dt;
          // Screen Flash
          if (this.levelUpTimer > 1.8) {
              this.ctx.save();
              this.ctx.globalAlpha = (this.levelUpTimer - 1.8) * 2; // Fade out from 0.4 to 0
              this.ctx.fillStyle = 'white';
              this.ctx.fillRect(0, 0, this.width, this.height);
              this.ctx.restore();
          }
          this.ctx.save();
          this.ctx.translate(this.width / 2, this.height / 3);
          const pulse = 1 + Math.sin(Date.now() / 100) * 0.1;
          this.ctx.scale(pulse, pulse);
          this.ctx.globalAlpha = Math.min(1, this.levelUpTimer);
          // Updated Font & Style
          this.ctx.font = '50px "Rubik Mono One", sans-serif';
          this.ctx.fillStyle = '#FF4500';
          // Hard Shadow
          this.ctx.shadowColor = 'rgba(0,0,0,1)';
          this.ctx.shadowBlur = 0;
          this.ctx.shadowOffsetX = 5;
          this.ctx.shadowOffsetY = 5;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('SPEED UP!', 0, 0);
          this.ctx.restore();
      }
      // Floating Texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
          const ft = this.floatingTexts[i];
          ft.life -= dt;
          ft.x += ft.velocity.x * dt;
          ft.y += ft.velocity.y * dt;
          ft.rotation += ft.rotationSpeed * dt;
          const targetScale = 1.5;
          if (ft.life > ft.maxLife - 0.2) {
              ft.scale += (targetScale - ft.scale) * dt * 10;
          } else {
              ft.scale += (1.0 - ft.scale) * dt * 5;
          }
          if (ft.life <= 0) {
              this.floatingTexts.splice(i, 1);
              continue;
          }
          this.ctx.save();
          this.ctx.translate(ft.x, ft.y);
          this.ctx.rotate(ft.rotation);
          this.ctx.scale(ft.scale, ft.scale);
          this.ctx.globalAlpha = Math.min(1, ft.life * 2);
          this.ctx.font = '20px "Rubik Mono One", sans-serif';
          this.ctx.fillStyle = ft.color;
          this.ctx.shadowColor = 'rgba(0,0,0,1)';
          this.ctx.shadowBlur = 0;
          this.ctx.shadowOffsetX = 3;
          this.ctx.shadowOffsetY = 3;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(ft.text, 0, 0);
          this.ctx.restore();
      }
  }
  public drawReplayOverlay() {
    const isBatterySaver = useGameStore.getState().isBatterySaver;
    this.ctx.save();
    const padding = 20;
    const x = padding;
    const y = padding + 30;
    if (Math.floor(Date.now() / 500) % 2 === 0) {
        this.ctx.beginPath();
        this.ctx.arc(x + 10, y, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fill();
    }
    this.ctx.font = '900 16px sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    if (!isBatterySaver) {
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 4;
    }
    this.ctx.fillText('REPLAY', x + 24, y);
    this.ctx.restore();
  }
  public drawInGameTime(ms: number) {
      const isBatterySaver = useGameStore.getState().isBatterySaver;
      this.ctx.save();
      const timeText = `${(ms / 1000).toFixed(2)}s`;
      this.ctx.font = '900 14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      if (!isBatterySaver) {
          this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
          this.ctx.shadowBlur = 4;
      }
      this.ctx.fillText(timeText, this.width / 2, 80);
      this.ctx.restore();
  }
  public drawVideoOverlay(score: number) {
      this.ctx.save();
      const timeText = `Survived: ${(score / 1000).toFixed(2)}s`;
      this.ctx.font = '16px "Rubik Mono One", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = 'black';
      this.ctx.strokeText(timeText, this.width / 2, 40);
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText(timeText, this.width / 2, 40);
      const watermark = "For Ducks Sake";
      this.ctx.font = '14px "Rubik Mono One", sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'bottom';
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      this.ctx.strokeText(watermark, this.width - 20, this.height - 20);
      this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
      this.ctx.fillText(watermark, this.width - 20, this.height - 20);
      this.ctx.restore();
  }
  public drawFPS(fps: number) {
      this.ctx.save();
      this.ctx.font = 'bold 12px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'top';
      let color = '#00FF00';
      if (fps < 30) color = '#FF0000';
      else if (fps < 50) color = '#FFFF00';
      this.ctx.fillStyle = color;
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 2;
      const text = `${fps} FPS`;
      this.ctx.strokeText(text, 10, 10);
      this.ctx.fillText(text, 10, 10);
      this.ctx.restore();
  }
}