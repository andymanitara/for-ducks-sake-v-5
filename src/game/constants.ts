import { Skin, Achievement, GameMap, DifficultyConfig, BiomeType } from '../types/game';
export const UNLOCK_THRESHOLDS: Record<string, { type: 'score' | 'games' | 'total_time', value: number, description: string }> = {
  'pinky': { type: 'games', value: 5, description: 'Play 5 games' },
  'ninja': { type: 'score', value: 30000, description: 'Survive 30 seconds in one run' },
  'cool': { type: 'total_time', value: 300000, description: 'Survive 5 minutes total' },
  'quackers': { type: 'score', value: 100000, description: 'Survive 100 seconds in one run' },
};
// Helper to generate standard map achievements
const createStandardMapAchievements = (mapId: BiomeType, mapName: string, tiers: ('bronze' | 'silver' | 'gold')[]): Achievement[] => {
  const achievements: Achievement[] = [];
  if (tiers.includes('bronze')) {
    achievements.push({
      id: `ach_${mapId}_bronze`,
      title: `${mapName} Bronze`,
      description: `Survive 30s in ${mapName}`,
      icon: 'Medal',
      conditionType: 'score',
      conditionValue: 30000,
      mapId: mapId,
      rewardCoins: 100
    });
  }
  if (tiers.includes('silver')) {
    achievements.push({
      id: `ach_${mapId}_silver`,
      title: `${mapName} Silver`,
      description: `Survive 60s in ${mapName}`,
      icon: 'Medal',
      conditionType: 'score',
      conditionValue: 60000,
      mapId: mapId,
      rewardCoins: 250
    });
  }
  if (tiers.includes('gold')) {
    achievements.push({
      id: `ach_${mapId}_gold`,
      title: `${mapName} Gold`,
      description: `Survive 100s in ${mapName}`,
      icon: 'Trophy',
      conditionType: 'score',
      conditionValue: 100000,
      mapId: mapId,
      rewardCoins: 500
    });
  }
  // Add Adrenaline Junkie for every map
  achievements.push({
    id: `ach_${mapId}_adrenaline`,
    title: `${mapName} Adrenaline`,
    description: `Survive 20 Close Calls in one run on ${mapName}`,
    icon: 'Zap',
    conditionType: 'run_near_misses',
    conditionValue: 20,
    mapId: mapId,
    rewardCoins: 300
  });
  return achievements;
};
export const ACHIEVEMENTS: Achievement[] = [
  // General Achievements
  { id: 'ach_first_steps', title: 'First Steps', description: 'Play your first game', icon: 'Gamepad2', conditionType: 'games', conditionValue: 1, rewardCoins: 50 },
  { id: 'ach_pinky', title: 'Persistent Duck', description: 'Play 5 games', icon: 'Gamepad2', rewardSkinId: 'pinky', conditionType: 'games', conditionValue: 5 },
  { id: 'ach_ninja', title: 'Shadow Walker', description: 'Survive 30 seconds in one run', icon: 'Timer', rewardSkinId: 'ninja', conditionType: 'score', conditionValue: 30000 },
  { id: 'ach_quackers', title: 'Quackers', description: 'Survive 100 seconds in one run', icon: 'Timer', rewardSkinId: 'quackers', conditionType: 'score', conditionValue: 100000 },
  { id: 'ach_cool', title: 'Marathon Runner', description: 'Survive 5 minutes total', icon: 'Activity', rewardSkinId: 'cool', conditionType: 'total_time', conditionValue: 300000 },
  { id: 'ach_living_edge', title: 'Living on the Edge', description: 'Survive 50 close calls total', icon: 'Zap', conditionType: 'total_near_misses', conditionValue: 50, rewardCoins: 200 },
  { id: 'ach_globetrotter', title: 'Globetrotter', description: 'Unlock 3 different maps', icon: 'Map', conditionType: 'unlocked_maps', conditionValue: 3, rewardCoins: 300 },
  { id: 'ach_fashionista', title: 'Fashionista', description: 'Unlock 5 different skins', icon: 'Shirt', conditionType: 'unlocked_skins', conditionValue: 5, rewardCoins: 300 },
  { id: 'ach_hoarder', title: 'Hoarder', description: 'Accumulate 1000 coins', icon: 'Coins', conditionType: 'coins', conditionValue: 1000, rewardCoins: 100 },
  { id: 'ach_mother_ducker', title: 'The Boss', description: 'Unlock all standard maps', icon: 'Crown', rewardSkinId: 'mother_ducker', conditionType: 'special', conditionValue: 0 },
  { id: 'ach_lafleur', title: "The 5 D's", description: "Unlock the Gym Map", icon: 'Activity', rewardSkinId: 'lafleur', conditionType: 'score', conditionValue: 30000 },
  { id: 'ach_glitch', title: 'The Architect', description: 'Unlock the secret Glitch Duck', icon: 'Terminal', conditionType: 'has_skin', conditionValue: 1, targetId: 'glitch_duck' },
  // Map Specific Achievements
  // Pond: Keep all
  ...createStandardMapAchievements('pond', 'Lily Pond', ['bronze', 'silver', 'gold']),
  // Glacier: Keep all
  ...createStandardMapAchievements('glacier', 'Snowy Glacier', ['bronze', 'silver', 'gold']),
  // Bathtub: Remove 100s (Gold)
  ...createStandardMapAchievements('bathtub', 'Bathtub', ['bronze', 'silver']),
  // City: Remove 60s (Silver) and 100s (Gold)
  ...createStandardMapAchievements('city', 'City Park', ['bronze']),
  // Gym: Remove 60s (Silver) and 100s (Gold)
  ...createStandardMapAchievements('gym', 'Gym', ['bronze']),
  // Billiards: Remove 60s (Silver) and 100s (Gold)
  ...createStandardMapAchievements('billiards', 'Billiards', ['bronze']),
  // Glitch: Remove 60s (Silver) and 100s (Gold)
  ...createStandardMapAchievements('glitch', 'Glitch', ['bronze']),
  // Christmas: Keep all (Seasonal)
  ...createStandardMapAchievements('christmas', 'Wonderland', ['bronze', 'silver', 'gold']),
  // Advanced Map-Specific Challenges
  { id: 'ach_demolition_duck', title: 'Demolition Duck', description: 'Trigger 50 Drone Explosions in City Park', icon: 'Zap', conditionType: 'map_explosions', conditionValue: 50, mapId: 'city', rewardCoins: 300 },
  { id: 'ach_slippery_wet', title: 'Slippery When Wet', description: 'Get pushed by jets 10 times in a single run', icon: 'Waves', conditionType: 'run_shower_pushes', conditionValue: 10, mapId: 'bathtub', rewardCoins: 400 },
  { id: 'ach_dodgeball_pro', title: 'Dodgeball Pro', description: 'Dodge 10 wrenches in a single run', icon: 'Activity', conditionType: 'run_wrench_dodges', conditionValue: 10, mapId: 'gym', rewardCoins: 400 },
  { id: 'ach_corner_pocket', title: 'Corner Pocket', description: 'Watch 15 balls get pocketed in a single run', icon: 'CircleDot', conditionType: 'run_balls_pocketed', conditionValue: 15, mapId: 'billiards', rewardCoins: 400 },
];
// Maps sorted by progression sequence
// totalSurvivalTimeRequired is in milliseconds
export const MAPS: GameMap[] = [
  { id: 'pond', name: 'Lily Pond', description: 'A peaceful pond with jumping frogs and floating logs.', difficulty: 'Easy', colorTheme: '#87CEEB', thumbnailColor: '#87CEEB', totalSurvivalTimeRequired: 0, progressMultiplier: 1.0 },
  { id: 'glacier', name: 'Snowy Glacier', description: 'Slippery ice, falling icicles, and snowballs.', difficulty: 'Medium', colorTheme: '#E0F7FA', thumbnailColor: '#E0F7FA', totalSurvivalTimeRequired: 120000, progressMultiplier: 1.2, bestTimeRequired: 40000 }, // 2 mins total OR 40s in Pond
  { id: 'bathtub', name: 'Bathtub Battle', description: 'Slippery tiles, soap bubbles, and shampoo bottles!', difficulty: 'Medium', colorTheme: '#E0F2F1', thumbnailColor: '#B2DFDB', totalSurvivalTimeRequired: 300000, progressMultiplier: 1.4, bestTimeRequired: 40000 }, // 5 mins total OR 40s in Glacier
  { id: 'city', name: 'City Park', description: 'Busy park with drones, frisbees, and traffic.', difficulty: 'Hard', colorTheme: '#F0F0F0', thumbnailColor: '#D3D3D3', totalSurvivalTimeRequired: 600000, progressMultiplier: 1.6, bestTimeRequired: 40000 }, // 10 mins total OR 40s in Bathtub
  { id: 'gym', name: "Average Duck's Gym", description: 'Dodge, duck, dip, dive and dodge! Watch out for wrenches.', difficulty: 'Hard', colorTheme: '#DEB887', thumbnailColor: '#D2B48C', totalSurvivalTimeRequired: 1800000, progressMultiplier: 1.8, bestTimeRequired: 30000 }, // 30 mins total OR 30s in City
  { id: 'billiards', name: 'Bill-iards Table', description: 'A green felt arena with bouncing pool balls.', difficulty: 'Hard', colorTheme: '#2E7D32', thumbnailColor: '#388E3C', totalSurvivalTimeRequired: 3600000, progressMultiplier: 2.0, bestTimeRequired: 35000 }, // 60 mins total OR 35s in Gym
  { id: 'glitch', name: 'Digital Glitch', description: 'A corrupted zone with erratic pixel hazards.', difficulty: 'Expert', colorTheme: '#1a1a2e', thumbnailColor: '#2a0a40', totalSurvivalTimeRequired: 7200000, progressMultiplier: 2.5, bestTimeRequired: 25000 }, // 120 mins total OR 25s in Billiards
  { id: 'christmas', name: 'Winter Wonderland', description: 'Festive holiday cheer with gifts and ornaments!', difficulty: 'Medium', colorTheme: '#F0F8FF', thumbnailColor: '#E3F2FD', isSeasonal: true, seasonalDeadline: 'Ends in 14 days', totalSurvivalTimeRequired: 0, progressMultiplier: 1.2 },
];
export const SKINS: Skin[] = [
  { id: 'default', name: 'Classic', color: '#FFD700', rarity: 'common', accessory: 'none', description: 'Just a regular duck.', trailType: 'standard' },
  { id: 'pinky', name: 'Pinky', color: '#FF69B4', rarity: 'common', accessory: 'none', description: 'Unlock: Play 5 games.', trailType: 'standard' },
  { id: 'ninja', name: 'Ninja', color: '#333333', rarity: 'rare', accessory: 'headband', description: 'Unlock: Survive 30s in one run.', trailType: 'smoke' },
  { id: 'gentleman', name: 'Posh Quack', color: '#FFD700', rarity: 'rare', accessory: 'tophat', description: 'Purchase in Shop', cost: 5000, trailType: 'sparkle' },
  { id: 'cool', name: 'Cool Duck', color: '#FFD700', rarity: 'rare', accessory: 'sunglasses', description: 'Unlock: Survive 5 mins total.', trailType: 'snow' },
  { id: 'lafleur', name: 'Duck La Fleur', color: '#FFD700', rarity: 'epic', accessory: 'headband_simple', description: 'Unlock: Unlock Gym Map.', trailType: 'lafleur_trail' },
  { id: 'astro', name: 'Astro', color: '#E0E0E0', rarity: 'epic', accessory: 'helmet', description: 'Purchase in Shop', cost: 10000, trailType: 'smoke' },
  { id: 'sir_quacks_alot', name: 'Sir Quacks A Lot', color: '#FFD700', rarity: 'epic', accessory: 'knight', description: 'Purchase in Shop', cost: 10000, trailType: 'dust' },
  { id: 'mother_ducker', name: 'Mother Ducker', color: '#5D4037', rarity: 'legendary', accessory: 'cap_cigar', description: 'Unlock: Unlock all standard maps.', trailType: 'smoke' },
  { id: 'quackers', name: 'Quackers', color: '#40E0D0', rarity: 'rare', accessory: 'vest_crazy', description: 'Unlock: Survive 100s in one run.', trailType: 'bubble' },
  { id: 'cyber', name: 'Cyber Duck', color: '#00FFFF', rarity: 'legendary', accessory: 'visor', description: 'Purchase in Shop', cost: 15000, trailType: 'binary' },
  { id: 'magma', name: 'Magma Duck', color: '#FF4500', rarity: 'legendary', accessory: 'flames', description: 'Purchase in Shop', cost: 15000, trailType: 'fire' },
  { id: 'glitch_duck', name: 'Glitch Duck', color: '#000000', rarity: 'legendary', accessory: 'none', description: 'Unlock: ???', trailType: 'binary' },
];
export const BIOME_DIFFICULTY: Record<string, DifficultyConfig> = {
  'pond': {
    spawnRateInitial: 2000,
    spawnRateDecay: 25,
    hazardSpeedMultiplier: 0.5,
    hazardSpawnCap: 800,
    patternDelayMultiplier: 2.5,
  },
  'glacier': {
    spawnRateInitial: 1400,
    spawnRateDecay: 60,
    hazardSpeedMultiplier: 0.75,
    hazardSpawnCap: 500,
    patternDelayMultiplier: 1.5,
  },
  'bathtub': {
    spawnRateInitial: 1300,
    spawnRateDecay: 65,
    hazardSpeedMultiplier: 0.7,
    hazardSpawnCap: 450,
    patternDelayMultiplier: 1.6,
  },
  'city': {
    spawnRateInitial: 1300,
    spawnRateDecay: 70,
    hazardSpeedMultiplier: 0.8,
    hazardSpawnCap: 450,
    patternDelayMultiplier: 1.3,
  },
  'gym': {
    spawnRateInitial: 1800, // Significantly slower start (was 1400)
    spawnRateDecay: 30,     // Much slower ramp up (was 50)
    hazardSpeedMultiplier: 0.65, // Slower dodgeballs (was 0.8)
    hazardSpawnCap: 500,    // Fewer max hazards (was 450 - wait, cap is min interval, so higher = fewer)
    patternDelayMultiplier: 1.0, // More delay between patterns (was 0.9)
  },
  'billiards': {
    spawnRateInitial: 1400, // Slower start (was 1200)
    spawnRateDecay: 60,     // Slower ramp up (was 85)
    hazardSpeedMultiplier: 0.85, // Slower hazards (was 0.95)
    hazardSpawnCap: 380,
    patternDelayMultiplier: 1.1,
  },
  'glitch': {
    spawnRateInitial: 900,
    spawnRateDecay: 100,
    hazardSpeedMultiplier: 1.1,
    hazardSpawnCap: 300,
    patternDelayMultiplier: 0.5,
  },
  'christmas': {
    spawnRateInitial: 1450,
    spawnRateDecay: 60,
    hazardSpeedMultiplier: 0.7,
    hazardSpawnCap: 500,
    patternDelayMultiplier: 1.5,
  },
  'default': {
    spawnRateInitial: 1000,
    spawnRateDecay: 100,
    hazardSpeedMultiplier: 1.0,
    hazardSpawnCap: 200,
    patternDelayMultiplier: 1.0,
  }
};
export const COACH_BARRAGE = {
  INTERVAL_INITIAL: 15000, // 15s
  INTERVAL_MIN: 10000, // 10s
  DURATION_INITIAL: 2000, // 2s (Fixed)
  DURATION_MAX: 2000, // 2s (Fixed)
  SPAWN_RATE: 200, // ms between throws
  WARNING_TIME: 1500, // 1.5s telegraph
};
export const GAME_CONSTANTS = {
  CANVAS_WIDTH: 720,
  CANVAS_HEIGHT: 1280,
  SAFE_AREA_BOTTOM: 0,
  MOBILE_BOTTOM_BUFFER: 24,
  DUCK_SPEED: 400,
  DUCK_RADIUS: 24,
  DUCK_DAMPING: 0.15,
  DUCK_WOBBLE_SPEED: 15,
  HAZARD_MIN_SPEED: 200,
  HAZARD_MAX_SPEED: 500,
  HAZARD_SPAWN_RATE_INITIAL: 1000,
  HAZARD_RADIUS_MIN: 20,
  HAZARD_RADIUS_MAX: 40,
  HAZARD_LOG_WIDTH: 120,
  HAZARD_LOG_HEIGHT: 40,
  HAZARD_FROG_RADIUS: 25,
  HAZARD_ICICLE_WIDTH: 30,
  HAZARD_ICICLE_HEIGHT: 80,
  HAZARD_SNOWBALL_RADIUS: 30,
  HAZARD_DRONE_RADIUS: 25,
  HAZARD_FRISBEE_WIDTH: 60,
  HAZARD_FRISBEE_HEIGHT: 20,
  HAZARD_GLITCH_SQUARE_SIZE: 50,
  HAZARD_PIXEL_ORB_RADIUS: 25,
  HAZARD_GIFT_WIDTH: 50,
  HAZARD_GIFT_HEIGHT: 50,
  HAZARD_ORNAMENT_RADIUS: 28,
  HAZARD_CANDY_CANE_WIDTH: 20,
  HAZARD_CANDY_CANE_HEIGHT: 80,
  HAZARD_DODGEBALL_RADIUS: 25,
  HAZARD_WRENCH_WIDTH: 60,
  HAZARD_WRENCH_HEIGHT: 20,
  HAZARD_BUBBLE_RADIUS: 35,
  HAZARD_SHAMPOO_WIDTH: 40,
  HAZARD_SHAMPOO_HEIGHT: 80,
  HAZARD_SHOWER_JET_WIDTH: 30,
  HAZARD_SHOWER_JET_HEIGHT: 300,
  HAZARD_POOL_BALL_RADIUS: 26,
  BILLIARDS_POCKET_RADIUS: 38,
  DRONE_EXPLOSION_RADIUS: 90,
  DRONE_EXPLOSION_KILL_RADIUS: 75,
  EXPLOSION_DURATION: 0.8,
  NEAR_MISS_BUFFER: 35,
  INPUT: {
    STATIC_ANCHOR_X: 0.18,
    STATIC_ANCHOR_Y: 0.82,
    JOYSTICK_ZONE_RADIUS: 60,
  },
  AI: {
    FROG_IDLE_TIME: 1.6,
    FROG_CHARGE_TIME: 0.8,
    FROG_JUMP_SPEED: 480,
    DRONE_TURN_SPEED: 2.0,
    LASER_WARNING_TIME: 1.5,
    LASER_ACTIVE_TIME: 0.3,
  },
  COLORS: {
    DUCK: '#FFD700',
    DUCK_BEAK: '#FF8C00',
    DUCK_OUTLINE: '#000000',
    BIOME_POND: '#87CEEB',
    BIOME_GLACIER: '#E0F7FA',
    BIOME_CITY: '#F0F0F0',
    BIOME_GLITCH: '#1a1a2e',
    BIOME_CHRISTMAS: '#F0F8FF',
    BIOME_GYM_FLOOR: '#DEB887',
    BIOME_GYM_LINES: '#FFFFFF',
    BIOME_BATHTUB_TILE_LIGHT: '#E0F2F1',
    BIOME_BATHTUB_TILE_DARK: '#B2DFDB',
    BIOME_BATHTUB_WATER: '#E0F7FA',
    BIOME_BATHTUB_WALL: '#FAFAFA',
    BIOME_BATHTUB_FOAM: 'rgba(255, 255, 255, 0.5)',
    BIOME_BILLIARDS_FELT: '#2E7D32',
    BIOME_BILLIARDS_WOOD: '#5D4037',
    LILY_PAD: '#90EE90',
    LILY_PAD_DARK: '#228B22',
    ICE_CRACK: '#B2EBF2',
    ROAD_MARKING: '#FFFFFF',
    ROAD_GRAY: '#D3D3D3',
    GLITCH_GRID: '#2a0a40',
    CHRISTMAS_SNOW: '#FFFFFF',
    HAZARD_ROCK: '#808080', // Updated to Grey
    HAZARD_ICICLE: '#00BFFF',
    HAZARD_SNOWBALL: '#FFFFFF',
    HAZARD_DRONE: '#333333',
    HAZARD_DRONE_LIGHT: '#FF0000',
    HAZARD_FRISBEE: '#FF4500',
    HAZARD_LOG: '#8B4513',
    HAZARD_FROG: '#32CD32',
    HAZARD_GLITCH_SQUARE: '#00FF00',
    HAZARD_PIXEL_ORB: '#FF00FF',
    HAZARD_LASER_WARNING: 'rgba(255, 0, 0, 0.2)',
    HAZARD_LASER_ACTIVE: '#FF0000',
    HAZARD_GIFT: '#F44336',
    HAZARD_ORNAMENT: '#FFD700',
    HAZARD_CANDY_CANE: '#FFCDD2',
    HAZARD_DODGEBALL: '#FF4444',
    HAZARD_DODGEBALL_TEXTURE: '#B71C1C',
    HAZARD_WRENCH: '#C0C0C0',
    HAZARD_BUBBLE: 'rgba(255, 255, 255, 0.3)',
    HAZARD_BUBBLE_SHINE: 'rgba(255, 255, 255, 0.8)',
    HAZARD_SHAMPOO_BOTTLE: '#E91E63',
    HAZARD_SHOWER_JET: 'rgba(135, 206, 235, 0.6)',
    HAZARD_POOL_BALL_WHITE: '#F5F5F5',
    HAZARD_POOL_BALL_RED: '#D32F2F',
    HAZARD_POOL_BALL_YELLOW: '#FBC02D',
    JOYSTICK_BASE: 'rgba(0, 0, 0, 0.1)',
    JOYSTICK_KNOB: 'rgba(0, 0, 0, 0.3)',
  },
  LINE_WIDTH: 4,
  VISUALS: {
    DUCK_GRADIENT_LIGHT: '#FFF7CC',
    DUCK_GRADIENT_DARK: '#E6C200',
    SHADOW_COLOR: 'rgba(0, 0, 0, 0.2)',
    HIGHLIGHT_COLOR: 'rgba(255, 255, 255, 0.6)',
    PANIC_DISTANCE: 150,
    OUTLINE_WIDTH: 4,
    RENDER_BUFFER: 50,
    MIN_ZOOM: 0.95,
    MAX_ZOOM: 1.05,
    VIGNETTE_COLOR: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.4) 100%)',
    VIGNETTE_PANIC_COLOR: 'rgba(255, 0, 0, 0.3)',
    BATHTUB_WALL_THICKNESS: 25,
  },
  PARTICLES: {
    DUST_COLOR: 'rgba(255, 255, 255, 0.6)',
    FEATHER_COLOR: '#FFD700',
    LEAF_COLOR: '#90EE90',
    SNOW_COLOR: '#FFFFFF',
    SPARKLE_COLOR: '#FFFFE0',
    GLITCH_COLOR: '#00FF00',
    BINARY_COLOR: '#00FF00',
    SWEAT_COLOR: '#4FC3F7',
    BUBBLE_COLOR: 'rgba(255, 255, 255, 0.4)',
    FIRE_COLORS: ['#FF4500', '#FF8C00', '#FFD700'],
    SMOKE_COLOR: 'rgba(100, 100, 100, 0.5)',
    LIFETIME_DUST: 0.5,
    LIFETIME_FEATHER: 1.5,
    LIFETIME_AMBIENT: 3.0,
    LIFETIME_SWEAT: 0.8,
    LIFETIME_BUBBLE: 4.0,
    LIFETIME_FIRE: 0.6,
    LIFETIME_SMOKE: 1.2,
  },
  ANIMATION: {
    SQUASH_FACTOR: 0.15,
    BLINK_INTERVAL: 3000,
    BLINK_DURATION: 150,
    SPAWN_FADE_DURATION: 0.5,
  },
  GRACE_PERIOD: 2000,
  DIFFICULTY_TIER_INTERVAL: 15000,
  LASER_START_TIME: 30000,
  PATTERN_LINE_COUNT: 2,
  REPLAY: {
    DURATION_MS: 5000,
    BUFFER_SIZE: 300,
  },
  FEATHER_EXPLOSION: {
    COUNT: 25,
    SPEED_MIN: 300,
    SPEED_MAX: 600,
    GRAVITY: 1500,
    DRAG: 0.92,
    LIFETIME_MIN: 0.8,
    LIFETIME_MAX: 1.2,
    WOBBLE_SPEED: 10,
  }
};
export const HAZARD_INFO: Record<string, { name: string; description: string; danger: number; strategy: string }> = {
  rock: {
    name: "Rock",
    description: "A solid obstacle. Basic but dangerous.",
    danger: 1,
    strategy: "Stationary threat. Look ahead and steer clear early."
  },
  log: {
    name: "Rolling Log",
    description: "Wide obstacle that rolls across the screen.",
    danger: 2,
    strategy: "Wide obstacle. Move vertically to bypass its width."
  },
  frog: {
    name: "Leap Frog",
    description: "Jumps towards you when you get close!",
    danger: 3,
    strategy: "Predicts your movement. Change direction immediately after it jumps."
  },
  icicle: {
    name: "Icicle",
    description: "Sharp and pointy. Don't touch the tip!",
    danger: 2,
    strategy: "Narrow but deadly. Don't get caught between them."
  },
  snowball: {
    name: "Snowball",
    description: "Rolls and grows. Watch out!",
    danger: 2,
    strategy: "Grows larger over time. Dodge it while it's small!"
  },
  drone: {
    name: "Drone",
    description: "Tracks your movement. Shake it off!",
    danger: 4,
    strategy: "Tracks your position. Make sharp turns to shake it off."
  },
  frisbee: {
    name: "Frisbee",
    description: "Fast moving disc that bounces once.",
    danger: 3,
    strategy: "Fast and bounces once. Watch the walls!"
  },
  glitch_square: {
    name: "Glitch Block",
    description: "Unstable reality fragment.",
    danger: 4,
    strategy: "Flickers in and out. Keep your distance even if it vanishes."
  },
  pixel_orb: {
    name: "Pixel Orb",
    description: "Erratic movement pattern.",
    danger: 3,
    strategy: "Erratic movement. Don't trust its current trajectory."
  },
  gift: {
    name: "Surprise Gift",
    description: "A box of pain, not presents.",
    danger: 2,
    strategy: "A box of pain. Avoid the corners."
  },
  ornament: {
    name: "Ornament",
    description: "Shiny, round, and deadly.",
    danger: 2,
    strategy: "Shiny distraction. Treat it like a rock."
  },
  candy_cane: {
    name: "Candy Cane",
    description: "Sweet but hits hard.",
    danger: 2,
    strategy: "Long rotating barrier. Move with its rotation."
  },
  dodgeball: {
    name: "Dodgeball",
    description: "Bounces off walls multiple times!",
    danger: 4,
    strategy: "Bounces multiple times. Predict the rebound angles."
  },
  wrench: {
    name: "Wrench",
    description: "Dodge, duck, dip, dive, and dodge!",
    danger: 3,
    strategy: "Rotates as it flies. Watch the spinning ends."
  },
  laser: {
    name: "Laser Beam",
    description: "Instant hit after warning. Don't cross the line!",
    danger: 5,
    strategy: "Telegraphs its attack. Get out of the red zone immediately!"
  },
  soap_bubble: {
    name: "Soap Bubble",
    description: "Large, slow, and deceptive. Pops on impact!",
    danger: 2,
    strategy: "Moves slowly but covers a large area. Don't get trapped!"
  },
  shampoo_bottle: {
    name: "Shampoo",
    description: "Slippery bottle. Don't get lathered.",
    danger: 2,
    strategy: "Rectangular obstacle. Watch out for the cap!"
  },
  shower_jet: {
    name: "Shower Jet",
    description: "High pressure stream. Pushes you around but won't kill you.",
    danger: 1,
    strategy: "Non-lethal but annoying. Don't let it push you into other hazards!"
  },
  pool_ball_white: {
    name: "Cue Ball",
    description: "Fast and bouncy.",
    danger: 4,
    strategy: "High velocity. Watch for ricochets off the rails."
  },
  pool_ball_red: {
    name: "Solid Red",
    description: "Standard pool hazard.",
    danger: 3,
    strategy: "Predictable bounce pattern. Keep moving."
  },
  pool_ball_yellow: {
    name: "Solid Yellow",
    description: "Another bouncy sphere.",
    danger: 3,
    strategy: "Similar to red. Don't get cornered."
  },
  pocket: {
    name: "Corner Pocket",
    description: "Gravity always wins.",
    danger: 5,
    strategy: "Stay away from the edges and sides!"
  },
};
export const DEFAULT_SETTINGS = {
  isAudioEnabled: true,
  volume: 0.5,
  isHapticsEnabled: true,
  isReducedMotion: false,
  isGhostEnabled: true,
  isBatterySaver: false,
  joystickMode: 'dynamic' as const,
  joystickOpacity: 0.5,
  showFps: false,
};
export const GAME_TIPS = [
  "Drones explode when they collide! Lure them together.",
  "Daily Challenges reset every 24 hours. Everyone gets the same seed!",
  "Unlock the 'Ninja' skin by surviving 30 seconds in one run.",
  "The 'Glitch' biome is expert difficulty. Good luck!",
  "Use the invisible joystick anywhere on the screen.",
  "Near misses charge your panic meter but look cool.",
  "Some hazards like Frogs predict your movement. Change direction!",
  "Lasers warn you before firing. Get out of the red zone!",
  "Collect coins to buy legendary skins in the shop.",
  "Play with sound on for audio cues on hazard spawns.",
  "Challenge a friend to beat your score on the same seed.",
  "The 'Gym' map has wrenches. If you can dodge a wrench...",
  "Ghost replays show your best run. Learn from your past self!",
  "Tap the version number on the main menu 7 times for a secret.",
  "Battery Saver mode reduces frame rate to save power.",
  "Don't touch the icicles! They are sharp.",
  "The 'City Park' biome is full of bouncing frisbees.",
  "Customize your trail in the wardrobe menu.",
  "Check the leaderboard to see how you rank globally.",
  "You can pause the game by tapping the top right corner."
];