import { useCallback, useEffect, useState } from "react";

export type Reaction = "like" | "dislike" | null;

const KEY = "itcantbe:reactions";

type Store = Record<string, "like" | "dislike">;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

/** Per-article like/dislike kept locally — no counters, no writes to the backend. */
export function useReaction(id: string) {
  const [reaction, setReaction] = useState<Reaction>(null);

  useEffect(() => {
    setReaction(read()[id] ?? null);
  }, [id]);

  const apply = useCallback(
    (next: Reaction) => {
      setReaction(next);
      const store = read();
      if (next) store[id] = next;
      else delete store[id];
      write(store);
    },
    [id],
  );

  const like = useCallback(() => apply(reaction === "like" ? null : "like"), [apply, reaction]);
  const likeOnly = useCallback(() => apply("like"), [apply]);
  const dislike = useCallback(
    () => apply(reaction === "dislike" ? null : "dislike"),
    [apply, reaction],
  );

  return { reaction, like, likeOnly, dislike };
}

// ---------------------------------------------------------------------------

const STREAK_KEY = "itcantbe:streak";
const STREAK_EVENT = "itcantbe:streak-change";

export interface StreakState {
  current: number;
  best: number;
}

function readStreak(): StreakState {
  if (typeof window === "undefined") return { current: 0, best: 0 };
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    return raw ? (JSON.parse(raw) as StreakState) : { current: 0, best: 0 };
  } catch {
    return { current: 0, best: 0 };
  }
}

function writeStreak(next: StreakState) {
  try {
    window.localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<StreakState>(STREAK_EVENT, { detail: next }));
  }
}

export function bumpStreak(): StreakState {
  const s = readStreak();
  const next = { current: s.current + 1, best: Math.max(s.best, s.current + 1) };
  writeStreak(next);
  return next;
}

export function resetStreak(): StreakState {
  const s = readStreak();
  if (s.current === 0) return s;
  const next = { current: 0, best: s.best };
  writeStreak(next);
  return next;
}

export function useLikeStreak(): StreakState {
  const [state, setState] = useState<StreakState>(() => readStreak());

  useEffect(() => {
    setState(readStreak());
    const onChange = (e: Event) => setState((e as CustomEvent<StreakState>).detail);
    window.addEventListener(STREAK_EVENT, onChange);
    return () => window.removeEventListener(STREAK_EVENT, onChange);
  }, []);

  return state;
}
