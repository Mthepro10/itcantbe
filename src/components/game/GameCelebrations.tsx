import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trophy, ArrowUp } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useAchievementUnlock, useLevelUp } from "@/hooks/use-gamification";
import { registerVisit } from "@/lib/gamification";

const CONFETTI_COLORS = [
  "var(--color-accent)",
  "var(--color-confirmed)",
  "var(--color-chart-2)",
  "var(--color-primary)",
];

/**
 * App-wide celebration layer: advances the daily visit streak on mount,
 * fires toasts for level-ups and achievement unlocks, and rains confetti
 * on level-up. Renders the Sonner <Toaster> so toasts appear everywhere.
 */
export function GameCelebrations() {
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    registerVisit();
  }, []);

  useLevelUp(
    useCallback((level: number) => {
      setBurst((n) => n + 1);
      toast(`Level ${level}!`, {
        description: "You leveled up. Keep scouting the wire.",
        icon: <ArrowUp className="h-4 w-4 text-accent" />,
      });
    }, []),
  );

  useAchievementUnlock(
    useCallback((a) => {
      toast(`Badge unlocked: ${a.name}`, {
        description: a.desc,
        icon: <Trophy className="h-4 w-4 text-accent" />,
      });
    }, []),
  );

  return (
    <>
      <Toaster position="top-center" />
      {burst > 0 ? (
        <div
          key={burst}
          className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
          aria-hidden
        >
          {Array.from({ length: 60 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 250;
            const duration = 1600 + Math.random() * 1200;
            const size = 6 + Math.random() * 8;
            const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
            return (
              <span
                key={i}
                className="animate-confetti-fall absolute top-[-10%] rounded-[1px]"
                style={{
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size * 0.4}px`,
                  background: color,
                  animationDelay: `${delay}ms`,
                  animationDuration: `${duration}ms`,
                }}
              />
            );
          })}
        </div>
      ) : null}
    </>
  );
}
