import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (q: string) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => setDraft(value), [value]);

  const handleInput = (next: string) => {
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(next), 350);
  };

  const clear = () => {
    clearTimeout(timer.current);
    setDraft("");
    onChange("");
  };

  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={draft}
        onChange={(e) => handleInput(e.target.value)}
        placeholder="Search players, clubs..."
        className="w-full rounded-full border border-border bg-card py-2 pr-8 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent/60 focus:outline-none"
      />
      {draft ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
