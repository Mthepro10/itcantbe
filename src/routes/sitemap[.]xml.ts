import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getReadClient } from "@/lib/news.functions";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const BASE_URL = new URL(request.url).origin;
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "hourly", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.3" },
        ];

        const supabase = getReadClient();
        if (supabase) {
          // Team pages — stable, high SEO value, worth crawling often.
          const { data: clubs } = await supabase.from("clubs").select("id");
          for (const club of clubs ?? []) {
            entries.push({ path: `/team/${club.id}`, changefreq: "daily", priority: "0.6" });
          }

          // Story pages — only currently-live articles (expired ones 404
          // anyway once the cleanup cron removes them, so there's no
          // point listing them).
          const { data: articles } = await supabase
            .from("articles")
            .select("id")
            .order("published_at", { ascending: false })
            .limit(500);
          for (const article of articles ?? []) {
            entries.push({ path: `/story/${article.id}`, changefreq: "never", priority: "0.5" });
          }
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

