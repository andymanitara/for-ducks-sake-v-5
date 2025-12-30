import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ACHIEVEMENTS, MAPS } from "@/game/constants";
import { PlayerProfile, Achievement, GameMap, MapStats } from "@/types/game";
import { createRNG } from "@/lib/rng";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Lightens or darkens a hex color.
 */
export function adjustColor(color: string, amount: number) {
  if (!color || !color.startsWith("#")) return color;

  const hex = color.replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hex)) return color;

  let r: number, g: number, b: number;

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

    if (isNaN(r) || isNaN(g) || isNaN(b)) return color;

    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    const rr = (r.toString(16).length < 2 ? "0" : "") + r.toString(16);
    const gg = (g.toString(16).length < 2 ? "0" : "") + g.toString(16);
    const bb = (b.toString(16).length < 2 ? "0" : "") + b.toString(16);

    return `#${rr}${gg}${bb}`;
  } catch {
    return color;
  }
}

export function formatLargeTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const totalMinutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  if (totalMinutes < 60) return remainingSeconds === 0 ? `${totalMinutes}m` : `${totalMinutes}m ${remainingSeconds}s`;

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
}

export function formatLargeTimeFull(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds} seconds`;

  const totalMinutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  if (totalMinutes < 60) return remainingSeconds === 0 ? `${totalMinutes} minutes` : `${totalMinutes} minutes ${remainingSeconds} seconds`;

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes === 0 ? `${hours} hours` : `${hours} hours ${remainingMinutes} minutes`;
}

export function getTimeUntilNextDailyReset(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(24, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

/** ---- SAFETY HELPERS (fix old persisted profiles) ---- */
function safeMapStats(profile: PlayerProfile | null | undefined): Record<string, MapStats> {
  // old profiles might not have mapStats at all
  return (profile as any)?.mapStats && typeof (profile as any).mapStats === "object" ? (profile as any).mapStats : {};
}
function safeUnlockedMapIds(profile: PlayerProfile | null | undefined): string[] {
  return Array.isArray((profile as any)?.unlockedMapIds) ? (profile as any).unlockedMapIds : [];
}
function safeUnlockedSkinIds(profile: PlayerProfile | null | undefined): string[] {
  return Array.isArray((profile as any)?.unlockedSkinIds) ? (profile as any).unlockedSkinIds : [];
}

/**
 * Calculates unlocked achievements for a profile.
 */
export function getUnlockedAchievements(profile: PlayerProfile): Achievement[] {
  if (!profile) return [];

  const mapStats = safeMapStats(profile);
  const unlockedMapIds = safeUnlockedMapIds(profile);
  const unlockedSkinIds = safeUnlockedSkinIds(profile);

  return ACHIEVEMENTS.filter((ach) => {
    if (ach.mapId) {
      const stats = (mapStats[ach.mapId] || {}) as MapStats;

      switch (ach.conditionType) {
        case "score": return (stats.bestTime || 0) >= ach.conditionValue;
        case "games": return (stats.gamesPlayed || 0) >= ach.conditionValue;
        case "total_time": return (stats.totalTimeSurvived || 0) >= ach.conditionValue;
        case "map_explosions": return (stats.totalExplosions || 0) >= ach.conditionValue;
        case "run_near_misses": return (stats.mostNearMisses || 0) >= ach.conditionValue;
        case "run_shower_pushes": return (stats.mostShowerPushes || 0) >= ach.conditionValue;
        case "run_wrench_dodges": return (stats.mostWrenchDodges || 0) >= ach.conditionValue;
        case "run_balls_pocketed": return (stats.mostBallsPocketed || 0) >= ach.conditionValue;
        default: return false;
      }
    }

    // Global checks
    switch (ach.conditionType) {
      case "games": return (profile.gamesPlayed || 0) >= ach.conditionValue;
      case "score": return (profile.bestTime || 0) >= ach.conditionValue;
      case "total_time": return (profile.totalTimeSurvived || 0) >= ach.conditionValue;
      case "total_near_misses": return ((profile as any).totalNearMisses || 0) >= ach.conditionValue;
      case "unlocked_maps": return unlockedMapIds.length >= ach.conditionValue;
      case "unlocked_skins": return unlockedSkinIds.length >= ach.conditionValue;
      case "coins": return ((profile as any).coins || 0) >= ach.conditionValue;

      case "special": {
        const standardMaps = MAPS.filter((m) => !m.isSeasonal);
        return standardMaps.every((m) => unlockedMapIds.includes(m.id));
      }

      case "has_skin":
        return !!ach.targetId && unlockedSkinIds.includes(ach.targetId);

      case "run_near_misses":
        return Object.values(mapStats).some((s) => (s.mostNearMisses || 0) >= ach.conditionValue);

      default:
        return false;
    }
  });
}

export function getAchievementProgress(
  profile: PlayerProfile,
  ach: Achievement
): { current: number; target: number; percent: number; label: string } {
  const mapStats = safeMapStats(profile);

  let current = 0;
  const target = ach.conditionValue;
  let label = "";

  if (ach.mapId) {
    const stats = (mapStats[ach.mapId] || {}) as MapStats;

    switch (ach.conditionType) {
      case "score":
        current = stats.bestTime || 0;
        label = `${(current / 1000).toFixed(1)}s / ${(target / 1000).toFixed(0)}s`;
        break;
      case "games":
        current = stats.gamesPlayed || 0;
        label = `${current} / ${target}`;
        break;
      case "total_time":
        current = stats.totalTimeSurvived || 0;
        label = `${(current / 1000).toFixed(0)}s / ${(target / 1000).toFixed(0)}s`;
        break;
      case "map_explosions":
        current = stats.totalExplosions || 0;
        label = `${current} / ${target}`;
        break;
      case "run_near_misses":
        current = stats.mostNearMisses || 0;
        label = `${current} / ${target}`;
        break;
      case "run_shower_pushes":
        current = stats.mostShowerPushes || 0;
        label = `${current} / ${target}`;
        break;
      case "run_wrench_dodges":
        current = stats.mostWrenchDodges || 0;
        label = `${current} / ${target}`;
        break;
      case "run_balls_pocketed":
        current = stats.mostBallsPocketed || 0;
        label = `${current} / ${target}`;
        break;
    }
  } else {
    switch (ach.conditionType) {
      case "games":
        current = profile.gamesPlayed || 0;
        label = `${current} / ${target}`;
        break;
      case "score":
        current = profile.bestTime || 0;
        label = `${(current / 1000).toFixed(1)}s / ${(target / 1000).toFixed(0)}s`;
        break;
      case "total_time":
        current = profile.totalTimeSurvived || 0;
        label = `${(current / 1000).toFixed(0)}s / ${(target / 1000).toFixed(0)}s`;
        break;
      case "total_near_misses":
        current = ((profile as any).totalNearMisses || 0);
        label = `${current} / ${target}`;
        break;
      case "unlocked_maps":
        current = safeUnlockedMapIds(profile).length;
        label = `${current} / ${target}`;
        break;
      case "unlocked_skins":
        current = safeUnlockedSkinIds(profile).length;
        label = `${current} / ${target}`;
        break;
      case "coins":
        current = ((profile as any).coins || 0);
        label = `${current} / ${target}`;
        break;
      case "run_near_misses":
        current = Object.values(mapStats).reduce((max, s) => Math.max(max, s.mostNearMisses || 0), 0);
        label = `${current} / ${target}`;
        break;

      case "special": {
        const standardMaps = MAPS.filter((m) => !m.isSeasonal);
        const unlockedStandard = standardMaps.filter((m) => safeUnlockedMapIds(profile).includes(m.id)).length;
        current = unlockedStandard;

        const realTarget = target === 0 ? standardMaps.length : target;
        label = `${current} / ${realTarget}`;

        return { current, target: realTarget, percent: Math.min(100, (current / realTarget) * 100), label };
      }

      case "has_skin":
        current = (ach.targetId && safeUnlockedSkinIds(profile).includes(ach.targetId)) ? 1 : 0;
        label = current ? "1/1" : "0/1";
        break;
    }
  }

  const percent = target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;
  if (!label) label = `${current} / ${target}`;
  return { current, target, percent, label };
}

export function getDailyMap(dateString: string): GameMap {
  const rng = createRNG(dateString);
  const randomIndex = Math.floor(rng() * MAPS.length);
  return MAPS[randomIndex];
}
