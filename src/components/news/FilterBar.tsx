import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Club, League } from "@/lib/news.functions";

export type CategoryValue = "all" | "confirmed" | "rumor" | "news";

const CATEGORIES: { value: CategoryValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rumor", label: "Rumors" },
  { value: "news", label: "News" },
];

const ALL_LEAGUES = "__all__";

interface FilterBarProps {
  leagues: League[];
  clubs: Club[];
  leagueId: string | null;
  clubIds: string[];
  category: CategoryValue;
  onLeagueChange: (leagueId: string | null) => void;
  onClubsChange: (clubIds: string[]) => void;
  onCategoryChange: (category: CategoryValue) => void;
  onClear: () => void;
}

export function FilterBar({
  leagues,
  clubs,
  leagueId,
  clubIds,
  category,
  onLeagueChange,
  onClubsChange,
  onCategoryChange,
  onClear,
}: FilterBarProps) {
  const grouped = leagues.reduce<Record<string, League[]>>((acc, league) => {
    const key = league.region ?? "Other";
    (acc[key] ??= []).push(league);
    return acc;
  }, {});

  const clubOptions = leagueId ? clubs.filter((c) => c.league_id === leagueId) : clubs;
  const selectedClubs = clubs.filter((c) => clubIds.includes(c.id));
  const hasFilters = Boolean(leagueId) || clubIds.length > 0 || category !== "all";

  const toggleClub = (id: string) => {
    onClubsChange(clubIds.includes(id) ? clubIds.filter((c) => c !== id) : [...clubIds, id]);
  };

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={leagueId ?? ALL_LEAGUES}
            onValueChange={(v) => onLeagueChange(v === ALL_LEAGUES ? null : v)}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="All leagues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_LEAGUES}>All leagues</SelectItem>
              {Object.entries(grouped).map(([region, list]) => (
                <SelectGroup key={region}>
                  <SelectLabel>{region}</SelectLabel>
                  {list.map((league) => (
                    <SelectItem key={league.id} value={league.id}>
                      {league.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between sm:w-56"
                disabled={clubOptions.length === 0}
              >
                <span className="truncate">
                  {clubIds.length === 0
                    ? "All clubs"
                    : `${clubIds.length} club${clubIds.length > 1 ? "s" : ""}`}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search clubs..." />
                <CommandList>
                  <CommandEmpty>No clubs found.</CommandEmpty>
                  <CommandGroup>
                    {clubOptions.map((club) => (
                      <CommandItem key={club.id} value={club.name} onSelect={() => toggleClub(club.id)}>
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            clubIds.includes(club.id) ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {club.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="flex flex-wrap gap-1.5 sm:ml-auto">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => onCategoryChange(c.value)}
                aria-pressed={category === c.value}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors",
                  category === c.value
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {hasFilters ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedClubs.map((club) => (
              <button
                key={club.id}
                type="button"
                onClick={() => toggleClub(club.id)}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {club.name}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold tracking-wider text-accent uppercase hover:underline"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
