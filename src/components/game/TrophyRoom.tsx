import { useMemo, useState } from "react";
import {
  Binoculars,
  CalendarHeart,
  Calendar,
  Crown,
  Flame,
  Gavel,
  Gift,
  Heart,
  Lock,
  Medal,
  Megaphone,
  Moon,
  Search,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useGame, useLevel } from "@/hooks/use-gamification";
import { ACHIEVEMENTS, canClaimBonus, claimDailyBonus, resetGame } from "@/lib/gamification";

const ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  search: Search,
  binoculars: Binoculars,
  flame: Flame,
  megaphone: Megaphone,
  calendar: Calendar,
  "calendar-heart": CalendarHeart,
  zap: Zap,
  gavel: Gavel,
  medal: Medal,
  crown: Crown,
  moon: Moon,
};

// Deterministic pseudo-fans for a local, offline "leaderboard".
const FANS = [
  { name: "TouchlineTerry", xp: 4200 },
  { name: "TifoTina", xp: 3100 },
  { name: "DeadlineDayDan", xp: 2450 },
  { name: "HereWeGoHarry", xp: 1780 },
  { name: "RumourRita", xp: 1200 },
  { name: "BantzBarry", xp: 720 },
  { name: "CouchScoutCharlie", xp: 380 },
  { name: "NewFanNadia", xp: 90 },
];

function Rank({ open }: { open: boolean }) {
  const state = useGame();
  const board = useMemo(() => {
    const list = [...FANS, { name: "You", xp: state.xp, you: true }].sort((a, b) => b.xp - a.xp);
    return list;
    // recompute only while the dialog is open and xp changes
  }, [state.xp]);

  if (!open) return null;
  const myRank = board.findIndex((f) => "you" in f && f.you) + 1;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        You&apos;re <span className="font-bold text-foreground">#{myRank}</span> of{" "}
        {board.length} scouts. Rack up XP to climb.
      </p>
      <ol className="space-y-1.5">
        {board.map((f, i) => {
          const you = "you" in f && f.you;
          return (
            <li
              key={f.name}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                you ? "border-accent bg-accent/10" : "border-border bg-card",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full font-display text-xs tabular-nums",
                  i === 0
                    ? "bg-confirmed text-confirmed-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className={cn("flex-1 font-semibold", you && "text-accent")}>{f.name}</span>
              <span className="tabular-nums text-muted-foreground">{f.xp.toLocaleString()} XP</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function DailyBonus() {
  const state = useGame();
  const [claimable, setClaimable] = useState(() => canClaimBonus());
  const [gained, setGained] = useState(0);

  const onClaim = () => {
    const amount = claimDailyBonus();
    if (amount > 0) {
      setGained(amount);
      setClaimable(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClaim}
      disabled={!claimable}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
        claimable
          ? "animate-pop border-accent bg-accent/10 hover:bg-accent/15 active:scale-[0.98]"
          : "border-border bg-card opacity-70",
      )}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
        <Gift className="h-5 w-5" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold text-foreground">Transfer Window Bonus</span>
        <span className="block text-xs text-muted-foreground">
          {claimable
            ? `Claim +${50 + Math.min(state.dailyStreak, 10) * 10} XP today`
            : gained
              ? `Claimed +${gained} XP — back tomorrow`
              : "Already claimed — back tomorrow"}
        </span>
      </span>
    </button>
  );
}

export function TrophyRoom({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const state = useGame();
  const level = useLevel();
  const unlocked = new Set(state.unlocked);
  const unlockedCount = unlocked.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl uppercase">
            <Trophy className="h-5 w-5 text-accent" /> Trophy Room
          </DialogTitle>
          <DialogDescription>
            Level {level.level} · {state.xp.toLocaleString()} XP · {unlockedCount}/
            {ACHIEVEMENTS.length} badges
          </DialogDescription>
        </DialogHeader>

        {/* Level progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold tracking-wider text-muted-foreground uppercase">
            <span>Level {level.level}</span>
            <span className="tabular-nums">
              {level.into}/{level.span} to Lv {level.level + 1}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${level.pct}%` }}
            />
          </div>
        </div>

        <DailyBonus />

        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="ranks">Ranks</TabsTrigger>
          </TabsList>

          <TabsContent value="badges" className="mt-3">
            <div className="grid grid-cols-3 gap-2">
              {ACHIEVEMENTS.map((a) => {
                const Icon = ICONS[a.icon] ?? Medal;
                const got = unlocked.has(a.id);
                return (
                  <div
                    key={a.id}
                    title={`${a.name} — ${a.desc}`}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
                      got ? "border-accent/50 bg-accent/10" : "border-border bg-card",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-full",
                        got ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {got ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                    </span>
                    <span
                      className={cn(
                        "text-[0.65rem] leading-tight font-bold",
                        got ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {a.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="ranks" className="mt-3">
            <Rank open={open} />
          </TabsContent>
        </Tabs>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.confirm("Reset all progress?")) resetGame();
          }}
          className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Reset progress
        </button>
      </DialogContent>
    </Dialog>
  );
}
