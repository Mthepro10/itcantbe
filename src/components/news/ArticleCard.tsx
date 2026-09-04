import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, ThumbsDown } from "lucide-react";
import placeholder from "@/assets/article-placeholder.jpg";
import { cn } from "@/lib/utils";
import { useReaction, bumpStreak, resetStreak } from "@/hooks/use-reactions";
import { ShareButton } from "@/components/news/ShareButton";
import { PredictionVote } from "@/components/game/PredictionVote";
import { trackLike, trackRead } from "@/lib/gamification";
import type { Article } from "@/lib/news.functions";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function RelativeTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(relativeTime(iso));
  }, [iso]);
  return <>{label}</>;
}

function CategoryBadge({ category, tag }: { category: string | null; tag: string | null }) {
  if (category === "confirmed") {
    return (
      <span className="inline-flex items-center rounded-full bg-confirmed px-2.5 py-1 font-display text-[0.7rem] leading-none tracking-[0.12em] text-confirmed-foreground uppercase shadow-[0_0_0_2px_var(--color-background),0_4px_14px_-4px_var(--color-confirmed)]">
        {(tag ?? "Confirmed").toUpperCase()}
      </span>
    );
  }
  if (category === "rumor") {
    return (
      <span className="inline-flex items-center rounded-full border border-accent/50 bg-accent/10 px-2.5 py-1 text-[0.7rem] leading-none font-bold tracking-[0.12em] text-accent uppercase">
        Rumor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[0.7rem] leading-none font-bold tracking-[0.12em] text-muted-foreground uppercase">
      News
    </span>
  );
}

const CONFETTI = [
  { x: -70, y: -60, c: "var(--color-accent)" },
  { x: 70, y: -55, c: "var(--color-confirmed)" },
  { x: -55, y: 55, c: "var(--color-chart-2)" },
  { x: 60, y: 62, c: "var(--color-primary)" },
  { x: 0, y: -85, c: "var(--color-accent)" },
  { x: 0, y: 85, c: "var(--color-confirmed)" },
];

export function ArticleCard({ article, priority = false }: { article: Article; priority?: boolean }) {
  const [broken, setBroken] = useState(false);
  const [burst, setBurst] = useState(0);
  const [nope, setNope] = useState(0);
  const lastTap = useRef(0);
  const src = !broken && article.image_url ? article.image_url : placeholder;
  const { reaction, like, likeOnly, dislike } = useReaction(article.id);

  const fireBurst = useCallback(() => setBurst((n) => n + 1), []);

  const onLike = () => {
    const wasLike = reaction === "like";
    like();
    if (!wasLike) {
      fireBurst();
      bumpStreak();
      trackLike();
    }
  };

  const onDislike = () => {
    dislike();
    setBurst(0);
    setNope((n) => n + 1);
    resetStreak();
  };

  const onCardClick = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      e.preventDefault();
      likeOnly();
      fireBurst();
      bumpStreak();
      trackLike();
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    trackRead();
  };

  return (
    <article
      key={nope}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_40px_-24px_var(--color-accent)] transition-all",
        "hover:-translate-y-0.5 hover:border-accent/60",
        nope % 2 === 1 && "animate-nope",
      )}
    >
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onCardClick}
        onDoubleClick={(e) => {
          e.preventDefault();
          likeOnly();
          fireBurst();
          bumpStreak();
          trackLike();
        }}
        className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted select-none">
          <img
            src={src}
            alt={article.title}
            width={1024}
            height={576}
            loading={priority ? "eager" : "lazy"}
            onError={() => setBroken(true)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            draggable={false}
          />
          {burst > 0 && reaction === "like" ? (
            <div key={burst} className="pointer-events-none absolute inset-0 grid place-items-center">
              <Heart className="animate-heart-burst h-24 w-24 fill-accent text-accent drop-shadow-[0_6px_24px_var(--color-accent)]" />
              {CONFETTI.map((p, i) => (
                <span
                  key={i}
                  className="animate-confetti absolute h-2 w-2 rounded-full"
                  style={{
                    background: p.c,
                    ["--cx" as string]: `${p.x}px`,
                    ["--cy" as string]: `${p.y}px`,
                    animationDelay: `${i * 25}ms`,
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <CategoryBadge category={article.category} tag={article.tag} />
          </div>

          <h2 className="font-display text-xl leading-tight tracking-tight text-card-foreground uppercase sm:text-2xl">
            {article.title}
          </h2>

          {article.summary ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{article.summary}</p>
          ) : null}

          {article.category === "rumor" ? (
            <div
              className="mt-auto pt-1"
              onClick={(e) => e.preventDefault()}
              role="presentation"
            >
              <PredictionVote id={article.id} />
            </div>
          ) : null}
        </div>
      </a>

      <div className="flex items-center gap-2 border-t border-border px-4 py-3 text-xs tracking-wide text-muted-foreground uppercase sm:px-5">
        <span className="font-bold text-foreground/80">{article.source_name ?? "Source"}</span>
        <span aria-hidden>•</span>
        <time dateTime={article.published_at}>
          <RelativeTime iso={article.published_at} />
        </time>

        <div className="ml-auto flex items-center gap-1.5">
          <ShareButton article={article} />
          <button
            type="button"
            onClick={onLike}
            aria-pressed={reaction === "like"}
            aria-label="Like"
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full border transition-all active:scale-90",
              reaction === "like"
                ? "border-accent bg-accent/15 text-accent"
                : "border-border text-muted-foreground hover:border-accent/60 hover:text-accent",
            )}
          >
            <Heart
              className={cn("h-4.5 w-4.5 transition-transform", reaction === "like" && "animate-pop fill-accent")}
            />
          </button>
          <button
            type="button"
            onClick={onDislike}
            aria-pressed={reaction === "dislike"}
            aria-label="Dislike"
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full border transition-all active:scale-90",
              reaction === "dislike"
                ? "border-chart-2 bg-chart-2/15 text-chart-2"
                : "border-border text-muted-foreground hover:border-chart-2/60 hover:text-chart-2",
            )}
          >
            <ThumbsDown
              className={cn(
                "h-4.5 w-4.5 transition-transform",
                reaction === "dislike" && "animate-pop fill-chart-2",
              )}
            />
          </button>
        </div>
      </div>
    </article>
  );
}
