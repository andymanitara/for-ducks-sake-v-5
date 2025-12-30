import { Duck, Hazard, ReplayFrame, TrailPoint } from '@/types/game';
import { GAME_CONSTANTS, SKINS } from '@/game/constants';
import { adjustColor } from '@/lib/utils';
import { useGameStore } from '@/lib/store';
export class EntityRenderer {
  private ctx: CanvasRenderingContext2D;
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
  public drawDuck(duck: Duck) {
    const { x, y } = duck.position;
    const r = duck.radius;
    const skin = SKINS.find(s => s.id === duck.skinId) || SKINS[0];
    // Draw trail BEFORE body to ensure it appears underneath
    this.drawTrail(duck.trail, skin.color, skin.trailType);
    // If duck is dead, do not draw the body, only the trail remains visible
    if (duck.state === 'dead') return;
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(duck.scale.x, duck.scale.y);
    // Wobble
    const scaleX = 1 + Math.sin(duck.wobble) * 0.05;
    const scaleY = 1 - Math.sin(duck.wobble) * 0.05;
    this.ctx.scale(scaleX, scaleY);
    // Tilt
    const tilt = duck.velocity.x * 0.001;
    this.ctx.rotate(tilt);
    // Shadow
    this.ctx.beginPath();
    this.ctx.ellipse(0, r + 5, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = GAME_CONSTANTS.VISUALS.SHADOW_COLOR;
    this.ctx.fill();
    // Body
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r, 0, Math.PI * 2);
    this.ctx.fillStyle = skin.color;
    this.ctx.fill();
    this.ctx.lineWidth = GAME_CONSTANTS.VISUALS.OUTLINE_WIDTH;
    this.ctx.strokeStyle = GAME_CONSTANTS.COLORS.DUCK_OUTLINE;
    this.ctx.stroke();
    // Highlight
    this.ctx.beginPath();
    this.ctx.ellipse(-r/3, -r/3, r/3, r/5, -Math.PI/4, 0, Math.PI * 2);
    this.ctx.fillStyle = GAME_CONSTANTS.VISUALS.HIGHLIGHT_COLOR;
    this.ctx.fill();
    // Skin Specifics
    this.drawSkinDetails(duck.skinId, r);
    // Face
    if (skin.accessory !== 'visor') {
        this.drawEyes(duck, r);
    }
    // Reset stroke style for beak to prevent bleeding from skin details (e.g. La Fleur red trim)
    this.ctx.strokeStyle = GAME_CONSTANTS.COLORS.DUCK_OUTLINE;
    // Standardize beak outline width for ALL skins, including La Fleur
    this.ctx.lineWidth = GAME_CONSTANTS.VISUALS.OUTLINE_WIDTH;
    this.ctx.fillStyle = GAME_CONSTANTS.COLORS.DUCK_BEAK;
    this.ctx.beginPath();
    this.ctx.ellipse(0, r/4, r/2, r/3, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    // Accessory
    this.drawAccessory(skin.accessory, r);
    // Glitch Overlay (Top Layer)
    if (duck.skinId === 'glitch_duck') {
        this.drawGlitchOverlay(r);
    }
    this.ctx.restore();
  }
  private drawTrail(trail: TrailPoint[], color: string, trailType: string = 'standard') {
    if (trail.length < 2) return;
    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    for (let i = 0; i < trail.length - 1; i++) {
        const p1 = trail[i];
        const p2 = trail[i+1];
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.lineWidth = p1.width;
        this.ctx.strokeStyle = color;
        // If using a particle trail, make the line trail much more subtle
        let alpha = p1.opacity * 0.5;
        if (trailType !== 'standard') {
            alpha = p1.opacity * 0.15;
        }
        this.ctx.globalAlpha = alpha;
        this.ctx.stroke();
    }
    this.ctx.restore();
  }
  public drawHazard(hazard: Hazard) {
    if (hazard.hazardType === 'laser') {
        this.drawLaser(hazard);
        return;
    }
    if (hazard.hazardType === 'explosion') {
        this.drawExplosion(hazard);
        return;
    }
    const { x, y } = hazard.position;
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(hazard.rotation);
    this.ctx.globalAlpha = hazard.spawnTimer;
    if (hazard.hazardType === 'glitch_square' || hazard.hazardType === 'pixel_orb') {
        this.drawGlitchHazard(hazard);
        this.ctx.restore();
        return;
    }
    // Frog Scaling
    if (hazard.hazardType === 'frog') {
        if (hazard.aiState === 'charge') this.ctx.scale(1.2, 0.8);
        else if (hazard.aiState === 'jump' || hazard.aiState === 'leave') this.ctx.scale(0.8, 1.2);
    }
    this.ctx.lineWidth = GAME_CONSTANTS.VISUALS.OUTLINE_WIDTH;
    this.ctx.strokeStyle = '#000';
    if (hazard.shape === 'rectangle') {
      this.drawRectHazard(hazard);
    } else {
      this.drawCircleHazard(hazard);
    }
    this.ctx.restore();
  }
  public drawGhost(frame: ReplayFrame, label: string = 'PB', color: string = '#A0D8EF') {
    const { x, y, scale } = frame;
    const isBatterySaver = useGameStore.getState().isBatterySaver;
    const r = GAME_CONSTANTS.DUCK_RADIUS;
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale.x, scale.y);
    if (label === 'RIVAL') {
        this.ctx.shadowColor = '#FF0000';
        if (!isBatterySaver) this.ctx.shadowBlur = 15;
    }
    const pulse = 0.4 + Math.sin(Date.now() / 200) * 0.1;
    this.ctx.globalAlpha = pulse;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, 0, -r - 5);
    this.ctx.restore();
  }
  // --- Helper Methods ---
  private drawSkinDetails(skinId: string, r: number) {
      const s = r / 70;
      if (skinId === 'lafleur') {
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.moveTo(-70 * s, -20 * s);
        this.ctx.quadraticCurveTo(0, -80 * s, 70 * s, -20 * s);
        this.ctx.lineTo(70 * s, 0);
        this.ctx.quadraticCurveTo(0, -60 * s, -70 * s, 0);
        this.ctx.fill();
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(-65 * s, 20 * s);
        this.ctx.quadraticCurveTo(0, 80 * s, 65 * s, 20 * s);
        this.ctx.arc(0, 0, r, Math.atan2(20 * s, 65 * s), Math.atan2(20 * s, -65 * s), false);
        this.ctx.fill();
        // Red Trim
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 5 * s;
        this.ctx.beginPath();
        this.ctx.moveTo(-65 * s, 20 * s);
        this.ctx.quadraticCurveTo(0, 80 * s, 65 * s, 20 * s);
        this.ctx.stroke();
      } else if (skinId === 'quackers') {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#E0E0E0';
        this.ctx.lineWidth = 4 * s;
        this.ctx.beginPath();
        this.ctx.moveTo(-50 * s, 20 * s);
        this.ctx.quadraticCurveTo(0, 80 * s, 50 * s, 20 * s);
        this.ctx.lineTo(50 * s, -10 * s);
        this.ctx.quadraticCurveTo(0, 40 * s, -50 * s, -10 * s);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
      } else if (skinId === 'sir_quacks_alot') {
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.strokeStyle = '#808080';
        this.ctx.lineWidth = 6 * s;
        this.ctx.beginPath();
        this.ctx.moveTo(-65 * s, 20 * s);
        this.ctx.quadraticCurveTo(0, 80 * s, 65 * s, 20 * s);
        const startAngle = Math.atan2(20 * s, 65 * s);
        const endAngle = Math.atan2(20 * s, -65 * s);
        this.ctx.arc(0, 0, r, startAngle, endAngle, false);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.fillStyle = '#606060';
        this.ctx.beginPath();
        this.ctx.arc(0, 50 * s, 5 * s, 0, Math.PI * 2);
        this.ctx.fill();
      }
  }
  private drawGlitchOverlay(r: number) {
      const s = r / 70;
      this.ctx.font = `bold ${18 * s}px monospace`;
      this.ctx.fillStyle = '#00FF00';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const time = Math.floor(Date.now() / 100);
      // Draw binary digits over face
      this.ctx.fillText(time % 2 === 0 ? '1' : '0', -15 * s, -10 * s);
      this.ctx.fillText((time + 1) % 2 === 0 ? '0' : '1', 15 * s, 5 * s);
      this.ctx.fillText((time + 2) % 2 === 0 ? '1' : '0', 0 * s, 20 * s);
      // Random glitch rectangle
      if (Math.random() > 0.85) {
          this.ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
          const rx = (Math.random() - 0.5) * r * 1.2;
          const ry = (Math.random() - 0.5) * r * 1.2;
          this.ctx.fillRect(rx, ry, 25 * s, 6 * s);
      }
  }
  private drawEyes(duck: Duck, r: number) {
      if (duck.skinId === 'quackers') {
          // Quackers eyes logic - Updated to match UI (Loopy Eyes)
          const eyeOffsetX = r/3;
          const eyeOffsetY = -r/4;
          // Left Eye (Big)
          this.ctx.save();
          this.ctx.translate(-eyeOffsetX, eyeOffsetY);
          this.ctx.fillStyle = 'white';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, r/2.5, 0, Math.PI*2);
          this.ctx.fill();
          // Outline
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#000';
          this.ctx.stroke();
          // Loopy Ring
          this.ctx.beginPath();
          this.ctx.arc(r/14, -r/14, r/6, 0, Math.PI*2); // Larger radius than pupil
          this.ctx.stroke();
          // Pupil - Off center (5, -5)
          this.ctx.fillStyle = 'black';
          this.ctx.beginPath();
          this.ctx.arc(r/14, -r/14, r/12, 0, Math.PI*2); // Smaller pupil
          this.ctx.fill();
          this.ctx.restore();
          // Right Eye (Small)
          this.ctx.save();
          this.ctx.translate(eyeOffsetX, eyeOffsetY);
          this.ctx.fillStyle = 'white';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, r/3.5, 0, Math.PI*2);
          this.ctx.fill();
          // Outline
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#000';
          this.ctx.stroke();
          // Loopy Ring
          this.ctx.beginPath();
          this.ctx.arc(-r/35, r/35, r/8, 0, Math.PI*2);
          this.ctx.stroke();
          // Pupil - Off center (-2, 2)
          this.ctx.fillStyle = 'black';
          this.ctx.beginPath();
          this.ctx.arc(-r/35, r/35, r/14, 0, Math.PI*2);
          this.ctx.fill();
          this.ctx.restore();
          return;
      }
      // Dynamic Panic Scaling
      const panic = Math.max(0, Math.min(1, duck.panicLevel));
      // Eye Radius: Grows with panic
      // Calm: r/3.5 (~0.28r)
      // Panic: r/2.2 (~0.45r)
      const minEyeR = r / 3.5;
      const maxEyeR = r / 2.2;
      const eyeRadius = minEyeR + (maxEyeR - minEyeR) * panic;
      // Pupil Radius: Grows with panic (Dilated)
      // Calm: r / 9
      // Panic: r / 5.5
      const minPupilR = r / 9;
      const maxPupilR = r / 5.5;
      const pupilRadius = minPupilR + (maxPupilR - minPupilR) * panic;
      // Blinking: Suppressed at high panic
      const isBlinking = panic < 0.5 && duck.blinkTimer > GAME_CONSTANTS.ANIMATION.BLINK_INTERVAL;
      // Offset: Eyes might need to move apart slightly if they get huge?
      // Let's keep fixed offset for now: r/3.
      const eyeOffsetX = r / 3;
      const eyeOffsetY = -r / 4;
      this.drawSingleEye(-eyeOffsetX, eyeOffsetY, eyeRadius, pupilRadius, isBlinking, duck.faceDirection, panic > 0.5);
      this.drawSingleEye(eyeOffsetX, eyeOffsetY, eyeRadius, pupilRadius, isBlinking, duck.faceDirection, panic > 0.5);
  }
  private drawSingleEye(x: number, y: number, r: number, pupilR: number, blink: boolean, dir: number, isPanic: boolean) {
      this.ctx.save();
      if (blink) {
          // Draw closed eye (curved line)
          this.ctx.beginPath();
          this.ctx.moveTo(x - r, y);
          this.ctx.quadraticCurveTo(x, y + r/2, x + r, y);
          this.ctx.lineWidth = 3;
          this.ctx.strokeStyle = '#000';
          this.ctx.stroke();
      } else {
          // Sclera
          this.ctx.fillStyle = 'white';
          this.ctx.beginPath();
          this.ctx.arc(x, y, r, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#000';
          this.ctx.stroke();
          // Pupil
          const lookX = Math.cos(dir) * (r/4);
          const lookY = Math.sin(dir) * (r/4);
          this.ctx.fillStyle = 'black';
          this.ctx.beginPath();
          this.ctx.arc(x + lookX, y + lookY, pupilR, 0, Math.PI * 2);
          this.ctx.fill();
          // Highlight (only if not panicked)
          if (!isPanic) {
              this.ctx.fillStyle = 'white';
              this.ctx.beginPath();
              this.ctx.arc(x + lookX + pupilR/2, y + lookY - pupilR/2, pupilR/3, 0, Math.PI * 2);
              this.ctx.fill();
          }
      }
      this.ctx.restore();
  }
  private drawAccessory(type: string, r: number) {
      const s = r / 70;
      if (type === 'tophat') {
          this.ctx.save();
          this.ctx.translate(0, -r); // Move to top of head
          // Hat Body
          this.ctx.fillStyle = '#222';
          this.ctx.strokeStyle = '#000';
          this.ctx.lineWidth = 5 * s;
          this.ctx.beginPath();
          this.ctx.rect(-40 * s, -50 * s, 80 * s, 60 * s);
          this.ctx.fill();
          this.ctx.stroke();
          // Hat Brim
          this.ctx.beginPath();
          if (this.ctx.roundRect) {
              this.ctx.roundRect(-60 * s, 10 * s, 120 * s, 15 * s, 5 * s);
          } else {
              this.ctx.rect(-60 * s, 10 * s, 120 * s, 15 * s);
          }
          this.ctx.fill();
          this.ctx.stroke();
          // Red Band
          this.ctx.fillStyle = '#C00';
          this.ctx.beginPath();
          this.ctx.rect(-40 * s, 0, 80 * s, 10 * s);
          this.ctx.fill();
          this.ctx.restore();
      } else if (type === 'headband') {
          this.ctx.fillStyle = '#D32F2F';
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 4 * s;
          this.ctx.beginPath();
          this.ctx.moveTo(-70 * s, -50 * s);
          this.ctx.quadraticCurveTo(0, -75 * s, 70 * s, -50 * s);
          this.ctx.lineTo(70 * s, -32 * s);
          this.ctx.quadraticCurveTo(0, -55 * s, -70 * s, -32 * s);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.arc(68 * s, -45 * s, 12 * s, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.moveTo(75 * s, -45 * s);
          this.ctx.lineTo(95 * s, -55 * s);
          this.ctx.lineTo(95 * s, -25 * s);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
      } else if (type === 'headband_simple') {
          this.ctx.fillStyle = '#D32F2F';
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 4 * s;
          this.ctx.beginPath();
          this.ctx.moveTo(-70 * s, -50 * s);
          this.ctx.quadraticCurveTo(0, -75 * s, 70 * s, -50 * s);
          this.ctx.lineTo(70 * s, -32 * s);
          this.ctx.quadraticCurveTo(0, -55 * s, -70 * s, -32 * s);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
      } else if (type === 'headband_striped') {
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.rect(-r, -r/2, r*2, r/4);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.fillStyle = '#FF0000';
          this.ctx.beginPath();
          this.ctx.rect(-r + 5, -r/2, 10, r/4);
          this.ctx.rect(-r + 25, -r/2, 10, r/4);
          this.ctx.rect(0, -r/2, 10, r/4);
          this.ctx.rect(20, -r/2, 10, r/4);
          this.ctx.fill();
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.beginPath();
          this.ctx.arc(r, -r/2 + r/8, r/4, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
      } else if (type === 'sunglasses') {
          this.ctx.save();
          this.ctx.translate(0, -17.5 * s); // Match SVG offset (82.5 - 100)
          // Main Lens Shape
          this.ctx.fillStyle = 'black';
          this.ctx.strokeStyle = 'black';
          this.ctx.lineWidth = 3 * s;
          this.ctx.beginPath();
          this.ctx.moveTo(-55 * s, 0);
          this.ctx.lineTo(55 * s, 0);
          this.ctx.lineTo(50 * s, 30 * s);
          this.ctx.quadraticCurveTo(25 * s, 40 * s, 0, 10 * s);
          this.ctx.quadraticCurveTo(-25 * s, 40 * s, -50 * s, 30 * s);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          // Arms
          this.ctx.lineWidth = 5 * s;
          this.ctx.beginPath();
          this.ctx.moveTo(-55 * s, 0);
          this.ctx.lineTo(-75 * s, -15 * s);
          this.ctx.moveTo(55 * s, 0);
          this.ctx.lineTo(75 * s, -15 * s);
          this.ctx.stroke();
          // Highlight
          this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
          this.ctx.beginPath();
          this.ctx.moveTo(-40 * s, 5 * s);
          this.ctx.lineTo(-20 * s, 5 * s);
          this.ctx.lineTo(-30 * s, 15 * s);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.restore();
      } else if (type === 'helmet') {
          this.ctx.save();
          // Glass Dome
          this.ctx.beginPath();
          this.ctx.arc(0, 0, r * 1.15, Math.PI, 0);
          this.ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
          this.ctx.fill();
          // Metallic Rim
          this.ctx.strokeStyle = '#9E9E9E';
          this.ctx.lineWidth = 8 * s;
          this.ctx.stroke();
          // Specular Highlight
          this.ctx.beginPath();
          this.ctx.ellipse(0, -r * 0.9, 20 * s, 10 * s, -Math.PI / 6, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          this.ctx.fill();
          this.ctx.restore();
      } else if (type === 'cap_cigar') {
          this.ctx.fillStyle = '#1976D2';
          this.ctx.strokeStyle = '#0D47A1';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(-r*0.1, -r/3, r, Math.PI, 0);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.fillStyle = '#0D47A1';
          this.ctx.beginPath();
          this.ctx.moveTo(r * 0.8, -r/3);
          this.ctx.lineTo(r * 1.5, -r/3);
          this.ctx.lineTo(r * 1.5, -r/3 + r/4);
          this.ctx.lineTo(r * 0.8, -r/3 + r/4);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.save();
          this.ctx.translate(r/2, r/3);
          this.ctx.rotate(0.2);
          this.ctx.fillStyle = '#795548';
          this.ctx.fillRect(0, 0, r/2, r/6);
          this.ctx.strokeRect(0, 0, r/2, r/6);
          this.ctx.fillStyle = '#BDBDBD';
          this.ctx.fillRect(r/2, 0, r/8, r/6);
          const t = Date.now() / 1000;
          this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(t * 5) * 0.2})`;
          this.ctx.beginPath();
          this.ctx.arc(r/2 + r/8 + 5, -5 - (t % 1) * 10, 3 + (t % 1) * 5, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
      } else if (type === 'knight') {
          this.ctx.fillStyle = '#C0C0C0';
          this.ctx.strokeStyle = '#606060';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(0, -r/3, r * 1.1, Math.PI, 0);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.fillStyle = '#404040';
          this.ctx.beginPath();
          this.ctx.rect(-r * 0.8, -r/3, r * 1.6, r/4);
          this.ctx.fill();
          this.ctx.fillStyle = '#D32F2F';
          this.ctx.beginPath();
          this.ctx.moveTo(0, -r * 1.4);
          this.ctx.quadraticCurveTo(r, -r * 1.8, r * 1.2, -r * 0.8);
          this.ctx.quadraticCurveTo(r * 0.8, -r * 1.2, 0, -r * 1.1);
          this.ctx.fill();
      } else if (type === 'visor') {
          this.ctx.fillStyle = '#222';
          this.ctx.strokeStyle = '#000';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(-r * 0.8, -r * 0.2);
          this.ctx.quadraticCurveTo(0, -r * 0.4, r * 0.8, -r * 0.2);
          this.ctx.lineTo(r * 0.8, r * 0.2);
          this.ctx.quadraticCurveTo(0, r * 0.4, -r * 0.8, r * 0.2);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          // Glowing line
          this.ctx.strokeStyle = '#00FFFF';
          this.ctx.lineWidth = 3;
          this.ctx.shadowBlur = 10;
          this.ctx.shadowColor = '#00FFFF';
          this.ctx.beginPath();
          this.ctx.moveTo(-r * 0.6, 0);
          this.ctx.quadraticCurveTo(0, r * 0.1, r * 0.6, 0);
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;
      } else if (type === 'flames') {
          const t = Date.now() / 200;
          this.ctx.save();
          this.ctx.translate(0, -r * 0.8);
          // Flame 1
          this.ctx.fillStyle = '#FF4500';
          this.ctx.beginPath();
          this.ctx.moveTo(-10 * s, 0);
          this.ctx.quadraticCurveTo(-20 * s + Math.sin(t) * 5 * s, -40 * s, 0, -60 * s + Math.sin(t * 1.5) * 10 * s);
          this.ctx.quadraticCurveTo(20 * s + Math.sin(t + 1) * 5 * s, -40 * s, 10 * s, 0);
          this.ctx.fill();
          // Flame 2 (Inner)
          this.ctx.fillStyle = '#FFD700';
          this.ctx.beginPath();
          this.ctx.moveTo(-5 * s, -10 * s);
          this.ctx.quadraticCurveTo(-10 * s + Math.sin(t + 2) * 3 * s, -30 * s, 0, -45 * s + Math.sin(t * 2) * 5 * s);
          this.ctx.quadraticCurveTo(10 * s + Math.sin(t + 3) * 3 * s, -30 * s, -5 * s, -10 * s);
          this.ctx.fill();
          this.ctx.restore();
      }
  }
  private drawRectHazard(hazard: Hazard) {
      const w = hazard.width;
      const h = hazard.height;
      if (hazard.hazardType === 'shower_jet') {
          // Shower jet drawing logic
          const isVertical = h > w;
          const grad = this.ctx.createLinearGradient(
              isVertical ? 0 : -w/2,
              isVertical ? -h/2 : 0,
              isVertical ? 0 : w/2,
              isVertical ? h/2 : 0
          );
          grad.addColorStop(0, 'rgba(135, 206, 235, 0.8)');
          grad.addColorStop(1, 'rgba(135, 206, 235, 0.0)');
          this.ctx.fillStyle = grad;
          this.ctx.beginPath();
          if (this.ctx.roundRect) {
              this.ctx.roundRect(-w/2, -h/2, w, h, 10);
          } else {
              this.ctx.rect(-w/2, -h/2, w, h);
          }
          this.ctx.fill();
          const time = Date.now() / 100;
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          const particleCount = 5;
          for (let i = 0; i < particleCount; i++) {
              const offset = (time + i * (100 / particleCount)) % 100 / 100;
              const pSize = (w + h) / 2 * 0.1 * (1 - offset);
              let px = 0, py = 0;
              if (isVertical) {
                  px = (Math.random() - 0.5) * w * 0.6;
                  py = -h/2 + offset * h;
              } else {
                  px = -w/2 + offset * w;
                  py = (Math.random() - 0.5) * h * 0.6;
              }
              this.ctx.beginPath();
              this.ctx.arc(px, py, pSize, 0, Math.PI * 2);
              this.ctx.fill();
          }
          this.ctx.fillStyle = '#A0A0A0';
          this.ctx.strokeStyle = '#606060';
          this.ctx.lineWidth = 2;
          const nozzleSize = Math.min(w, h) * 1.5;
          const nozzleDepth = 15;
          this.ctx.beginPath();
          if (isVertical) {
              this.ctx.rect(-nozzleSize/2, -h/2 - nozzleDepth, nozzleSize, nozzleDepth);
          } else {
              this.ctx.rect(-w/2 - nozzleDepth, -nozzleSize/2, nozzleDepth, nozzleSize);
          }
          this.ctx.fill();
          this.ctx.stroke();
          return;
      }
      if (hazard.color.startsWith('#')) {
          const grad = this.ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
          grad.addColorStop(0, adjustColor(hazard.color, 40));
          grad.addColorStop(1, hazard.color);
          this.ctx.fillStyle = grad;
      } else {
          this.ctx.fillStyle = hazard.color;
      }
      if (hazard.hazardType === 'icicle') {
          this.ctx.beginPath();
          this.ctx.moveTo(-w/2, -h/2);
          this.ctx.lineTo(w/2, -h/2);
          this.ctx.lineTo(0, h/2);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(-w/4, -h/4);
          this.ctx.lineTo(0, h/4);
          this.ctx.stroke();
      } else if (hazard.hazardType === 'frisbee') {
          this.ctx.beginPath();
          this.ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.ellipse(0, 0, w/3, h/3, 0, 0, Math.PI * 2);
          this.ctx.stroke();
      } else if (hazard.hazardType === 'gift') {
          this.ctx.beginPath();
          this.ctx.rect(-w/2, -h/2, w, h);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.fillStyle = '#FFD700';
          this.ctx.fillRect(-w/2, -5, w, 10);
          this.ctx.fillRect(-5, -h/2, 10, h);
      } else if (hazard.hazardType === 'candy_cane') {
          this.ctx.beginPath();
          if (this.ctx.roundRect) {
              this.ctx.roundRect(-w/2, -h/2, w, h, 10);
          } else {
              this.ctx.rect(-w/2, -h/2, w, h);
          }
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.fillStyle = '#FF0000';
          for(let i = -h/2; i < h/2; i+=20) {
              this.ctx.fillRect(-w/2, i, w, 10);
          }
      } else if (hazard.hazardType === 'wrench') {
          this.ctx.fillStyle = '#C0C0C0';
          this.ctx.fillRect(-w/2, -h/4, w * 0.7, h/2);
          this.ctx.beginPath();
          this.ctx.arc(w/2 - h, 0, h, 0.5, 5.8);
          this.ctx.lineTo(w/2 - h, 0);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.fillStyle = '#808080';
          this.ctx.fillRect(w/4, -h/2, w/6, h);
      } else if (hazard.hazardType === 'spanner') {
          this.ctx.fillStyle = '#A9A9A9';
          this.ctx.fillRect(-w/2 + h, -h/3, w - 2*h, h*0.66);
          this.ctx.save();
          this.ctx.translate(-w/2 + h/2, 0);
          this.ctx.rotate(0.3);
          this.ctx.beginPath();
          this.ctx.arc(0, 0, h, 0.8, 5.5);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.restore();
          this.ctx.save();
          this.ctx.translate(w/2 - h/2, 0);
          this.ctx.rotate(0.3);
          this.ctx.beginPath();
          this.ctx.arc(0, 0, h, 3.9, 2.4);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.restore();
      } else if (hazard.hazardType === 'shampoo_bottle') {
          this.ctx.beginPath();
          if (this.ctx.roundRect) {
              this.ctx.roundRect(-w/2, -h/2, w, h, 8);
          } else {
              this.ctx.rect(-w/2, -h/2, w, h);
          }
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.fillStyle = '#FFF';
          this.ctx.beginPath();
          this.ctx.rect(-w/3, -h/2 - 10, w/1.5, 10);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
          this.ctx.fillRect(-w/3, -h/4, w/1.5, h/2);
      } else {
          this.ctx.beginPath();
          if (this.ctx.roundRect) {
              this.ctx.roundRect(-w/2, -h/2, w, h, 10);
          } else {
              this.ctx.rect(-w/2, -h/2, w, h);
          }
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          this.ctx.beginPath();
          this.ctx.moveTo(-w/2 + 10, 0);
          this.ctx.lineTo(w/2 - 10, 0);
          this.ctx.stroke();
      }
  }
  private drawCircleHazard(hazard: Hazard) {
      const r = hazard.radius;
      // Custom Rock Rendering
      if (hazard.hazardType === 'rock') {
          // Deterministic RNG based on hazard ID to keep shape consistent per rock
          let seed = 0;
          for (let i = 0; i < hazard.id.length; i++) {
              seed = ((seed << 5) - seed) + hazard.id.charCodeAt(i);
              seed |= 0;
          }
          const random = () => {
              const x = Math.sin(seed++) * 10000;
              return x - Math.floor(x);
          };
          // Generate jagged polygon vertices
          this.ctx.beginPath();
          const vertices = 7 + Math.floor(random() * 5); // 7 to 11 vertices
          for (let i = 0; i < vertices; i++) {
              const angle = (i / vertices) * Math.PI * 2;
              // Vary radius between 80% and 110% of collision radius
              // This maintains the general size while adding irregularity
              const rad = r * (0.8 + random() * 0.3);
              const x = Math.cos(angle) * rad;
              const y = Math.sin(angle) * rad;
              if (i === 0) this.ctx.moveTo(x, y);
              else this.ctx.lineTo(x, y);
          }
          this.ctx.closePath();
          // Gradient Fill
          const grad = this.ctx.createRadialGradient(-r/3, -r/3, r/10, 0, 0, r);
          const baseColor = '#808080'; // Force grey base
          try {
             grad.addColorStop(0, adjustColor(baseColor, 40)); // Highlight
             grad.addColorStop(1, adjustColor(baseColor, -30)); // Shadow
          } catch (e) {
             grad.addColorStop(0, '#A9A9A9'); // DarkGray
             grad.addColorStop(1, '#696969'); // DimGray
          }
          this.ctx.fillStyle = grad;
          this.ctx.fill();
          // Outline
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = 'rgba(0,0,0,0.6)';
          this.ctx.stroke();
          // Internal Texture (Cracks)
          this.ctx.beginPath();
          this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          this.ctx.lineWidth = 1.5;
          const cracks = 2 + Math.floor(random() * 2);
          for(let i=0; i<cracks; i++) {
             // Random line across part of the rock
             const startAngle = random() * Math.PI * 2;
             const len = r * (0.4 + random() * 0.4);
             const startR = r * (0.2 + random() * 0.5);
             const sx = Math.cos(startAngle) * startR;
             const sy = Math.sin(startAngle) * startR;
             // Jagged line
             this.ctx.moveTo(sx, sy);
             this.ctx.lineTo(sx + (Math.random()-0.5)*len, sy + (Math.random()-0.5)*len);
          }
          this.ctx.stroke();
          // Highlight Specks
          this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
          for(let i=0; i<4; i++) {
              const speckR = random() * r * 0.7;
              const speckAngle = random() * Math.PI * 2;
              this.ctx.beginPath();
              this.ctx.arc(Math.cos(speckAngle) * speckR, Math.sin(speckAngle) * speckR, 1 + random() * 2, 0, Math.PI * 2);
              this.ctx.fill();
          }
          return;
      }
      if (hazard.hazardType === 'pocket') {
          const grad = this.ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
          grad.addColorStop(0, '#000000');
          grad.addColorStop(0.8, '#1a1a1a');
          grad.addColorStop(1, '#2d2d2d');
          this.ctx.fillStyle = grad;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, r, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = '#3E2723';
          this.ctx.lineWidth = 4;
          this.ctx.stroke();
          return;
      }
      if (hazard.color.startsWith('#')) {
          try {
              const grad = this.ctx.createRadialGradient(-r/3, -r/3, r/4, 0, 0, r);
              const adjusted = adjustColor(hazard.color, 40);
              grad.addColorStop(0, adjusted);
              grad.addColorStop(1, hazard.color);
              this.ctx.fillStyle = grad;
          } catch (e) {
              this.ctx.fillStyle = hazard.color;
          }
      } else {
          this.ctx.fillStyle = hazard.color;
      }
      this.ctx.beginPath();
      this.ctx.arc(0, 0, r, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      if (hazard.hazardType === 'frog') {
          // Frog eyes
          const eyeR = r/2.5;
          const eyeX = r/2;
          const eyeY = -r/3;
          this.ctx.fillStyle = 'white';
          this.ctx.beginPath();
          this.ctx.arc(-eyeX, eyeY, eyeR, 0, Math.PI * 2);
          this.ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.fillStyle = 'black';
          this.ctx.beginPath();
          this.ctx.arc(-eyeX, eyeY, eyeR/2, 0, Math.PI * 2);
          this.ctx.arc(eyeX, eyeY, eyeR/2, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = 'white';
          this.ctx.beginPath();
          this.ctx.arc(-eyeX + 2, eyeY - 2, eyeR/4, 0, Math.PI * 2);
          this.ctx.arc(eyeX + 2, eyeY - 2, eyeR/4, 0, Math.PI * 2);
          this.ctx.fill();
      } else if (hazard.hazardType === 'drone') {
          this.ctx.fillStyle = GAME_CONSTANTS.COLORS.HAZARD_DRONE_LIGHT;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, r/2, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.save();
          this.ctx.rotate(Math.atan2(hazard.velocity.y, hazard.velocity.x) - hazard.rotation);
          this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
          this.ctx.beginPath();
          this.ctx.moveTo(0, 0);
          this.ctx.arc(0, 0, r * 3, -0.3, 0.3);
          this.ctx.fill();
          this.ctx.restore();
          this.ctx.strokeStyle = '#555';
          this.ctx.beginPath();
          this.ctx.moveTo(-r, -r);
          this.ctx.lineTo(r, r);
          this.ctx.moveTo(r, -r);
          this.ctx.lineTo(-r, r);
          this.ctx.stroke();
      } else if (hazard.hazardType === 'ornament') {
          this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
          this.ctx.beginPath();
          this.ctx.arc(-r/3, -r/3, r/4, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#C0C0C0';
          this.ctx.fillRect(-5, -r - 5, 10, 8);
      } else if (hazard.hazardType === 'dodgeball') {
          this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
          this.ctx.beginPath();
          this.ctx.arc(-r/3, -r/3, r/2, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = GAME_CONSTANTS.COLORS.HAZARD_DODGEBALL_TEXTURE;
          for(let i=0; i<8; i++) {
              const dx = (Math.random() - 0.5) * r * 1.5;
              const dy = (Math.random() - 0.5) * r * 1.5;
              if (dx*dx + dy*dy < r*r) {
                  this.ctx.beginPath();
                  this.ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
                  this.ctx.fill();
              }
          }
          this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
          this.ctx.stroke();
      } else if (hazard.hazardType === 'soap_bubble') {
          this.ctx.fillStyle = GAME_CONSTANTS.COLORS.HAZARD_BUBBLE;
          this.ctx.fill();
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.arc(-r/3, -r/3, r/4, 0, Math.PI * 2);
          this.ctx.fillStyle = GAME_CONSTANTS.COLORS.HAZARD_BUBBLE_SHINE;
          this.ctx.fill();
      } else if (hazard.hazardType.startsWith('pool_ball')) {
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.arc(-r/3, -r/3, r/4, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          this.ctx.fill();
          if (hazard.hazardType !== 'pool_ball_white') {
              this.ctx.beginPath();
              this.ctx.arc(0, 0, r/2.5, 0, Math.PI * 2);
              this.ctx.fillStyle = 'white';
              this.ctx.fill();
          }
      } else {
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.beginPath();
        this.ctx.arc(-r/3, -r/3, r/4, 0, Math.PI * 2);
        this.ctx.fill();
      }
  }
  private drawGlitchHazard(hazard: Hazard) {
      const offset = Math.sin(Date.now() / 50) * 3;
      this.ctx.save();
      this.ctx.translate(offset, 0);
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      this.drawGlitchShape(hazard);
      this.ctx.restore();
      this.ctx.save();
      this.ctx.translate(-offset, 0);
      this.ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
      this.drawGlitchShape(hazard);
      this.ctx.restore();
      this.ctx.fillStyle = hazard.color;
      this.ctx.strokeStyle = '#FFF';
      this.ctx.lineWidth = 2;
      this.drawGlitchShape(hazard);
      this.ctx.stroke();
  }
  private drawGlitchShape(hazard: Hazard) {
      if (hazard.hazardType === 'glitch_square') {
          this.ctx.beginPath();
          this.ctx.rect(-hazard.width/2, -hazard.height/2, hazard.width, hazard.height);
          this.ctx.fill();
      } else {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
          this.ctx.fill();
      }
  }
  private drawLaser(hazard: Hazard) {
      if (!hazard.laserEndpoints) return;
      const { start, end } = hazard.laserEndpoints;
      const isBatterySaver = useGameStore.getState().isBatterySaver;
      this.ctx.save();
      if (hazard.aiState === 'warning') {
          this.ctx.strokeStyle = GAME_CONSTANTS.COLORS.HAZARD_LASER_WARNING;
          this.ctx.lineWidth = 2;
          this.ctx.setLineDash([10, 10]);
          this.ctx.beginPath();
          this.ctx.moveTo(start.x, start.y);
          this.ctx.lineTo(end.x, end.y);
          this.ctx.stroke();
      } else if (hazard.aiState === 'active') {
          this.ctx.strokeStyle = GAME_CONSTANTS.COLORS.HAZARD_LASER_ACTIVE;
          this.ctx.lineWidth = 20;
          if (!isBatterySaver) {
              this.ctx.shadowBlur = 20;
              this.ctx.shadowColor = 'red';
          }
          this.ctx.lineCap = 'round';
          this.ctx.beginPath();
          this.ctx.moveTo(start.x, start.y);
          this.ctx.lineTo(end.x, end.y);
          this.ctx.stroke();
          this.ctx.strokeStyle = 'white';
          this.ctx.lineWidth = 6;
          this.ctx.shadowBlur = 0;
          this.ctx.stroke();
      }
      this.ctx.restore();
  }
  private drawExplosion(hazard: Hazard) {
      const progress = (hazard.aiTimer || 0) / GAME_CONSTANTS.EXPLOSION_DURATION;
      const maxRadius = hazard.radius * 1.5;
      const currentRadius = maxRadius * Math.sin(progress * Math.PI);
      this.ctx.save();
      this.ctx.translate(hazard.position.x, hazard.position.y);
      this.ctx.rotate(hazard.rotation + progress * 5);
      const layers = [
          { color: '#FF4500', scale: 1.0, offset: 0 },
          { color: '#FFD700', scale: 0.7, offset: 1 },
          { color: '#FFFFFF', scale: 0.4, offset: 2 }
      ];
      layers.forEach(layer => {
          this.ctx.fillStyle = layer.color;
          this.ctx.beginPath();
          const spikes = 8;
          const r = currentRadius * layer.scale;
          for (let i = 0; i < spikes * 2; i++) {
              const angle = (Math.PI * i) / spikes;
              const noise = Math.sin(i * 1.5 + progress * 10 + layer.offset) * 0.2 + 1;
              const val = (i % 2 === 0 ? r : r * 0.5) * noise;
              const x = Math.cos(angle) * val;
              const y = Math.sin(angle) * val;
              if (i === 0) this.ctx.moveTo(x, y);
              else this.ctx.lineTo(x, y);
          }
          this.ctx.closePath();
          this.ctx.fill();
      });
      this.ctx.restore();
  }
}