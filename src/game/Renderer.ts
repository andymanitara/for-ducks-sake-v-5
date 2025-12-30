import { Duck, Hazard, InputState, Particle, ReplayFrame, Shockwave, BiomeType, BarrageState } from '@/types/game';
import { BackgroundRenderer } from './renderers/BackgroundRenderer';
import { EntityRenderer } from './renderers/EntityRenderer';
import { EffectRenderer } from './renderers/EffectRenderer';
import { UIRenderer } from './renderers/UIRenderer';
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  // Sub-renderers
  private backgroundRenderer: BackgroundRenderer;
  private entityRenderer: EntityRenderer;
  private effectRenderer: EffectRenderer;
  private uiRenderer: UIRenderer;
  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.backgroundRenderer = new BackgroundRenderer(ctx, width, height);
    this.entityRenderer = new EntityRenderer(ctx);
    this.effectRenderer = new EffectRenderer(ctx, width, height);
    this.uiRenderer = new UIRenderer(ctx, width, height);
  }
  public resize(width: number, height: number, safeBottom: number = 0) {
    this.width = width;
    this.height = height;
    this.backgroundRenderer.resize(width, height, safeBottom);
    this.effectRenderer.resize(width, height);
    this.uiRenderer.resize(width, height);
  }
  public reset() {
    this.uiRenderer.reset();
  }
  public clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  // --- Delegation Methods ---
  public drawBackground(biome: BiomeType) {
    this.backgroundRenderer.draw(biome);
  }
  public drawDuck(duck: Duck) {
    this.entityRenderer.drawDuck(duck);
  }
  public drawHazard(hazard: Hazard) {
    this.entityRenderer.drawHazard(hazard);
  }
  public drawParticles(list: Particle[]) {
    this.effectRenderer.drawParticles(list);
  }
  public drawShockwave(shockwave: Shockwave) {
    this.effectRenderer.drawShockwave(shockwave);
  }
  public drawPanicVignette(panicLevel: number) {
    this.effectRenderer.drawPanicVignette(panicLevel);
  }
  public drawGhost(frame: ReplayFrame, label?: string, color?: string) {
    this.entityRenderer.drawGhost(frame, label, color);
  }
  public drawJoystick(input: InputState) {
    this.uiRenderer.drawJoystick(input);
  }
  public drawUIEffects(dt: number) {
    this.uiRenderer.drawUIEffects(dt);
  }
  public drawReplayOverlay() {
    this.uiRenderer.drawReplayOverlay();
  }
  public drawInGameTime(ms: number) {
    this.uiRenderer.drawInGameTime(ms);
  }
  public drawVideoOverlay(score: number) {
    this.uiRenderer.drawVideoOverlay(score);
  }
  public drawFPS(fps: number) {
    this.uiRenderer.drawFPS(fps);
  }
  public addFloatingText(x: number, y: number, text: string, color: string) {
    this.uiRenderer.addFloatingText(x, y, text, color);
  }
  public triggerLevelUp() {
    this.uiRenderer.triggerLevelUp();
  }
  public triggerNewRecord() {
    this.uiRenderer.triggerNewRecord();
  }
  public drawBarrageOverlay(state: BarrageState) {
    this.uiRenderer.drawBarrageOverlay(state);
  }
}