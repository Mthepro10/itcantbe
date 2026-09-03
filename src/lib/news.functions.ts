import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const PAGE_SIZE = 20;

export interface Article {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  image_url: string | null;
  source_name: string | null;
  published_at: string;
  league_id: string | null;
  club_ids: string[] | null;
  category: string | null;
  tag: string | null;
}

export interface League {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  tier: number | null;
}

export interface Club {
  id: string;
  name: string;
  league_id: string | null;
  country: string | null;
}

export interface ArticlePage {
  articles: Article[];
  hasMore: boolean;
  error: string | null;
}

export interface FilterOptions {
  leagues: League[];
  clubs: Club[];
  error: string | null;
}

/** Keeps select strings out of the type-level parser (build perf). */
const sel = (s: string): string => s;

function getReadClient() {
  const url = process.env["TRANSFER_DB_URL"];
  const key = process.env["TRANSFER_DB_ANON_KEY"];
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        // Opaque sb_ publishable keys are not JWTs — send only apikey.
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

const MISSING_CONFIG =
  "The news database isn't connected yet. Add the project URL and anon key to start pulling headlines.";

const articleFilters = z.object({
  leagueId: z.string().nullable().optional(),
  clubIds: z.array(z.string()).optional(),
  category: z.enum(["all", "confirmed", "rumor", "news"]).optional(),
  page: z.number().int().min(0).max(500).optional(),
});

export type ArticleFilters = z.infer<typeof articleFilters>;

export const listArticles = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => articleFilters.parse(input ?? {}))
  .handler(async ({ data }): Promise<ArticlePage> => {
    const supabase = getReadClient();
    if (!supabase) return { articles: [], hasMore: false, error: MISSING_CONFIG };

    const page = data.page ?? 0;
    const from = page * PAGE_SIZE;

    let query = supabase
      .from("articles")
      .select(
        sel(
          "id, title, summary, url, image_url, source_name, published_at, league_id, club_ids, category, tag",
        ),
      )
      .order("published_at", { ascending: false })
      .range(from, from + PAGE_SIZE);

    if (data.leagueId) query = query.eq("league_id", data.leagueId);
    if (data.clubIds && data.clubIds.length > 0) {
      query = query.overlaps("club_ids", data.clubIds);
    }
    if (data.category && data.category !== "all") {
      query = query.eq("category", data.category);
    }

    const { data: rows, error } = await query.returns<Article[]>();
    if (error) {
      console.error("listArticles failed", error.message);
      return { articles: [], hasMore: false, error: "Couldn't load the feed right now." };
    }

    const list = rows ?? [];
    return {
      articles: list.slice(0, PAGE_SIZE),
      hasMore: list.length > PAGE_SIZE,
      error: null,
    };
  });

export const getFilterOptions = createServerFn({ method: "GET" }).handler(
  async (): Promise<FilterOptions> => {
    const supabase = getReadClient();
    if (!supabase) return { leagues: [], clubs: [], error: MISSING_CONFIG };

    const [leaguesRes, clubsRes] = await Promise.all([
      supabase
        .from("leagues")
        .select(sel("id, name, country, region, tier"))
        .order("name")
        .returns<League[]>(),
      supabase
        .from("clubs")
        .select(sel("id, name, league_id, country"))
        .order("name")
        .returns<Club[]>(),
    ]);

    if (leaguesRes.error || clubsRes.error) {
      console.error(
        "getFilterOptions failed",
        leaguesRes.error?.message ?? clubsRes.error?.message,
      );
      return { leagues: [], clubs: [], error: "Couldn't load filters right now." };
    }

    return { leagues: leaguesRes.data ?? [], clubs: clubsRes.data ?? [], error: null };
  },
);
