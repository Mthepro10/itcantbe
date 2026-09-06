import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { getArticleById } from "@/lib/news.functions";

function articleQuery(id: string) {
  return queryOptions({
    queryKey: ["article", id],
    queryFn: () => getArticleById({ data: { id } }),
  });
}

export const Route = createFileRoute("/story/$id")({
  loader: async ({ params, context }) => {
    const result = await context.queryClient.ensureQueryData(articleQuery(params.id));
    if (!result.article) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    const a = loaderData?.article;
    if (!a) return { meta: [{ title: "Story not found — ItCantBe" }] };

    const description = a.summary ?? a.title;
    return {
      meta: [
        { title: `${a.title} — ItCantBe` },
        { name: "description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: a.title },
        { property: "og:description", content: description },
        ...(a.image_url ? [{ property: "og:image", content: a.image_url }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: a.title },
        { name: "twitter:description", content: description },
        ...(a.image_url ? [{ name: "twitter:image", content: a.image_url }] : []),
      ],
    };
  },
  component: StoryPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div>
        <h1 className="font-display text-2xl uppercase text-foreground">Story not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have expired — stories roll off after 12–24h.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm font-bold text-accent">
          ← Back to the feed
        </Link>
      </div>
    </div>
  ),
});

function StoryPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(articleQuery(id));
  const article = data.article!;

  const sources =
    article.sources && article.sources.length > 0
      ? article.sources
      : [{ name: article.source_name ?? "Source", url: article.url }];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/" className="text-sm font-bold text-muted-foreground hover:text-accent">
          ← Back to the feed
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          {article.image_url ? (
            <img src={article.image_url} alt={article.title} className="h-64 w-full object-cover" />
          ) : null}
          <div className="p-6">
            {article.category === "confirmed" ? (
              <span className="mb-3 inline-flex items-center rounded-full bg-confirmed px-2.5 py-1 font-display text-xs tracking-[0.12em] text-confirmed-foreground uppercase">
                {article.tag ?? "Confirmed"}
              </span>
            ) : null}
            <h1 className="font-display text-2xl leading-tight text-foreground uppercase sm:text-3xl">
              {article.title}
            </h1>
            {article.summary ? (
              <p className="mt-3 text-muted-foreground">{article.summary}</p>
            ) : null}

            <div className="mt-6 space-y-2">
              <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Read the full story
              </p>
              {sources.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 font-semibold text-foreground transition-colors hover:border-accent/60 hover:text-accent"
                >
                  {s.name}
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
