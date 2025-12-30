import { Vector2D, InputState } from '../types/game';
import { useGameStore } from '@/lib/store';
import { GAME_CONSTANTS } from './constants';
export class InputSystem {
  private state: InputState = {
    active: false,
    origin: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    vector: { x: 0, y: 0 },
  };
  private canvas: HTMLCanvasElement | null = null;
  private rect: DOMRect | null = null;
  constructor() {}
  public attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.updateRect();
    // Touch Events
    canvas.addEventListener('touchstart', this.handleStart, { passive: false });
    canvas.addEventListener('touchmove', this.handleMove, { passive: false });
    canvas.addEventListener('touchend', this.handleEnd);
    canvas.addEventListener('touchcancel', this.handleEnd);
    // Mouse Events (for desktop testing/drag)
    canvas.addEventListener('mousedown', this.handleStart);
    window.addEventListener('mousemove', this.handleMove);
    window.addEventListener('mouseup', this.handleEnd);
    // Resize observer to keep rect updated
    window.addEventListener('resize', this.updateRect);
  }
  public detach() {
    if (!this.canvas) return;
    this.canvas.removeEventListener('touchstart', this.handleStart);
    this.canvas.removeEventListener('touchmove', this.handleMove);
    this.canvas.removeEventListener('touchend', this.handleEnd);
    this.canvas.removeEventListener('touchcancel', this.handleEnd);
    this.canvas.removeEventListener('mousedown', this.handleStart);
    window.removeEventListener('mousemove', this.handleMove);
    window.removeEventListener('mouseup', this.handleEnd);
    window.removeEventListener('resize', this.updateRect);
    this.canvas = null;
  }
  private updateRect = () => {
    if (this.canvas) {
      this.rect = this.canvas.getBoundingClientRect();
    }
  };
  private getEventPos = (e: TouchEvent | MouseEvent): Vector2D => {
    let clientX = 0;
    let clientY = 0;
    if (window.TouchEvent && e instanceof TouchEvent) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e instanceof MouseEvent) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    if (!this.rect) this.updateRect();
    return {
      x: clientX - (this.rect?.left || 0),
      y: clientY - (this.rect?.top || 0),
    };
  };
  private handleStart = (e: TouchEvent | MouseEvent) => {
    if (e.cancelable) e.preventDefault();
    const pos = this.getEventPos(e);
    const joystickMode = useGameStore.getState().joystickMode;
    this.state.active = true;
    if (joystickMode === 'static' && this.rect) {
        // Fixed origin based on screen percentage
        const fixedX = this.rect.width * GAME_CONSTANTS.INPUT.STATIC_ANCHOR_X;
        const fixedY = this.rect.height * GAME_CONSTANTS.INPUT.STATIC_ANCHOR_Y;
        this.state.origin = { x: fixedX, y: fixedY };
        this.state.current = pos;
        // Calculate initial vector immediately
        const dx = pos.x - fixedX;
        const dy = pos.y - fixedY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 50; // Joystick radius
        if (dist > 0) {
            const scale = Math.min(dist, maxDist) / maxDist;
            this.state.vector = {
                x: (dx / dist) * scale,
                y: (dy / dist) * scale,
            };
        } else {
            this.state.vector = { x: 0, y: 0 };
        }
    } else {
        // Dynamic mode: origin is where you touch
        this.state.origin = pos;
        this.state.current = pos;
        this.state.vector = { x: 0, y: 0 };
    }
  };
  private handleMove = (e: TouchEvent | MouseEvent) => {
    if (!this.state.active) return;
    if (e.cancelable && e.type === 'touchmove') e.preventDefault();
    const pos = this.getEventPos(e);
    this.state.current = pos;
    // Calculate vector
    const dx = pos.x - this.state.origin.x;
    const dy = pos.y - this.state.origin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 50; // Joystick radius
    if (dist > 0) {
      // Normalize and clamp
      const scale = Math.min(dist, maxDist) / maxDist;
      this.state.vector = {
        x: (dx / dist) * scale,
        y: (dy / dist) * scale,
      };
    } else {
      this.state.vector = { x: 0, y: 0 };
    }
  };
  private handleEnd = () => {
    this.state.active = false;
    this.state.vector = { x: 0, y: 0 };
  };
  public getState(): InputState {
    return this.state;
  }
}