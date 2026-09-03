# The Transfer Wire

Build a football transfer news website connected to my Supabase project.

DATA

Connect to my Supabase project (I'll paste the URL + anon key when I set up the integration).

There are three tables:

- `articles`: id, title, summary, url, image_url, source_name, published_at, league_id (fk),

  club_ids (uuid array, fk to clubs), category (text: "news" | "rumor" | "confirmed"), tag (text, nullable)

- `leagues`: id, name, country, region, tier

- `clubs`: id, name, league_id (fk), country, aliases (text array)

DESIGN

Style it like a breaking-news transfer account (Fabrizio Romano vibe) — dark theme,

high-contrast, bold sans-serif headlines, feels urgent and live. Not corporate or sterile.

Use a card-based feed, newest first (order by published_at desc). Each card shows:

- the image_url (fallback to a placeholder football graphic if null)

- the title

- source_name + a relative timestamp ("2h ago")

- a colored badge based on category:

  - "confirmed" → bold gold/yellow badge showing the `tag` text ("IT CAN'T BE!!!!") in caps

  - "rumor" → a subtler badge saying "RUMOR"

  - "news" → no badge, or a plain "NEWS" label

- clicking a card opens the source `url` in a new tab (this app only shows headlines/images/

  summaries, never full article text — always link back to the original source)

FILTERS

Add a filter bar above the feed:

- League dropdown (populated from the `leagues` table, grouped by region)

- Club/team multi-select (populated from the `clubs` table, filtered to the selected league)

- Category filter (All / Confirmed / Rumors / News) as pill buttons

When filters are applied, query articles where league_id matches and/or club_ids overlaps

the selected club ids (use Supabase's `.overlaps()` for the array column), and category matches.

LAYOUT

- Header: site name/logo placeholder + tagline like "Here's the source. We don't say it, THEY do."

  (or something similarly self-aware/playful, your call)

- Filter bar (sticky on scroll)

- Responsive card grid: 3 columns desktop, 1 column mobile

- Infinite scroll or "Load more" button, paginating articles 20 at a time

- Empty state: if filters return nothing, show a friendly "No news matching that yet — check

  back soon" message

NOT NEEDED

- No auth/login — this is a public read-only feed

- No commenting or user accounts

- Don't try to write to the database — the backend Edge Function handles all writes on a

  schedule; the frontend only ever reads

Keep it fast and mobile-first — most people will land on this from a shared link.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://itcantbe.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fb1dac03-8572-4316-9dce-9cf933d7b674).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
# itcantbe
