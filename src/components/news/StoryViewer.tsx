import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { getClubPage } from "@/lib/news.functions";
import placeholder from "@/assets/article-placeholder.jpg";

const STORY_DURATION_MS = 6000;

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function StoryViewer({ clubId, onClose }: { clubId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [clubName, setClubName] = useState("");
  const [stories, setStories] = useState<
    { id: string; title: string; summary: string | null; url: string; image_url: string | null; source_name: string | null; published_at: string; category: string | null; tag: string | null }[]
  >([]);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    getClubPage({ data: { clubId } }).then((res) => {
      if (cancelled) return;
      setClubName(res.club?.name ?? "");
      setStories(res.articles.slice(0, 15));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  const goNext = () => {
    if (index + 1 >= stories.length) {
      onClose();
      return;
    }
    setIndex((i) => i + 1);
    elapsedRef.current = 0;
    setProgress(0);
  };

  const goPrev = () => {
    setIndex((i) => Math.max(0, i - 1));
    elapsedRef.current = 0;
    setProgress(0);
  };

  // Auto-advance timer, driven by requestAnimationFrame so pause/resume
  // (press-and-hold) works cleanly without drifting.
  useEffect(() => {
    if (loading || stories.length === 0 || paused) return;
    if (index >= stories.length) {
      onClose();
      return;
    }

    startRef.current = performance.now() - elapsedRef.current;
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      elapsedRef.current = elapsed;
      const pct = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        if (index + 1 >= stories.length) {
          onClose();
        } else {
          setIndex((i) => i + 1);
          elapsedRef.current = 0;
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, stories.length, index, paused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, stories.length]);

  const current = stories[index];

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      ) : !current ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="font-display text-xl text-white uppercase">No stories right now</p>
          <button type="button" onClick={onClose} className="text-sm font-bold text-accent">
            Close
          </button>
        </div>
      ) : (
        <div
          className="relative h-full w-full"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
        >
          {/* Progress bars */}
          <div className="absolute top-3 right-3 left-3 z-20 flex gap-1">
            {stories.map((s, i) => (
              <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full bg-white"
                  style={{
                    width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
                    transition: i === index ? "none" : undefined,
                  }}
                />
              </div>
            ))}
          </div>

          <div className="absolute top-7 right-3 left-3 z-20 flex items-center justify-between">
            <span className="font-display text-sm text-white uppercase">{clubName}</span>
            <button type="button" onClick={onClose} aria-label="Close" className="text-white">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tap zones for prev/next */}
          <button
            type="button"
            aria-label="Previous story"
            onClick={goPrev}
            className="absolute top-0 left-0 z-10 h-full w-1/3"
          />
          <button
            type="button"
            aria-label="Next story"
            onClick={goNext}
            className="absolute top-0 right-0 z-10 h-full w-1/3"
          />

          <img
            src={current.image_url ?? placeholder}
            alt={current.title}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

          <div className="absolute right-0 bottom-0 left-0 z-20 flex flex-col gap-2 p-5 pb-10">
            {current.category === "confirmed" ? (
              <span className="w-fit rounded-full bg-confirmed px-2.5 py-1 font-display text-[0.7rem] text-confirmed-foreground uppercase">
                {current.tag ?? "Confirmed"}
              </span>
            ) : null}
            <h2 className="font-display text-2xl leading-tight text-white uppercase">
              {current.title}
            </h2>
            {current.summary ? (
              <p className="line-clamp-2 text-sm text-white/80">{current.summary}</p>
            ) : null}
            <div className="flex items-center gap-2 text-xs text-white/60 uppercase">
              <span className="font-bold text-white/90">{current.source_name}</span>
              <span aria-hidden>•</span>
              <span>{relativeTime(current.published_at)}</span>
            </div>
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-1 w-fit rounded-full bg-white px-4 py-2 text-xs font-bold text-black"
            >
              Read full story
            </a>
          </div>
        </div>
      )}
    </div>
  );
}


