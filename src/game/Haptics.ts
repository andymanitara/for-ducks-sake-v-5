import { useGameStore } from '@/lib/store';
class Haptics {
  /**
   * Trigger a vibration pattern if enabled and supported.
   * @param pattern Vibration pattern (ms or array of ms)
   */
  public vibrate(pattern: number | number[]) {
    const isEnabled = useGameStore.getState().isHapticsEnabled;
    // Check if navigator.vibrate exists (it might not on some desktops/iOS webviews)
    if (!isEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore errors (some browsers block vibration without user interaction context)
    }
  }
  /**
   * Light feedback for UI interactions (buttons, toggles)
   */
  public soft() {
    this.vibrate(10);
  }
  /**
   * Medium feedback for gameplay events (pickup, minor warning)
   */
  public medium() {
    this.vibrate(20);
  }
  /**
   * Heavy feedback for collisions or game over
   */
  public impact() {
    this.vibrate([50, 50, 50]);
  }
  /**
   * Distinct pattern for hazard warnings (e.g. laser lock-on)
   */
  public warning() {
    this.vibrate([20, 30, 20]);
  }
  /**
   * Success pattern for completing challenges or unlocking items
   */
  public success() {
    this.vibrate([30, 50, 30]);
  }
}
export const haptics = new Haptics();