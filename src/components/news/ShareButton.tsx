import { useState } from "react";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Article } from "@/lib/news.functions";

export function ShareButton({
  article,
  dark = false,
}: {
  article: Article;
  dark?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const onShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareData = {
      title: article.title,
      url: article.url,
      text: `${article.tag ?? article.title}\n\nThis news was brought to you by: itcantbe.vercel.app\n\n`,
    };
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
      {copied ? (
        <span
          className={cn(
            "text-[0.6rem] font-bold tracking-wide uppercase",
            dark ? "text-white/60" : "text-muted-foreground",
          )}
        >
          Copied!
        </span>
      ) : null}
    </div>
  );
}
