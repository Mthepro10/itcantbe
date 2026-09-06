import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getClubPage } from "@/lib/news.functions";

function clubQuery(clubId: string) {
  return queryOptions({
    queryKey: ["club-page", clubId],
    queryFn: () => getClubPage({ data: { clubId } }),
  });
}

export const Route = createFileRoute("/team/$id")({
  loader: async ({ params, context }) => {
    const result = await context.queryClient.ensureQueryData(clubQuery(params.id));
    if (!result.club) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    const club = loaderData?.club;
    if (!club) return { meta: [{ title: "Team not found — ItCantBe" }] };
    const description = `Latest ${club.name} transfer news, rumors and confirmed deals, aggregated live.`;
    return {
      meta: [
        { title: `${club.name} News — ItCantBe` },
        { name: "description", content: description },
        { property: "og:title", content: `${club.name} News — ItCantBe` },
        { property: "og:description", content: description },
      ],
    };
  },
  component: TeamPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div>
        <h1 className="font-display text-2xl uppercase text-foreground">Team not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm font-bold text-accent">
          ← Back to the feed
        </Link>
      </div>
    </div>
  ),
});

function TeamPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(clubQuery(id));
  const club = data.club!;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Link to="/" className="text-sm font-bold text-muted-foreground hover:text-accent">
            ← Back to the feed
          </Link>
          <div className="mt-3 flex items-center gap-3">
            {club.color_primary ? (
              <span
                className="h-8 w-2 rounded-full"
                style={{
                  background: `linear-gradient(160deg, ${club.color_primary} 50%, ${club.color_secondary ?? club.color_primary} 50%)`,
                }}
              />
            ) : null}
            <h1 className="font-display text-3xl uppercase text-foreground sm:text-4xl">
              {club.name}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.articles.length} recent {data.articles.length === 1 ? "story" : "stories"}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-3 px-4 py-6">
        {data.articles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No {club.name} stories in the feed right now — check back soon.
          </p>
        ) : (
          data.articles.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent/60"
            >
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {a.category === "confirmed" ? (
                  <span className="rounded-full bg-confirmed px-2 py-0.5 text-confirmed-foreground">
                    {a.tag ?? "Confirmed"}
                  </span>
                ) : a.category === "rumor" ? (
                  <span className="text-accent">Rumor</span>
                ) : (
                  <span>News</span>
                )}
                <span>{a.source_name}</span>
              </div>
              <h2 className="mt-1 font-semibold text-foreground">{a.title}</h2>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
