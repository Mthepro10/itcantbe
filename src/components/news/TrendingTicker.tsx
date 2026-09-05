import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { getTrendingClubs, type TrendingClub } from "@/lib/news.functions";

export function TrendingTicker() {
  const [clubs, setClubs] = useState<TrendingClub[]>([]);

  useEffect(() => {
    let cancelled = false;
    getTrendingClubs().then((res) => {
      if (!cancelled) setClubs(res.clubs);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (clubs.length === 0) return null;

  // Repeat the list so the marquee loop has no visible seam.
  const items = [...clubs, ...clubs];

  return (
    <div className="overflow-hidden border-b border-border bg-card">
      <div className="ticker-track flex w-max items-center gap-8 py-2">
        {items.map((c, i) => (
          <span
            key={`${c.id}-${i}`}
            className="flex shrink-0 items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase"
          >
            <Flame className="h-3.5 w-3.5 text-accent" />
            {c.name}
            <span className="text-foreground/70">
              {c.count} {c.count === 1 ? "story" : "stories"} · 6h
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
