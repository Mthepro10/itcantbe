import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackShare } from "@/lib/gamification";
import type { Article } from "@/lib/news.functions";

/** Mirrors the DB cleanup cron: rumors live 24h, everything else 12h. */
function expiryHours(category: string | null): number {
  return category === "rumor" ? 24 : 12;
}

function useCountdown(publishedAt: string, hours: number) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const expiry = new Date(publishedAt).getTime() + hours * 3_600_000;
    const tick = () => {
      const diff = expiry - Date.now();
      if (diff <= 0) {
        setLabel("expiring");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setLabel(h > 0 ? `${h}h ${m}m left` : `${m}m left`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [publishedAt, hours]);

  return label;
}

export function ShareButton({
  article,
  dark = false,
}: {
  article: Article;
  dark?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown(article.published_at, expiryHours(article.category));

  const onShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareData = {
      title: article.title,
      url: article.url,
      text: `${article.tag ?? article.title}\n\nThis news was brought to you by: itcantbe.vercel.app\n\n`,
    };
    trackShare();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled — no-op */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(article.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={onShare}
        aria-label="Share"
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full border backdrop-blur-md transition-all active:scale-90",
          dark
            ? "border-white/30 bg-black/30 text-white hover:border-accent/60"
            : "border-border text-muted-foreground hover:border-accent/60 hover:text-accent",
        )}
      >
        <Share2 className="h-4 w-4" />
      </button>
      <span
        className={cn(
          "text-[0.6rem] font-bold tracking-wide uppercase",
          countdown === "expiring" ? "text-accent" : dark ? "text-white/60" : "text-muted-foreground",
        )}
      >
        {copied ? "Copied!" : countdown}
      </span>
    </div>
  );
}
