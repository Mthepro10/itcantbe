/**
 * Adsterra native banner rendered as a regular feed card.
 *
 * The Adsterra loader serves only one placement per document (repeat invokes
 * are skipped as duplicates), so every feed slot loads the exact Adsterra
 * snippet from its own page (/adsterra.html) inside an iframe. A per-slot
 * query string keeps each placement distinct.
 */
export function AdCard({ slot = 1 }: { slot?: number }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-card">
      <div className="border-b border-border px-4 py-2 text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
        Advertisement
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
        <iframe
          title="Advertisement"
          src={`/adsterra.html?slot=${slot}`}
          scrolling="no"
          className="h-[320px] w-full border-0"
        />
      </div>
    </div>
  );
}
