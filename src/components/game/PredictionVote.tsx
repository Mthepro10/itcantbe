import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrediction } from "@/hooks/use-gamification";
import { trackPrediction } from "@/lib/gamification";
import { castVote } from "@/lib/news.functions";

/**
 * "Will it happen?" mini-game shown on rumor cards. One vote per article,
 * remembered locally so you can't vote twice — but the split you see is a
 * REAL aggregate from every fan who has voted, stored anonymously in the
 * database (no account needed). No hashing, no fake numbers.
 */
export function PredictionVote({
  id,
  yesCount = 0,
  noCount = 0,
  dark = false,
}: {
  id: string;
  yesCount?: number;
  noCount?: number;
  dark?: boolean;
}) {
  const { vote, cast } = usePrediction(id);
  const [counts, setCounts] = useState({ yes: yesCount, no: noCount });

  const total = counts.yes + counts.no;
  const yesPct = total > 0 ? Math.round((counts.yes / total) * 100) : 50;

  const onVote = (choice: "yes" | "no") => {
    if (vote) return;
    cast(choice);
    trackPrediction();
    // Optimistic bump so it feels instant, reconciled below with the real total.
    setCounts((c) => ({ ...c, [choice]: c[choice] + 1 }));
    castVote({ data: { articleId: id, choice } })
      .then((res) => {
        if (!res.error) setCounts({ yes: res.yesCount, no: res.noCount });
      })
      .catch(() => {
        /* keep the optimistic value if the network call fails */
      });
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
          <span
            className="h-full bg-accent transition-[width] duration-500"
            style={{ width: `${yesPct}%` }}
          />
          <span
            className="h-full bg-chart-2 transition-[width] duration-500"
            style={{ width: `${100 - yesPct}%` }}
          />
        </div>
        <span className={cn("text-[0.65rem]", dark ? "text-white/60" : "text-muted-foreground")}>
          {total.toLocaleString()} fans voted · you said{" "}
          {vote === "yes" ? "it happens" : "no chance"} · +12 XP
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
        Will it happen?{total > 0 ? ` · ${total.toLocaleString()} votes so far` : ""}
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

