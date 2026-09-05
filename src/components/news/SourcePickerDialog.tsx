import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ArticleSource } from "@/lib/news.functions";

export function SourcePickerDialog({
  open,
  onOpenChange,
  title,
  sources,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sources: ArticleSource[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display uppercase">
            {sources.length} outlets reported this
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{title}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {sources.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent/60 hover:text-accent"
            >
              {s.name}
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
