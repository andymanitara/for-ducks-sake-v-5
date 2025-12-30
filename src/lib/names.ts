export const ADJECTIVES = [
  "Speedy", "Mega", "Super", "Hyper", "Neon", "Cyber", "Turbo", "Quantum",
  "Lucky", "Brave", "Sneaky", "Happy", "Crazy", "Wild", "Epic", "Royal",
  "Golden", "Silver", "Iron", "Cosmic", "Astro", "Ninja", "Shadow", "Rapid",
  "Swift", "Mighty", "Grand", "Ultra", "Sonic", "Flash", "Zoom", "Zap"
];
export const NOUNS = [
  "Duck", "Quack", "Bill", "Feather", "Waddle", "Wing", "Pond", "Lake",
  "River", "Splash", "Float", "Diver", "Pilot", "Racer", "Dodger", "Survivor",
  "Hero", "Legend", "Master", "King", "Queen", "Prince", "Duke", "Baron",
  "Ace", "Star", "Comet", "Rocket", "Jet", "Glider", "Surfer"
];
export function generateRandomName(rng?: () => number): string {
  const random = rng || Math.random;
  const adj = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(random() * NOUNS.length)];
  const num = Math.floor(random() * 99) + 1;
  return `${adj}${noun}${num}`;
}