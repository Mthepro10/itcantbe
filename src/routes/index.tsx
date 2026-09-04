import { Fragment, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { infiniteQueryOptions, queryOptions, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/news/ArticleCard";
import { AdCard } from "@/components/news/AdCard";
import { OneAtATimeFeed } from "@/components/news/OneAtATimeFeed";
import { FilterBar, type CategoryValue } from "@/components/news/FilterBar";
import { getFilterOptions, listArticles, PAGE_SIZE } from "@/lib/news.functions";
import { cn } from "@/lib/utils";

const CATEGORY_VALUES: CategoryValue[] = ["all", "confirmed", "rumor", "news"];

interface FeedSearch {
  league?: string | undefined;
  clubs?: string[] | undefined;
  category?: CategoryValue | undefined;
}

const filtersQuery = queryOptions({
  queryKey: ["filter-options"],
  queryFn: () => getFilterOptions(),
  staleTime: 30 * 60_000,
});

function articlesQuery(search: FeedSearch) {
  const leagueId = search.league ?? null;
  const clubIds = search.clubs ?? [];
  const category = search.category ?? "all";
  return infiniteQueryOptions({
    queryKey: ["articles", leagueId, clubIds, category],
    queryFn: ({ pageParam }) =>
      listArticles({ data: { leagueId, clubIds, category, page: pageParam } }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length : undefined),
    staleTime: 60_000,
  });
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): FeedSearch => {
    const rawClubs = search["clubs"];
    const clubs = Array.isArray(rawClubs)
      ? rawClubs.filter((c): c is string => typeof c === "string")
      : typeof rawClubs === "string" && rawClubs.length > 0
        ? rawClubs.split(",")
        : undefined;
    const rawCategory = search["category"];
    const category = CATEGORY_VALUES.includes(rawCategory as CategoryValue)
      ? (rawCategory as CategoryValue)
      : undefined;
    const rawLeague = search["league"];
    return {
      league: typeof rawLeague === "string" && rawLeague ? rawLeague : undefined,
      clubs: clubs && clubs.length > 0 ? clubs : undefined,
      category,
    };
  },

  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(filtersQuery),
      context.queryClient.ensureInfiniteQueryData(articlesQuery(deps)),
    ]);
  },
  head: () => ({
    meta: [
      { title: "ItCantBe — Live Football Transfer News & Rumors" },
      {
        name: "description",
        content:
          "Every football transfer headline the second it drops: confirmed deals, rumors and news, straight from the source. Filter by league and club.",
      },
      { property: "og:title", content: "ItCantBe — Live Football Transfer News" },
      {
        property: "og:description",
        content:
          "Confirmed deals, rumors and breaking transfer news. It can't be, but is IT!!??",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Feed,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <p className="text-muted-foreground">The wire dropped out. Refresh to try again.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <p className="text-muted-foreground">Nothing here.</p>
    </div>
  ),
});

function Feed() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const [view, setView] = useState<"overview" | "1atime">("overview");

  const { data: options } = useSuspenseQuery(filtersQuery);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useSuspenseInfiniteQuery(articlesQuery(search));

  const articles = data.pages.flatMap((p) => p.articles);
  const feedError = data.pages[0]?.error ?? options.error;

  const setSearch = (next: Partial<FeedSearch>) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, ...next }) });

  const ViewToggle = (
    <div className="inline-flex rounded-full border border-border bg-card p-1">
      <button
        type="button"
        onClick={() => setView("overview")}
        className={cn(
          "rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors",
          view === "overview"
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Overview
      </button>
      <button
        type="button"
        onClick={() => setView("1atime")}
        className={cn(
          "rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors",
          view === "1atime"
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        1AtATime
      </button>
    </div>
  );

  if (view === "1atime") {
    return (
      <div className="relative min-h-screen bg-black">
        <div className="absolute top-3 left-1/2 z-30 -translate-x-1/2">{ViewToggle}</div>
        <OneAtATimeFeed
          articles={articles}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-sm bg-accent px-2 py-1 font-display text-xs tracking-[0.2em] text-accent-foreground uppercase">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent-foreground" />
                Live
              </span>
              <h1 className="font-display text-3xl leading-none tracking-tight uppercase sm:text-5xl">
                It<span className="text-accent">CantBe</span>
              </h1>
            </div>
            {ViewToggle}
          </div>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            It can't be, but is <span className="text-foreground">IT!!??</span>
          </p>
        </div>
      </header>

      <FilterBar
        leagues={options.leagues}
        clubs={options.clubs}
        leagueId={search.league ?? null}
        clubIds={search.clubs ?? []}
        category={search.category ?? "all"}
        onLeagueChange={(league) =>
          setSearch({ league: league ?? undefined, clubs: undefined })
        }
        onClubsChange={(clubs) => setSearch({ clubs: clubs.length ? clubs : undefined })}
        onCategoryChange={(category) =>
          setSearch({ category: category === "all" ? undefined : category })
        }
        onClear={() => navigate({ to: ".", search: {} })}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {feedError ? (
          <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
            {feedError}{" "}
            <button
              type="button"
              onClick={() => router.invalidate()}
              className="font-semibold text-accent uppercase hover:underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {articles.length === 0 && !feedError ? (
          <div className="py-24 text-center">
            <p className="font-display text-2xl uppercase">No news matching that yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Check back soon — deals move fast.</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <Fragment key={article.id}>
              <ArticleCard article={article} priority={i < 3} />
              {(i + 1) % 4 === 0 ? <AdCard slot={(i + 1) / 4} /> : null}
            </Fragment>
          ))}
        </div>



        {hasNextPage ? (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="font-semibold tracking-wider uppercase"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
                </>
              ) : (
                `Load ${PAGE_SIZE} more`
              )}
            </Button>
          </div>
        ) : null}

        {isFetching && !isFetchingNextPage ? (
          <p className="mt-6 text-center text-xs tracking-widest text-muted-foreground uppercase">
            Updating feed…
          </p>
        ) : null}
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Headlines and images link back to their original sources. We only ever quote the wire.
      </footer>
    </div>
  );
}
