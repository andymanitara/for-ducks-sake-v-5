import { ReplayFrame, GhostData, Duck, Hazard } from '@/types/game';
import { GAME_CONSTANTS } from '@/game/constants';
export class ReplaySystem {
  private replayBuffer: ReplayFrame[] = [];
  private ghostBuffer: ReplayFrame[] = [];
  private isRecording: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private activeStream: MediaStream | null = null;
  public reset() {
    // Stop recorder if active
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    // Explicitly stop all tracks in the active stream to release camera/canvas resources
    if (this.activeStream) {
        this.activeStream.getTracks().forEach(track => track.stop());
        this.activeStream = null;
    }
    this.replayBuffer = [];
    this.ghostBuffer = [];
    this.isRecording = false;
    this.mediaRecorder = null;
  }
  public recordFrame(
    duck: Duck,
    hazards: Hazard[],
    timeElapsed: number,
    hasSubmittedScore: boolean,
    internalMode: 'playing' | 'dying' | 'replay',
    dyingTimer?: number
  ) {
      if (hasSubmittedScore) return;
      // Lightweight Ghost Frame
      const lightFrame: ReplayFrame = {
          x: duck.position.x,
          y: duck.position.y,
          rotation: duck.rotation,
          scale: { ...duck.scale },
          skinId: duck.skinId,
          timestamp: timeElapsed,
          faceDirection: duck.faceDirection,
          internalMode,
          dyingTimer,
          state: duck.state,
          vx: duck.velocity.x, // Capture velocity
          vy: duck.velocity.y  // Capture velocity
      };
      this.ghostBuffer.push(lightFrame);
      if (this.ghostBuffer.length > GAME_CONSTANTS.REPLAY.BUFFER_SIZE) {
          this.ghostBuffer.shift();
      }
      // Full Replay Frame
      const fullFrame: ReplayFrame = {
          ...lightFrame,
          hazards: hazards.map(h => ({ ...h, position: { ...h.position }, velocity: { ...h.velocity } })) // Deep clone needed
      };
      this.replayBuffer.push(fullFrame);
      if (this.replayBuffer.length > GAME_CONSTANTS.REPLAY.BUFFER_SIZE) {
          this.replayBuffer.shift();
      }
  }
  public getReplayBuffer() { return this.replayBuffer; }
  public getGhostBuffer() { return this.ghostBuffer; }
  public static isVideoSupported(): boolean {
    if (typeof MediaRecorder === 'undefined') return false;
    const types = [
        'video/mp4', 'video/webm;codecs=h264', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'
    ];
    return types.some(type => MediaRecorder.isTypeSupported(type));
  }
  public async generateVideo(canvas: HTMLCanvasElement, durationMs: number): Promise<Blob | null> {
    if (!canvas) return null;
    const mimeTypes = [
        'video/mp4', 'video/webm;codecs=h264', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'
    ];
    const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) return null;
    this.isRecording = true;
    // Capture stream and store reference for cleanup
    this.activeStream = canvas.captureStream(30);
    try {
        // Optimized bitrate: 1.5 Mbps (down from 2.5 Mbps) for smaller file sizes
        this.mediaRecorder = new MediaRecorder(this.activeStream, { mimeType, videoBitsPerSecond: 1500000 });
    } catch (e) {
        this.isRecording = false;
        // Cleanup if initialization fails
        if (this.activeStream) {
            this.activeStream.getTracks().forEach(track => track.stop());
            this.activeStream = null;
        }
        return null;
    }
    const chunks: Blob[] = [];
    this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    return new Promise((resolve) => {
        if (!this.mediaRecorder) { resolve(null); return; }
        this.mediaRecorder.onstop = () => {
            this.isRecording = false;
            this.mediaRecorder = null;
            // Stop tracks and clear reference to prevent leaks
            if (this.activeStream) {
                this.activeStream.getTracks().forEach(track => track.stop());
                this.activeStream = null;
            }
            if (chunks.length === 0) { resolve(null); return; }
            resolve(new Blob(chunks, { type: mimeType }));
        };
        this.mediaRecorder.start();
        setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }
        }, durationMs);
    });
  }
}