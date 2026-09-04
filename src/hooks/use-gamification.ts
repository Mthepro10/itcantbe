import { useCallback, useEffect, useState } from "react";
import {
  ACHIEVEMENT_EVENT,
  COMBO_EVENT,
  GAME_EVENT,
  LEVELUP_EVENT,
  currentCombo,
  getState,
  levelInfo,
  type Achievement,
  type GameState,
} from "@/lib/gamification";

/** Subscribe to the whole game state. */
export function useGame(): GameState {
  const [state, setState] = useState<GameState>(() => getState());

  useEffect(() => {
    setState(getState());
    const onChange = (e: Event) => setState((e as CustomEvent<GameState>).detail);
    window.addEventListener(GAME_EVENT, onChange);
    return () => window.removeEventListener(GAME_EVENT, onChange);
  }, []);

  return state;
}

/** Convenience: current level breakdown derived from live XP. */
export function useLevel() {
  const state = useGame();
  return levelInfo(state.xp);
}

/** Live combo counter (transient). */
export function useCombo(): number {
  const [combo, setCombo] = useState(() => currentCombo());
  useEffect(() => {
    setCombo(currentCombo());
    const onCombo = (e: Event) => setCombo((e as CustomEvent<number>).detail);
    window.addEventListener(COMBO_EVENT, onCombo);
    return () => window.removeEventListener(COMBO_EVENT, onCombo);
  }, []);
  return combo;
}

/** Fire a callback whenever the player levels up. */
export function useLevelUp(cb: (level: number) => void) {
  useEffect(() => {
    const handler = (e: Event) => cb((e as CustomEvent<number>).detail);
    window.addEventListener(LEVELUP_EVENT, handler);
    return () => window.removeEventListener(LEVELUP_EVENT, handler);
  }, [cb]);
}

/** Fire a callback whenever a new achievement unlocks. */
export function useAchievementUnlock(cb: (a: Achievement) => void) {
  useEffect(() => {
    const handler = (e: Event) => cb((e as CustomEvent<Achievement>).detail);
    window.addEventListener(ACHIEVEMENT_EVENT, handler);
    return () => window.removeEventListener(ACHIEVEMENT_EVENT, handler);
  }, [cb]);
}

// ---------------------------------------------------------------------------
// Per-article prediction votes (kept separate from the aggregate stats).

const PRED_KEY = "itcantbe:predictions";
type PredStore = Record<string, "yes" | "no">;

function readPreds(): PredStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PRED_KEY);
    return raw ? (JSON.parse(raw) as PredStore) : {};
  } catch {
    return {};
  }
}

function writePreds(store: PredStore) {
  try {
    window.localStorage.setItem(PRED_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function usePrediction(id: string) {
  const [vote, setVote] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    setVote(readPreds()[id] ?? null);
  }, [id]);

  const cast = useCallback(
    (next: "yes" | "no") => {
      const store = readPreds();
      if (store[id]) return; // one vote per article
      store[id] = next;
      writePreds(store);
      setVote(next);
    },
    [id],
  );

  return { vote, cast };
}
