/**
 * A lightweight, browser-safe Pseudo-Random Number Generator (Mulberry32).
 * Replaces 'seedrandom' to avoid 'crypto' module issues in browser environments.
 */
export function createRNG(seed: string): () => number {
  // MurmurHash3-like mixing for initial seed state
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  // Initialize state
  let state = h >>> 0;
  // Return the generator function (Mulberry32)
  return function() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}