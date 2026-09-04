import { Flame } from "lucide-react";
import { useLikeStreak } from "@/hooks/use-reactions";
import { cn } from "@/lib/utils";

export function StreakBadge({ dark = false }: { dark?: boolean }) {
  const { current } = useLikeStreak();
  if (current < 2) return null;

  return (
    <span
      key={current}
      title={`${current} in a row`}
      className={cn(
        "animate-pop inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold tabular-nums",
        dark
          ? "border-accent/60 bg-accent/20 text-accent"
          : "border-accent/50 bg-accent/10 text-accent",
      )}
    >
      <Flame className="h-3.5 w-3.5 fill-accent" />
      {current}
    </span>
  );
}
