import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrediction } from "@/hooks/use-gamification";
import { trackPrediction } from "@/lib/gamification";

/**
 * "Will it happen?" mini-game shown on rumor cards. One vote per article,
 * stored locally. After voting we reveal a stable, per-article community
 * split so it feels alive without a backend.
 */
export function PredictionVote({ id, dark = false }: { id: string; dark?: boolean }) {
  const { vote, cast } = usePrediction(id);

  // Deterministic community split derived from the article id.
  const yesPct = useMemo(() => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return 35 + (h % 45); // 35–79% say yes
  }, [id]);

  const onVote = (choice: "yes" | "no") => {
    if (vote) return;
    cast(choice);
    trackPrediction();
  };

  if (vote) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[0.65rem] font-bold tracking-wider uppercase">
          <span className={vote === "yes" ? "text-accent" : "text-muted-foreground"}>
            Here we go {yesPct}%
          </span>
          <span className={vote === "no" ? "text-chart-2" : "text-muted-foreground"}>
            No way {100 - yesPct}%
          </span>
        </div>
        <div className={cn("flex h-2 overflow-hidden rounded-full", dark ? "bg-white/15" : "bg-border")}>
          <span className="h-full bg-accent" style={{ width: `${yesPct}%` }} />
          <span className="h-full bg-chart-2" style={{ width: `${100 - yesPct}%` }} />
        </div>
        <span className={cn("text-[0.65rem]", dark ? "text-white/60" : "text-muted-foreground")}>
          You voted {vote === "yes" ? "it happens" : "no chance"} · +12 XP
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={cn(
          "text-[0.65rem] font-bold tracking-wider uppercase",
          dark ? "text-white/70" : "text-muted-foreground",
        )}
      >
        Will it happen?
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onVote("yes");
          }}
          className="flex flex-1 items-center justify-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent uppercase transition-all hover:bg-accent/20 active:scale-95"
        >
          <Check className="h-3.5 w-3.5" /> Here we go
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onVote("no");
          }}
          className="flex flex-1 items-center justify-center gap-1 rounded-full border border-chart-2/50 bg-chart-2/10 px-3 py-1.5 text-xs font-bold text-chart-2 uppercase transition-all hover:bg-chart-2/20 active:scale-95"
        >
          <X className="h-3.5 w-3.5" /> No way
        </button>
      </div>
    </div>
  );
}
