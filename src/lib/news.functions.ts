import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const PAGE_SIZE = 20;

export interface ArticleSource {
  name: string;
  url: string;
}

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
  yes_count?: number;
  no_count?: number;
  sources?: ArticleSource[] | null;
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
  color_primary: string | null;
  color_secondary: string | null;
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
  q: z.string().max(80).optional(),
  page: z.number().int().min(0).max(500).optional(),
});

export type ArticleFilters = z.infer<typeof articleFilters>;

/** Strips characters that would break PostgREST's or()/ilike filter syntax. */
function sanitizeSearchTerm(q: string): string {
  return q.replace(/[,()%*]/g, " ").trim().slice(0, 80);
}

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
          "id, title, summary, url, image_url, source_name, published_at, league_id, club_ids, category, tag, sources",
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
    const term = data.q ? sanitizeSearchTerm(data.q) : "";
    if (term) {
      query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%`);
    }

    const { data: rows, error } = await query.returns<Article[]>();
    if (error) {
      console.error("listArticles failed", error.message);
      return { articles: [], hasMore: false, error: "Couldn't load the feed right now." };
    }

    const list = rows ?? [];
    const pageArticles = list.slice(0, PAGE_SIZE);
    const hasMore = list.length > PAGE_SIZE;

    // Attach real (anonymous, aggregate) vote counts for rumor cards.
    const rumorIds = pageArticles.filter((a) => a.category === "rumor").map((a) => a.id);
    if (rumorIds.length > 0) {
      const { data: voteRows } = await supabase
        .from("article_votes")
        .select("article_id, yes_count, no_count")
        .in("article_id", rumorIds);
      const voteMap = new Map(
        (voteRows ?? []).map((v) => [v.article_id as string, v as { yes_count: number; no_count: number }]),
      );
      for (const a of pageArticles) {
        const v = voteMap.get(a.id);
        if (v) {
          a.yes_count = v.yes_count;
          a.no_count = v.no_count;
        }
      }
    }

    return { articles: pageArticles, hasMore, error: null };
  });

const voteInput = z.object({
  articleId: z.string(),
  choice: z.enum(["yes", "no"]),
});

export const castVote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => voteInput.parse(input))
  .handler(async ({ data }): Promise<{ yesCount: number; noCount: number; error: string | null }> => {
    const supabase = getReadClient();
    if (!supabase) return { yesCount: 0, noCount: 0, error: MISSING_CONFIG };

    const { data: rows, error } = await supabase.rpc("cast_vote", {
      p_article_id: data.articleId,
      p_choice: data.choice,
    });

    if (error || !rows || rows.length === 0) {
      console.error("castVote failed", error?.message);
      return { yesCount: 0, noCount: 0, error: "Couldn't record your vote right now." };
    }

    const row = rows[0] as { yes_count: number; no_count: number };
    return { yesCount: row.yes_count, noCount: row.no_count, error: null };
  });

export interface CommunityPulse {
  totalVotes: number;
  hottest: { title: string; tag: string | null; yesCount: number; noCount: number } | null;
  error: string | null;
}

export const getCommunityPulse = createServerFn({ method: "GET" }).handler(
  async (): Promise<CommunityPulse> => {
    const supabase = getReadClient();
    if (!supabase) return { totalVotes: 0, hottest: null, error: MISSING_CONFIG };

    const { data: rows, error } = await supabase
      .from("article_votes")
      .select("article_id, yes_count, no_count, articles(title, tag)");

    if (error) {
      console.error("getCommunityPulse failed", error.message);
      return { totalVotes: 0, hottest: null, error: "Couldn't load community stats." };
    }

    type Row = { yes_count: number; no_count: number; articles: { title: string; tag: string | null } | null };
    const list = (rows ?? []) as unknown as Row[];

    const totalVotes = list.reduce((sum, r) => sum + (r.yes_count ?? 0) + (r.no_count ?? 0), 0);

    let hottest: CommunityPulse["hottest"] = null;
    let max = -1;
    for (const r of list) {
      const total = (r.yes_count ?? 0) + (r.no_count ?? 0);
      if (total > max && r.articles) {
        max = total;
        hottest = { title: r.articles.title, tag: r.articles.tag, yesCount: r.yes_count, noCount: r.no_count };
      }
    }

    return { totalVotes, hottest, error: null };
  },
);

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
        .select(sel("id, name, league_id, country, color_primary, color_secondary"))
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

export interface TrendingClub {
  id: string;
  name: string;
  count: number;
}

export const getTrendingClubs = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ clubs: TrendingClub[]; error: string | null }> => {
    const supabase = getReadClient();
    if (!supabase) return { clubs: [], error: MISSING_CONFIG };

    const cutoff = new Date(Date.now() - 6 * 3600_000).toISOString();
    const { data: rows, error } = await supabase
      .from("articles")
      .select("club_ids")
      .gte("published_at", cutoff)
      .not("club_ids", "is", null)
      .limit(300);

    if (error) {
      console.error("getTrendingClubs failed", error.message);
      return { clubs: [], error: "Couldn't load trending clubs." };
    }

    const tally = new Map<string, number>();
    for (const row of rows ?? []) {
      for (const id of (row.club_ids as string[]) ?? []) {
        tally.set(id, (tally.get(id) ?? 0) + 1);
      }
    }

    const topIds = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (topIds.length === 0) return { clubs: [], error: null };

    const { data: clubRows } = await supabase
      .from("clubs")
      .select("id, name")
      .in(
        "id",
        topIds.map(([id]) => id),
      );

    const nameMap = new Map((clubRows ?? []).map((c) => [c.id as string, c.name as string]));
    const clubs = topIds
      .map(([id, count]) => ({ id, name: nameMap.get(id) ?? "Unknown", count }))
      .filter((c) => c.name !== "Unknown");

    return { clubs, error: null };
  },
);
