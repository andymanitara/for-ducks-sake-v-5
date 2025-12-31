import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ACHIEVEMENTS, MAPS } from "@/game/constants"
import { PlayerProfile, Achievement, GameMap, MapStats } from "@/types/game"
import { createRNG } from "@/lib/rng"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * Lightens or darkens a hex color.
 * @param color Hex color string (e.g. "#FF0000" or "FF0000")
 * @param amount Amount to adjust (-255 to 255). Positive lightens, negative darkens.
 * @returns Adjusted hex color, or original color if input is not a valid hex.
 */
export function adjustColor(color: string, amount: number) {
    // Guard clause for non-hex colors (e.g. rgba, named colors)
    if (!color || !color.startsWith('#')) {
        return color;
    }
    const hex = color.replace(/^#/, '');
    // Validate hex format (3 or 6 digits)
    // This prevents the crash where invalid hex strings (like '#rgba...') caused NaN generation
    if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hex)) {
        return color;
    }
    // Parse and adjust
    let r, g, b;
    try {
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        // Safety check for NaN
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return color;
        }
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));
        const rr = (r.toString(16).length < 2 ? '0' : '') + r.toString(16);
        const gg = (g.toString(16).length < 2 ? '0' : '') + g.toString(16);
        const bb = (b.toString(16).length < 2 ? '0' : '') + b.toString(16);
        return `#${rr}${gg}${bb}`;
    } catch (e) {
        // Fallback if anything goes wrong during parsing/math
        return color;
    }
}
/**
 * Formats milliseconds into a readable string for large durations.
 * Cleaner output: "5m" instead of "5m 0s", "1h" instead of "1h 0m".
 * @param ms Time in milliseconds
 * @returns Formatted string (e.g. "45s", "5m", "5m 30s", "1h", "1h 15m")
 */
export function formatLargeTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const totalMinutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  if (totalMinutes < 60) {
    if (remainingSeconds === 0) {
      return `${totalMinutes}m`;
    }
    return `${totalMinutes}m ${remainingSeconds}s`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}
/**
 * Formats milliseconds into a verbose readable string.
 * Output: "5 minutes", "1 hour 30 minutes".
 * @param ms Time in milliseconds
 * @returns Formatted string
 */
export function formatLargeTimeFull(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds} seconds`;
  }
  const totalMinutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  if (totalMinutes < 60) {
    if (remainingSeconds === 0) {
      return `${totalMinutes} minutes`;
    }
    return `${totalMinutes} minutes ${remainingSeconds} seconds`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hours`;
  }
  return `${hours} hours ${remainingMinutes} minutes`;
}
/**
 * Calculates the time remaining until the next UTC midnight.
 * @returns Formatted string "Xh Ym"
 */
export function getTimeUntilNextDailyReset(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(24, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}
/**
 * Calculates the list of unlocked achievements for a given player profile.
 * @param profile The player profile to check against.
 * @returns Array of unlocked Achievement objects.
 */
export function getUnlockedAchievements(profile: PlayerProfile): Achievement[] {
  if (!profile) return [];
  return ACHIEVEMENTS.filter(ach => {
    // If achievement is map-specific, check map stats
    if (ach.mapId) {
        const stats = (profile.mapStats[ach.mapId] || {}) as MapStats;
        switch (ach.conditionType) {
            case 'score': return (stats.bestTime || 0) >= ach.conditionValue;
            case 'games': return (stats.gamesPlayed || 0) >= ach.conditionValue;
            case 'total_time': return (stats.totalTimeSurvived || 0) >= ach.conditionValue;
            case 'map_explosions': return (stats.totalExplosions || 0) >= ach.conditionValue;
            case 'run_near_misses': return (stats.mostNearMisses || 0) >= ach.conditionValue;
            case 'run_shower_pushes': return (stats.mostShowerPushes || 0) >= ach.conditionValue;
            case 'run_wrench_dodges': return (stats.mostWrenchDodges || 0) >= ach.conditionValue;
            case 'run_balls_pocketed': return (stats.mostBallsPocketed || 0) >= ach.conditionValue;
            default: return false; // Other types not supported for map-specific yet
        }
    }
    // Global checks
    switch (ach.conditionType) {
      case 'games':
        return profile.gamesPlayed >= ach.conditionValue;
      case 'score':
        return profile.bestTime >= ach.conditionValue;
      case 'total_time':
        return profile.totalTimeSurvived >= ach.conditionValue;
      case 'total_near_misses':
        return (profile.totalNearMisses || 0) >= ach.conditionValue;
      case 'unlocked_maps':
        return (profile.unlockedMapIds?.length || 0) >= ach.conditionValue;
      case 'unlocked_skins':
        return (profile.unlockedSkinIds?.length || 0) >= ach.conditionValue;
      case 'coins':
        return (profile.coins || 0) >= ach.conditionValue;
      case 'special': {
        // Special case for "Unlock all standard maps"
        const standardMaps = MAPS.filter(m => !m.isSeasonal);
        return standardMaps.every(m => (profile.unlockedMapIds || []).includes(m.id));
      }
      case 'has_skin':
        return !!ach.targetId && (profile.unlockedSkinIds || []).includes(ach.targetId);
      case 'run_near_misses':
        // Check if any map has a record of near misses >= condition
        return Object.values(profile.mapStats).some(s => (s.mostNearMisses || 0) >= ach.conditionValue);
      default:
        return false;
    }
  });
}
/**
 * Calculates the progress of a specific achievement for a player.
 * @param profile The player profile.
 * @param ach The achievement to check.
 * @returns Object containing current value, target value, percentage, and formatted label.
 */
export function getAchievementProgress(profile: PlayerProfile, ach: Achievement): { current: number, target: number, percent: number, label: string } {
  let current = 0;
  const target = ach.conditionValue;
  let label = '';
  if (ach.mapId) {
    const stats = (profile.mapStats[ach.mapId] || {}) as MapStats;
    switch (ach.conditionType) {
      case 'score':
        current = stats.bestTime || 0;
        label = `${(current / 1000).toFixed(1)}s / ${(target / 1000).toFixed(0)}s`;
        break;
      case 'games':
        current = stats.gamesPlayed || 0;
        label = `${current} / ${target}`;
        break;
      case 'total_time':
        current = stats.totalTimeSurvived || 0;
        label = `${(current / 1000).toFixed(0)}s / ${(target / 1000).toFixed(0)}s`;
        break;
      case 'map_explosions':
        current = stats.totalExplosions || 0;
        label = `${current} / ${target}`;
        break;
      case 'run_near_misses':
        current = stats.mostNearMisses || 0;
        label = `${current} / ${target}`;
        break;
      case 'run_shower_pushes':
        current = stats.mostShowerPushes || 0;
        label = `${current} / ${target}`;
        break;
      case 'run_wrench_dodges':
        current = stats.mostWrenchDodges || 0;
        label = `${current} / ${target}`;
        break;
      case 'run_balls_pocketed':
        current = stats.mostBallsPocketed || 0;
        label = `${current} / ${target}`;
        break;
    }
  } else {
    switch (ach.conditionType) {
      case 'games':
        current = profile.gamesPlayed;
        label = `${current} / ${target}`;
        break;
      case 'score':
        current = profile.bestTime;
        label = `${(current / 1000).toFixed(1)}s / ${(target / 1000).toFixed(0)}s`;
        break;
      case 'total_time':
        current = profile.totalTimeSurvived;
        label = `${(current / 1000).toFixed(0)}s / ${(target / 1000).toFixed(0)}s`;
        break;
      case 'total_near_misses':
        current = profile.totalNearMisses || 0;
        label = `${current} / ${target}`;
        break;
      case 'unlocked_maps':
        current = profile.unlockedMapIds?.length || 0;
        label = `${current} / ${target}`;
        break;
      case 'unlocked_skins':
        current = profile.unlockedSkinIds?.length || 0;
        label = `${current} / ${target}`;
        break;
      case 'coins':
        current = profile.coins || 0;
        label = `${current} / ${target}`;
        break;
      case 'run_near_misses':
        current = Object.values(profile.mapStats).reduce((max, s) => Math.max(max, s.mostNearMisses || 0), 0);
        label = `${current} / ${target}`;
        break;
      case 'special': {
         const standardMaps = MAPS.filter(m => !m.isSeasonal);
         const unlockedStandard = standardMaps.filter(m => (profile.unlockedMapIds || []).includes(m.id)).length;
         current = unlockedStandard;
         const realTarget = target === 0 ? standardMaps.length : target;
         label = `${current} / ${realTarget}`;
         return { current, target: realTarget, percent: Math.min(100, (current / realTarget) * 100), label };
      }
      case 'has_skin':
         current = (ach.targetId && (profile.unlockedSkinIds || []).includes(ach.targetId)) ? 1 : 0;
         label = current ? "1/1" : "0/1";
         break;
    }
  }
  const percent = target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;
  if (!label) label = `${current} / ${target}`;
  return { current, target, percent, label };
}
/**
 * Deterministically selects a map for the daily challenge based on the date.
 * @param dateString ISO date string (YYYY-MM-DD)
 * @returns The selected GameMap
 */
export function getDailyMap(dateString: string): GameMap {
  const rng = createRNG(dateString);
  // Use the RNG to pick a random map index from ALL available maps
  const randomIndex = Math.floor(rng() * MAPS.length);
  return MAPS[randomIndex];
}