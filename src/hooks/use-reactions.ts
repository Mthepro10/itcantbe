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
