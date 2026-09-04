/**
 * ItCantBe gamification engine — 100% client-side, backed by localStorage.
 *
 * Tracks XP, levels, a daily visit streak, per-action stats, unlockable
 * achievements, a rapid-fire combo multiplier, a once-a-day bonus and a
 * simple sound layer. All state changes broadcast a `GAME_EVENT` so React
 * components can subscribe without a backend or global store library.
 */

const KEY = "itcantbe:game";
export const GAME_EVENT = "itcantbe:game-change";
export const LEVELUP_EVENT = "itcantbe:game-levelup";
export const ACHIEVEMENT_EVENT = "itcantbe:game-achievement";

export interface GameState {
  xp: number;
  reads: number;
  likes: number;
  shares: number;
  predictions: number;
  bestCombo: number;
  dailyStreak: number;
  dailyStreakBest: number;
  lastVisit: string; // yyyy-mm-dd
  lastBonus: string; // yyyy-mm-dd
  unlocked: string[]; // achievement ids
  sound: boolean;
}

const DEFAULT: GameState = {
  xp: 0,
  reads: 0,
  likes: 0,
  shares: 0,
  predictions: 0,
  bestCombo: 0,
  dailyStreak: 0,
  dailyStreakBest: 0,
  lastVisit: "",
  lastBonus: "",
  unlocked: [],
  sound: true,
};

// ---------------------------------------------------------------------------
// Achievements

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string; // lucide icon name key (resolved in the UI)
  test: (s: GameState, level: number) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_like", name: "First Blood", desc: "Like your first headline", icon: "heart", test: (s) => s.likes >= 1 },
  { id: "scout", name: "Scout", desc: "Open 10 stories", icon: "search", test: (s) => s.reads >= 10 },
  { id: "super_scout", name: "Super Scout", desc: "Open 50 stories", icon: "binoculars", test: (s) => s.reads >= 50 },
  { id: "hype", name: "Hype Machine", desc: "Like 25 headlines", icon: "flame", test: (s) => s.likes >= 25 },
  { id: "crier", name: "Town Crier", desc: "Share 5 stories", icon: "megaphone", test: (s) => s.shares >= 5 },
  { id: "regular", name: "Regular", desc: "3-day visit streak", icon: "calendar", test: (s) => s.dailyStreakBest >= 3 },
  { id: "diehard", name: "Die-hard", desc: "7-day visit streak", icon: "calendar-heart", test: (s) => s.dailyStreakBest >= 7 },
  { id: "onfire", name: "On Fire", desc: "Hit a 5x combo", icon: "zap", test: (s) => s.bestCombo >= 5 },
  { id: "pundit", name: "Pundit", desc: "Make 10 predictions", icon: "gavel", test: (s) => s.predictions >= 10 },
  { id: "veteran", name: "Veteran", desc: "Reach level 5", icon: "medal", test: (_s, lvl) => lvl >= 5 },
  { id: "legend", name: "Legend", desc: "Reach level 10", icon: "crown", test: (_s, lvl) => lvl >= 10 },
  { id: "nightowl", name: "Night Owl", desc: "Scout between 12–5am", icon: "moon", test: () => {
    const h = new Date().getHours();
    return h >= 0 && h < 5;
  } },
];

// ---------------------------------------------------------------------------
// Levels — smoothly rising curve.

export function xpForLevel(level: number): number {
  // cumulative xp required to *reach* the given level (level 1 = 0)
  return Math.round(120 * ((level - 1) * level) / 2);
}

export interface LevelInfo {
  level: number;
  into: number; // xp earned into the current level
  span: number; // xp needed to complete the current level
  pct: number; // 0..100
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level += 1;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = next - base;
  const into = xp - base;
  return { level, into, span, pct: Math.min(100, Math.round((into / span) * 100)) };
}

// ---------------------------------------------------------------------------
// Storage

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function read(): GameState {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<GameState>) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

function write(next: GameState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent<GameState>(GAME_EVENT, { detail: next }));
}

export function getState(): GameState {
  return read();
}

// ---------------------------------------------------------------------------
// Combo — transient, not persisted.

let combo = 0;
let comboTimer: ReturnType<typeof setTimeout> | null = null;
const COMBO_WINDOW = 4000;
export const COMBO_EVENT = "itcantbe:game-combo";

export function currentCombo(): number {
  return combo;
}

function tickCombo(): number {
  combo += 1;
  if (comboTimer) clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    combo = 0;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent<number>(COMBO_EVENT, { detail: 0 }));
    }
  }, COMBO_WINDOW);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<number>(COMBO_EVENT, { detail: combo }));
  }
  return combo;
}

// ---------------------------------------------------------------------------
// Sound — tiny Web Audio blips, no asset files.

let audioCtx: AudioContext | null = null;

function tone(freq: number, durationMs: number, type: OscillatorType = "sine", gain = 0.05) {
  if (typeof window === "undefined") return;
  if (!getState().sound) return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = audioCtx ?? new Ctx();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.start(now);
    osc.stop(now + durationMs / 1000);
  } catch {
    /* ignore */
  }
}

export function playPop(comboLevel = 1) {
  tone(440 + Math.min(comboLevel, 12) * 60, 90, "triangle");
}
export function playLevelUp() {
  tone(523, 110, "triangle");
  setTimeout(() => tone(659, 110, "triangle"), 90);
  setTimeout(() => tone(784, 180, "triangle"), 180);
}
export function playError() {
  tone(180, 160, "sawtooth", 0.04);
}
export function playCoin() {
  tone(988, 80, "square", 0.03);
  setTimeout(() => tone(1319, 140, "square", 0.03), 70);
}

// ---------------------------------------------------------------------------
// Core mutations

function evaluateAchievements(state: GameState): { state: GameState; newlyUnlocked: Achievement[] } {
  const level = levelInfo(state.xp).level;
  const newlyUnlocked: Achievement[] = [];
  const unlocked = new Set(state.unlocked);
  for (const a of ACHIEVEMENTS) {
    if (!unlocked.has(a.id) && a.test(state, level)) {
      unlocked.add(a.id);
      newlyUnlocked.push(a);
    }
  }
  return { state: { ...state, unlocked: [...unlocked] }, newlyUnlocked };
}

function commit(mutator: (s: GameState) => GameState, opts: { combo?: boolean } = {}) {
  const before = read();
  const beforeLevel = levelInfo(before.xp).level;
  let next = mutator({ ...before });

  if (opts.combo) {
    const c = tickCombo();
    next.bestCombo = Math.max(next.bestCombo, c);
  }

  const evaluated = evaluateAchievements(next);
  next = evaluated.state;
  write(next);

  const afterLevel = levelInfo(next.xp).level;
  if (afterLevel > beforeLevel && typeof window !== "undefined") {
    playLevelUp();
    window.dispatchEvent(new CustomEvent<number>(LEVELUP_EVENT, { detail: afterLevel }));
  }
  if (evaluated.newlyUnlocked.length && typeof window !== "undefined") {
    for (const a of evaluated.newlyUnlocked) {
      window.dispatchEvent(new CustomEvent<Achievement>(ACHIEVEMENT_EVENT, { detail: a }));
    }
  }
  return next;
}

/** XP awarded scales with the live combo multiplier. */
function comboMultiplier(): number {
  return 1 + Math.min(combo, 10) * 0.25;
}

export function trackRead() {
  const gained = Math.round(8 * comboMultiplier());
  commit((s) => ({ ...s, reads: s.reads + 1, xp: s.xp + gained }), { combo: true });
  playPop(combo);
}

export function trackLike() {
  const gained = Math.round(5 * comboMultiplier());
  commit((s) => ({ ...s, likes: s.likes + 1, xp: s.xp + gained }), { combo: true });
  playPop(combo);
}

export function trackShare() {
  commit((s) => ({ ...s, shares: s.shares + 1, xp: s.xp + 15 }));
  playCoin();
}

export function trackPrediction() {
  commit((s) => ({ ...s, predictions: s.predictions + 1, xp: s.xp + 12 }));
  playPop();
}

/** Call once on app mount to advance the daily visit streak. */
export function registerVisit() {
  const t = today();
  commit((s) => {
    if (s.lastVisit === t) return s;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streak = s.lastVisit === yesterday ? s.dailyStreak + 1 : 1;
    return {
      ...s,
      lastVisit: t,
      dailyStreak: streak,
      dailyStreakBest: Math.max(s.dailyStreakBest, streak),
    };
  });
}

export function canClaimBonus(): boolean {
  return read().lastBonus !== today();
}

/** Daily "transfer window" bonus. XP grows with the current daily streak. */
export function claimDailyBonus(): number {
  if (!canClaimBonus()) return 0;
  const s = read();
  const amount = 50 + Math.min(s.dailyStreak, 10) * 10;
  commit((st) => ({ ...st, lastBonus: today(), xp: st.xp + amount }));
  playCoin();
  return amount;
}

export function toggleSound(): boolean {
  const next = !read().sound;
  commit((s) => ({ ...s, sound: next }));
  if (next) playPop();
  return next;
}

export function resetGame() {
  write({ ...DEFAULT });
}
