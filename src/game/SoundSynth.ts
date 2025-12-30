import { useGameStore } from '@/lib/store';
export class SoundSynth {
  private ctx: AudioContext | null = null;
  constructor() {
    // Lazy initialization
  }
  private getContext(): AudioContext | null {
    // Check if audio is enabled in store
    const isEnabled = useGameStore.getState().isAudioEnabled;
    if (!isEnabled) {
        if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
        }
        return null;
    }
    if (!this.ctx) {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    // We attempt to resume here, but it might fail if not in a user gesture
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }
  /**
   * Explicitly resumes the AudioContext.
   * Must be called within a user interaction handler (click/tap) to satisfy browser autoplay policies.
   */
  public resumeContext() {
      const ctx = this.getContext();
      if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
      }
  }
  private getMasterVolume(): number {
      return useGameStore.getState().volume;
  }
  public playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.1) {
    const ctx = this.getContext();
    if (!ctx) return;
    const masterVol = this.getMasterVolume();
    const effectiveVol = vol * masterVol;
    if (effectiveVol <= 0.0001) return;
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        gain.gain.setValueAtTime(effectiveVol, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        // Cleanup on end
        osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
        };
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
    } catch (e) {
        // Ignore audio errors
    }
  }
  public playQuack() {
    const ctx = this.getContext();
    if (!ctx) return;
    const masterVol = this.getMasterVolume();
    if (masterVol <= 0.0001) return;
    try {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        // Sawtooth wave for rich harmonics
        osc.type = 'sawtooth';
        // Pitch drop for the "quack" sound
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
        // Bandpass filter to shape the formant
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.linearRampToValueAtTime(1200, t + 0.1);
        filter.frequency.linearRampToValueAtTime(800, t + 0.2);
        filter.Q.value = 1;
        // Envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3 * masterVol, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        // Cleanup
        osc.onended = () => {
            osc.disconnect();
            filter.disconnect();
            gain.disconnect();
        };
        osc.start(t);
        osc.stop(t + 0.2);
    } catch (e) {
        // ignore
    }
  }
  public playMove() {
    // Very subtle low frequency wobble for movement
    this.playTone(100, 'sine', 0.1, 0, 0.05);
  }
  public playDie() {
    const ctx = this.getContext();
    if (!ctx) return;
    const masterVol = this.getMasterVolume();
    if (masterVol <= 0.0001) return;
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.2 * masterVol, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
        };
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
        // ignore
    }
  }
  public playFall() {
    const ctx = this.getContext();
    if (!ctx) return;
    const masterVol = this.getMasterVolume();
    if (masterVol <= 0.0001) return;
    try {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        // Slide whistle effect: start high, drop low
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.5);
        gain.gain.setValueAtTime(0.3 * masterVol, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
        };
        osc.start(t);
        osc.stop(t + 0.5);
    } catch (e) {
        // ignore
    }
  }
  public playSpawn() {
    // High pitched ping
    this.playTone(800, 'triangle', 0.15, 0, 0.05);
  }
  public playHazardSpawn(material: 'metal' | 'wood' | 'soft' | 'glitch' | 'energy') {
      const ctx = this.getContext();
      if (!ctx) return;
      const masterVol = this.getMasterVolume();
      if (masterVol <= 0.0001) return;
      try {
          const t = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          if (material === 'metal') {
              // Dissonant metallic clank
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(800, t);
              // Add a second oscillator for dissonance
              const osc2 = ctx.createOscillator();
              osc2.type = 'square';
              osc2.frequency.setValueAtTime(1130, t); // Tritone-ish
              const gain2 = ctx.createGain();
              gain2.gain.setValueAtTime(0.05 * masterVol, t);
              gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
              osc2.connect(gain2);
              gain2.connect(ctx.destination);
              osc2.onended = () => {
                  osc2.disconnect();
                  gain2.disconnect();
              };
              osc2.start(t);
              osc2.stop(t + 0.1);
              gain.gain.setValueAtTime(0.1 * masterVol, t);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          } else if (material === 'wood') {
              // Thock sound
              osc.type = 'sine';
              osc.frequency.setValueAtTime(150, t);
              osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
              gain.gain.setValueAtTime(0.2 * masterVol, t);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
          } else if (material === 'soft') {
              // Noise burst (Whoosh)
              this.playWhoosh();
              return; // playWhoosh handles its own graph
          } else if (material === 'glitch') {
              // Random frequency jumps
              osc.type = 'square';
              osc.frequency.setValueAtTime(200, t);
              osc.frequency.setValueAtTime(800, t + 0.03);
              osc.frequency.setValueAtTime(100, t + 0.06);
              osc.frequency.setValueAtTime(400, t + 0.09);
              gain.gain.setValueAtTime(0.05 * masterVol, t);
              gain.gain.linearRampToValueAtTime(0, t + 0.12);
          } else if (material === 'energy') {
              // Chirp
              osc.type = 'sine';
              osc.frequency.setValueAtTime(400, t);
              osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
              gain.gain.setValueAtTime(0.1 * masterVol, t);
              gain.gain.linearRampToValueAtTime(0, t + 0.15);
          } else {
              // Default
              this.playSpawn();
              return;
          }
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.onended = () => {
              osc.disconnect();
              gain.disconnect();
          };
          osc.start(t);
          osc.stop(t + 0.3);
      } catch (e) {
          // ignore
      }
  }
  public playLevelUp() {
      // Rising triad (A4, C5, E5)
      this.playTone(440.00, 'sawtooth', 0.4, 0, 0.1); // A4
      this.playTone(523.25, 'sawtooth', 0.4, 0.1, 0.1); // C5
      this.playTone(659.25, 'sawtooth', 0.8, 0.2, 0.1); // E5
  }
  public playClick() {
    // Short blip
    this.playTone(400, 'square', 0.05, 0, 0.05);
  }
  public playUnlock() {
    // Major arpeggio
    this.playTone(523.25, 'sine', 0.2, 0, 0.1); // C5
    this.playTone(659.25, 'sine', 0.2, 0.1, 0.1); // E5
    this.playTone(783.99, 'sine', 0.4, 0.2, 0.1); // G5
  }
  public playBounce() {
    const ctx = this.getContext();
    if (!ctx) return;
    const masterVol = this.getMasterVolume();
    if (masterVol <= 0.0001) return;
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        // Rubber impact sound: Start at 200Hz, drop quickly to 100Hz
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15 * masterVol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
        };
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
        // ignore
    }
  }
  public playClack() {
    const ctx = this.getContext();
    if (!ctx) return;
    const masterVol = this.getMasterVolume();
    if (masterVol <= 0.0001) return;
    try {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square'; // Hard impact
        // High pitch click
        osc.frequency.setValueAtTime(2000, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
        gain.gain.setValueAtTime(0.3 * masterVol, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
        };
        osc.start(t);
        osc.stop(t + 0.05);
    } catch (e) {
        // ignore
    }
  }
  public playHover() {
    // Very short, high frequency blip for UI hover
    this.playTone(800, 'triangle', 0.03, 0, 0.05);
  }
  public playWhoosh() {
    const ctx = this.getContext();
    if (!ctx) return;
    const masterVol = this.getMasterVolume();
    if (masterVol <= 0.0001) return;
    try {
        // Create noise buffer
        const bufferSize = ctx.sampleRate * 0.2; // 0.2 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.2);
        filter.Q.value = 1;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1 * masterVol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.onended = () => {
            noise.disconnect();
            filter.disconnect();
            gain.disconnect();
        };
        noise.start();
    } catch (e) {
        // ignore
    }
  }
  public playMilestone() {
      // Ascending major triad for milestone
      this.playTone(523.25, 'triangle', 0.15, 0, 0.1); // C5
      this.playTone(659.25, 'triangle', 0.15, 0.1, 0.1); // E5
      this.playTone(783.99, 'triangle', 0.3, 0.2, 0.1); // G5
  }
  public playNotification() {
      // Gentle two-tone chime (800Hz -> 1200Hz)
      const ctx = this.getContext();
      if (!ctx) return;
      const masterVol = this.getMasterVolume();
      if (masterVol <= 0.0001) return;
      try {
          const t = ctx.currentTime;
          // First tone
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(800, t);
          gain1.gain.setValueAtTime(0.1 * masterVol, t);
          gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.onended = () => {
              osc1.disconnect();
              gain1.disconnect();
          };
          osc1.start(t);
          osc1.stop(t + 0.3);
          // Second tone
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1200, t + 0.15);
          gain2.gain.setValueAtTime(0.1 * masterVol, t + 0.15);
          gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.onended = () => {
              osc2.disconnect();
              gain2.disconnect();
          };
          osc2.start(t + 0.15);
          osc2.stop(t + 0.5);
      } catch (e) {
          // ignore
      }
  }
  public playPop() {
    const ctx = this.getContext();
    if (!ctx) return;
    const masterVol = this.getMasterVolume();
    if (masterVol <= 0.0001) return;
    try {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        // Quick frequency drop for a "pop" sound
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
        gain.gain.setValueAtTime(0.3 * masterVol, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
        };
        osc.start(t);
        osc.stop(t + 0.1);
    } catch (e) {
        // ignore
    }
  }
  public playSplash() {
    const ctx = this.getContext();
    if (!ctx) return;
    const masterVol = this.getMasterVolume();
    if (masterVol <= 0.0001) return;
    try {
        // Create noise buffer
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15 * masterVol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.onended = () => {
            noise.disconnect();
            filter.disconnect();
            gain.disconnect();
        };
        noise.start();
    } catch (e) {
        // ignore
    }
  }
  public playExplosion() {
    const ctx = this.getContext();
    if (!ctx) return;
    const masterVol = this.getMasterVolume();
    if (masterVol <= 0.0001) return;
    try {
        // Create noise buffer
        const bufferSize = ctx.sampleRate * 0.5; // 0.5 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5 * masterVol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.onended = () => {
            noise.disconnect();
            filter.disconnect();
            gain.disconnect();
        };
        noise.start();
    } catch (e) {
        // ignore
    }
  }
  public playCountdownTick() {
    // Short, distinct tick for 3, 2, 1
    this.playTone(600, 'sine', 0.1, 0, 0.2);
  }
  public playCountdownGo() {
    // Higher pitched, emphatic GO!
    this.playTone(1000, 'square', 0.3, 0, 0.2);
    this.playTone(1500, 'sine', 0.3, 0, 0.1); // Harmony
  }
  public playWhistle() {
    const ctx = this.getContext();
    if (!ctx) return;
    const masterVol = this.getMasterVolume();
    if (masterVol <= 0.0001) return;
    try {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        // Trill effect: modulate frequency rapidly
        osc.frequency.setValueAtTime(2000, t);
        osc.frequency.setValueCurveAtTime(new Float32Array([2000, 2500, 2000, 2500, 2000, 2500, 2000, 2500]), t, 0.5);
        gain.gain.setValueAtTime(0.3 * masterVol, t);
        gain.gain.linearRampToValueAtTime(0.3 * masterVol, t + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
        };
        osc.start(t);
        osc.stop(t + 0.5);
    } catch (e) {
        // ignore
    }
  }
}
export const soundSynth = new SoundSynth();