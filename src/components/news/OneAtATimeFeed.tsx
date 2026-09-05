import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, Coffee, Heart, ThumbsDown, Loader2 } from "lucide-react";
import placeholder from "@/assets/article-placeholder.jpg";
import { cn } from "@/lib/utils";
import { useReaction, bumpStreak, resetStreak } from "@/hooks/use-reactions";
import { ShareButton } from "@/components/news/ShareButton";
import { AdCard } from "@/components/news/AdCard";
import { SourcePickerDialog } from "@/components/news/SourcePickerDialog";
import { PredictionVote } from "@/components/game/PredictionVote";
import { trackLike, trackRead } from "@/lib/gamification";
import type { Article } from "@/lib/news.functions";

const AD_INTERVAL = 6;
const BREATHER_INTERVAL = 15;

type FeedItem =
  | { type: "article"; article: Article }
  | { type: "ad"; slot: number }
  | { type: "breather"; count: number };

function buildItems(articles: Article[]): FeedItem[] {
  const items: FeedItem[] = [];
  let adSlot = 0;
  let sinceBreather = 0;
  articles.forEach((article, i) => {
    items.push({ type: "article", article });
    sinceBreather += 1;
    if ((i + 1) % AD_INTERVAL === 0) {
      adSlot += 1;
      items.push({ type: "ad", slot: adSlot });
    }
    if (sinceBreather >= BREATHER_INTERVAL) {
      items.push({ type: "breather", count: i + 1 });
      sinceBreather = 0;
    }
  });
  return items;
}

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
  return `${days}d ago`;
}

function OneCard({ article, active }: { article: Article; active: boolean }) {
  const [broken, setBroken] = useState(false);
  const src = !broken && article.image_url ? article.image_url : placeholder;
  const { reaction, like, dislike } = useReaction(article.id);
  const [pickerOpen, setPickerOpen] = useState(false);

  const sources =
    article.sources && article.sources.length > 0
      ? article.sources
      : [{ name: article.source_name ?? "Source", url: article.url }];
  const hasMultipleSources = sources.length > 1;

  return (
    <div className="relative flex h-full w-full flex-col justify-end overflow-hidden bg-black">
      <img
        src={src}
        alt={article.title}
        onError={() => setBroken(true)}
        loading={active ? "eager" : "lazy"}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          trackRead();
          if (hasMultipleSources) {
            e.preventDefault();
            setPickerOpen(true);
          }
        }}
        className="relative z-10 flex flex-col gap-3 p-5 pr-20 pb-24 sm:pr-24 sm:pb-10"
      >
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full px-2.5 py-1 font-display text-[0.7rem] tracking-[0.12em] uppercase",
            article.category === "confirmed" && "bg-confirmed text-confirmed-foreground",
            article.category === "rumor" && "border border-accent/50 bg-accent/10 text-accent",
            (!article.category || article.category === "news") &&
              "border border-white/30 text-white",
          )}
        >
          {article.category === "confirmed"
            ? (article.tag ?? "Confirmed")
            : article.category === "rumor"
              ? "Rumor"
              : "News"}
        </span>
        <h2 className="font-display text-2xl leading-tight text-white uppercase sm:text-3xl">
          {article.title}
        </h2>
        {article.summary ? (
          <p className="line-clamp-3 text-sm text-white/80">{article.summary}</p>
        ) : null}
        <div className="flex items-center gap-2 text-xs tracking-wide text-white/60 uppercase">
          <span className="font-bold text-white/90">{article.source_name ?? "Source"}</span>
          <span aria-hidden>•</span>
          <span>{relativeTime(article.published_at)}</span>
          {hasMultipleSources ? (
            <span className="rounded-full border border-accent/50 bg-accent/15 px-2 py-0.5 text-[0.6rem] font-bold text-accent normal-case">
              +{sources.length - 1} more sources
            </span>
          ) : null}
        </div>
      </a>

      <SourcePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={article.title}
        sources={sources}
      />

      {article.category === "rumor" ? (
        <div className="relative z-10 -mt-16 px-5 pr-20 pb-24 sm:-mt-4 sm:pr-24 sm:pb-10">
          <PredictionVote id={article.id} yesCount={article.yes_count} noCount={article.no_count} dark />
        </div>
      ) : null}

      <div className="absolute right-4 bottom-28 z-10 flex flex-col items-center gap-4 sm:bottom-10">
        <ShareButton article={article} dark />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            const wasLike = reaction === "like";
            like();
            if (!wasLike) {
              bumpStreak();
              trackLike();
            }
          }}
          aria-label="Like"
          aria-pressed={reaction === "like"}
          className={cn(
            "grid h-12 w-12 place-items-center rounded-full border backdrop-blur-md transition-all active:scale-90",
            reaction === "like"
              ? "border-accent bg-accent/25 text-accent"
              : "border-white/30 bg-black/30 text-white",
          )}
        >
          <Heart className={cn("h-6 w-6", reaction === "like" && "animate-pop fill-accent")} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            dislike();
            resetStreak();
          }}
          aria-label="Dislike"
          aria-pressed={reaction === "dislike"}
          className={cn(
            "grid h-12 w-12 place-items-center rounded-full border backdrop-blur-md transition-all active:scale-90",
            reaction === "dislike"
              ? "border-chart-2 bg-chart-2/25 text-chart-2"
              : "border-white/30 bg-black/30 text-white",
          )}
        >
          <ThumbsDown
            className={cn("h-6 w-6", reaction === "dislike" && "animate-pop fill-chart-2")}
          />
        </button>
      </div>
    </div>
  );
}

export function OneAtATimeFeed({
  articles,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  articles: Article[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}) {
  const items = buildItems(articles);
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const scrollToIndex = useCallback(
    (i: number) => {
      const el = containerRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(i, el.children.length - 1));
      el.children[clamped]?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [],
  );

  // Track which card is currently in view, and trigger pagination near the end.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(el.scrollTop / el.clientHeight);
        setIndex(i);
        if (hasNextPage && !isFetchingNextPage && i >= items.length - 3) {
          onLoadMore?.();
        }
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [items.length, hasNextPage, isFetchingNextPage, onLoadMore]);

  // Arrow-key navigation for laptop/desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollToIndex(index + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollToIndex(index - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, scrollToIndex]);

  if (items.length === 0) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black px-4 text-center">
        <p className="font-display text-2xl text-white uppercase">No news matching that yet</p>
      </div>
    );
  }

  return (
    <div className="relative bg-black">
      <div
        ref={containerRef}
        className="h-[100dvh] snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        {items.map((item) =>
          item.type === "article" ? (
            <div key={item.article.id} className="h-[100dvh] w-full snap-start">
              <OneCard article={item.article} active />
            </div>
          ) : item.type === "breather" ? (
            <div
              key={`breather-${item.count}`}
              className="flex h-[100dvh] w-full snap-start flex-col items-center justify-center gap-4 bg-black px-8 text-center"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-white/5 text-white/80">
                <Coffee className="h-6 w-6" />
              </span>
              <h2 className="font-display text-2xl text-white uppercase">You're all caught up</h2>
              <p className="max-w-xs text-sm text-white/60">
                That's {item.count} of today's headlines. Take a breather — or keep swiping if
                there's more you want to see.
              </p>
            </div>
          ) : (
            <div
              key={`ad-${item.slot}`}
              className="flex h-[100dvh] w-full snap-start items-center justify-center bg-black px-6"
            >
              <AdCard slot={item.slot} />
            </div>
          ),
        )}
        {isFetchingNextPage ? (
          <div className="flex h-[100dvh] w-full snap-start items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : null}
      </div>

      {/* Desktop up/down controls */}
      <div className="pointer-events-none absolute top-1/2 right-3 z-20 hidden -translate-y-1/2 flex-col gap-2 sm:right-6 md:flex">
        <button
          type="button"
          onClick={() => scrollToIndex(index - 1)}
          disabled={index === 0}
          aria-label="Previous"
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60 disabled:opacity-30"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollToIndex(index + 1)}
          aria-label="Next"
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
