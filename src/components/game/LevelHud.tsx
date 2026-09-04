import { useState } from "react";
import { Trophy, Volume2, VolumeX, Zap, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCombo, useGame, useLevel } from "@/hooks/use-gamification";
import { toggleSound } from "@/lib/gamification";
import { TrophyRoom } from "@/components/game/TrophyRoom";

/**
 * Compact heads-up display: level ring + XP, daily streak, live combo,
 * sound toggle and the Trophy Room launcher. Uses the site's dark theme
 * tokens so it sits happily on both the overview and 1AtATime views.
 */
export function LevelHud() {
  const state = useGame();
  const level = useLevel();
  const combo = useCombo();
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(state.sound);

  const ring = `conic-gradient(var(--color-accent) ${level.pct * 3.6}deg, var(--color-border) 0deg)`;

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 p-1 pr-1.5 backdrop-blur-md">
      {/* Level ring */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Level ${level.level}. Open trophy room`}
        className="group relative grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90"
        style={{ background: ring }}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-card font-display text-xs leading-none text-foreground tabular-nums">
          {level.level}
        </span>
      </button>

      {/* XP bar — hidden on the tightest screens */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden w-24 flex-col gap-1 px-1 text-left sm:flex"
        aria-label="Open trophy room"
      >
        <span className="flex items-center justify-between text-[0.6rem] font-bold tracking-wider text-muted-foreground uppercase">
          <span>Lv {level.level}</span>
          <span className="tabular-nums">{level.into}/{level.span}</span>
        </span>
        <span className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${level.pct}%` }}
          />
        </span>
      </button>

      {/* Daily streak */}
      {state.dailyStreak >= 1 ? (
        <span
          title={`${state.dailyStreak}-day visit streak`}
          className="inline-flex items-center gap-0.5 rounded-full bg-accent/10 px-2 py-1 text-xs font-bold text-accent tabular-nums"
        >
          <Flame className="h-3.5 w-3.5 fill-accent" />
          {state.dailyStreak}
        </span>
      ) : null}

      {/* Live combo */}
      {combo >= 2 ? (
        <span
          key={combo}
          className="animate-pop inline-flex items-center gap-0.5 rounded-full bg-confirmed px-2 py-1 text-xs font-black text-confirmed-foreground tabular-nums"
        >
          <Zap className="h-3.5 w-3.5 fill-confirmed-foreground" />
          {combo}x
        </span>
      ) : null}

      {/* Sound toggle */}
      <button
        type="button"
        onClick={() => setSound(toggleSound())}
        aria-label={sound ? "Mute sound effects" : "Unmute sound effects"}
        aria-pressed={sound}
        className={cn(
          "grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground",
        )}
      >
        {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>

      {/* Trophy room */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open trophy room"
        className="grid h-8 w-8 place-items-center rounded-full text-accent transition-transform hover:scale-110 active:scale-90"
      >
        <Trophy className="h-4.5 w-4.5" />
      </button>

      <TrophyRoom open={open} onOpenChange={setOpen} />
    </div>
  );
}
