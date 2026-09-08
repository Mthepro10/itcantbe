import { useEffect, useState } from "react";
import { getStoryClubs, type StoryClub } from "@/lib/news.functions";

export function StoryCircles({ onSelect }: { onSelect: (clubId: string) => void }) {
  const [clubs, setClubs] = useState<StoryClub[]>([]);

  useEffect(() => {
    let cancelled = false;
    getStoryClubs().then((res) => {
      if (!cancelled) setClubs(res.clubs);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (clubs.length === 0) return null;

  return (
    <div className="border-b border-border bg-background">
      <div className="scrollbar-none flex gap-4 overflow-x-auto px-4 py-4">
        {clubs.map((club) => (
          <button
            key={club.id}
            type="button"
            onClick={() => onSelect(club.id)}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <span
              className="grid h-16 w-16 place-items-center rounded-full p-[3px]"
              style={{
                background: `linear-gradient(135deg, ${club.color_primary ?? "#525252"}, ${club.color_secondary ?? club.color_primary ?? "#525252"})`,
              }}
            >
              <span className="grid h-full w-full place-items-center rounded-full bg-background">
                <span className="font-display text-lg text-foreground">
                  {club.name.slice(0, 2).toUpperCase()}
                </span>
              </span>
            </span>
            <span className="w-full truncate text-center text-[0.65rem] font-semibold text-muted-foreground">
              {club.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}


