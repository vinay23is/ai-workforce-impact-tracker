# AI Workforce Impact Tracker

AI Workforce Impact Tracker is a public dataset and website for documenting workforce
reductions with credible links to artificial intelligence. It separates direct AI
replacement from broader restructuring and from layoffs that merely occur alongside AI
investment.

The headline number is deliberately conservative: a reduction is only "confirmed" when the
evidence explicitly connects AI to the decision. Weaker links are shown too, but kept out of
the confirmed total and clearly labelled.

## What it is

- A version-controlled dataset in `data/`, edited through Git commits.
- A mostly static Next.js site that reads the dataset at build time and pre-renders every page.
- No production database, no runtime API, no login, no paid services.

## Methodology

Each event is assigned an attribution category and a confidence level:

- **A — Direct AI replacement**: AI performs work people previously did.
- **B — AI-enabled productivity reduction**: the company says AI lets it run with fewer workers.
- **C — AI-related restructuring**: AI is named as one reason among several.
- **D — AI capital reallocation**: cuts tied to shifting money toward AI (not AI doing the jobs).
- **E — Reported AI connection**: credible reporting links AI, but company evidence is thinner.
- **F — Unconfirmed / context only**: layoffs alongside AI investment with no established causal link. Never counted.

The confirmed total is A–C at medium confidence or higher, backed by a source that explicitly
links AI to the decision. US and global counts are kept separate, unknown is stored as `null`
(never `0`), and forward-looking targets are marked "planned" and excluded from executed totals.
The full methodology, including wage and household estimation, is on the site's Methodology page
and defined in code in [`lib/attribution.ts`](lib/attribution.ts).

## Architecture

- **Next.js (App Router) + TypeScript + Tailwind CSS**, deployed on Vercel's free tier.
- Data lives in `data/` as JSON, validated with Zod. `lib/data.ts` loads and shape-validates it;
  a failure fails the build.
- `lib/aggregations.ts` is the single source of truth for every headline number. Components never
  recompute totals independently.
- Charts and the US map are lightweight custom SVG — no charting or map libraries, no map API.
- `public/generated/` is produced at build time (`prebuild`) and is git-ignored. It is the simple
  static "API": `stats.json`, `events.json`, and more.

## Dataset

```
data/
  events/2023.json, 2024.json, 2025.json   source of truth for events
  companies.json                            companies
  industries.json                           controlled industry taxonomy
  sources.json                              sources, linked to events
  investments.json                          disclosed AI investments
  corrections.json                          published correction log
  methodology.json                          version and coverage metadata
  reference/                                wage, household, and US-geography reference data
  candidates/                               unverified drafts (never loaded, never counted)
```

This V1 is a curated set of well-documented events, not a continuous or exhaustive feed. Absence
from the dataset means an event has not yet been reviewed to this standard — not that it did not
happen.

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Data validation

```bash
npm run validate:data
```

Validation enforces referential integrity, unique ids and slugs, non-negative counts, `us <= global`,
that every published event has a source, and that anything counting as confirmed has a source
explicitly supporting AI attribution. It runs automatically before every build.

## Adding an event

Edit the JSON directly, or use the helper:

```bash
npm run add:event -- path/to/new-event.json
```

The file is an event object, or `{ "event": {...}, "sources": [...] }`. The script checks the
slug, company, and sources, warns about likely duplicates, inserts the event into the correct
year file, and re-runs validation. See [`data/candidates/TEMPLATE.json`](data/candidates/TEMPLATE.json)
for the shape.

## Deployment

Deployment is handled by Vercel's native GitHub integration:

1. Import the repository at [vercel.com/new](https://vercel.com/new) (Hobby plan, no configuration needed).
2. Every push to `main` becomes a production deployment; feature branches get preview deployments.

The GitHub Actions workflow in `.github/workflows/ci.yml` runs validation, lint, typecheck, tests,
and the build on pushes and pull requests. It does **not** deploy — Vercel does that. The default
`*.vercel.app` domain is fine; no custom domain is required.

## Limitations

- Wage and household figures are estimates, rounded and shown with a leading `~`. They are not
  measures of permanent economic loss.
- Reference wages are US-based and are applied to global headcounts where a US figure is unknown,
  which introduces error.
- Coverage is curated, not comprehensive.

## Testing

```bash
npm test
```

Tests cover the confirmed/broader/direct/capital aggregations, exclusion of context-only and
planned events, the US/global distinction, duplicate prevention, wage and household estimation,
and schema rejection of invalid records.

## License

MIT. See [LICENSE](LICENSE). Company names and trademarks belong to their owners. Please cite the
tracker and link to the original sources listed on each event.
