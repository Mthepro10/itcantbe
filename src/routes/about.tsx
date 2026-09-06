import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ItCantBe" },
      {
        name: "description",
        content: "How ItCantBe aggregates football news, and why every click sends you to the original source.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link to="/" className="text-sm font-bold text-muted-foreground hover:text-accent">
          ← Back to the feed
        </Link>

        <h1 className="mt-6 font-display text-3xl uppercase text-foreground">About ItCantBe</h1>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <p>
            ItCantBe is a football transfer news aggregator. We pull headlines from major
            outlets, classify them by league, club, and confidence level (confirmed, rumor, or
            general news), and surface them in one place — so you don't need a dozen tabs open
            during transfer season.
          </p>

          <p className="font-semibold text-foreground">We don't republish articles.</p>

          <p>
            Every card you see is a title, a short summary, and an image — never the full
            article text. Every click sends you directly to the original publisher's site.
            We don't profit from anyone else's reporting; we point you toward it.
          </p>

          <p className="font-semibold text-foreground">When multiple outlets report the same story</p>

          <p>
            We merge them into a single card instead of showing the same transfer three or four
            times. If more than one source is available, you'll see a "+N more sources" tag —
            tap it to choose which outlet you'd like to read.
          </p>

          <p className="font-semibold text-foreground">The "Will it happen?" predictions</p>

          <p>
            Vote percentages are real, anonymous, aggregate votes from everyone using the site —
            not simulated numbers. We don't require an account to vote; one vote per story per
            visitor is enforced without storing any personal data.
          </p>

          <p className="font-semibold text-foreground">Feedback</p>

          <p>
            If you run one of the outlets we aggregate and have questions about how we link to
            your content, or if something looks wrong, we're happy to hear from you.
          </p>
        </div>
      </div>
    </div>
  );
}
