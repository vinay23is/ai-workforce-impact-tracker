import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/Page";
import { loadDataset } from "@/lib/data";
import {
  ATTRIBUTION_LEVELS,
  ATTRIBUTION_META,
  ATTRIBUTION_RULES,
  CONFIDENCE_LEVELS,
  CONFIDENCE_META,
} from "@/lib/attribution";
import { formatDate } from "@/lib/formatting";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How events are selected, classified, and counted: attribution categories, confidence, source hierarchy, US vs global counts, deduplication, and how wage and household figures are estimated.",
};

const SOURCE_HIERARCHY = [
  "SEC and other regulatory filings",
  "Company announcements",
  "Earnings calls and shareholder letters",
  "WARN and state workforce notices",
  "Reuters",
  "Associated Press",
  "Bloomberg",
  "Other major financial journalism",
  "Respected industry and local reporting",
  "Other credible secondary reporting",
];

export default function MethodologyPage() {
  const { meta } = loadDataset();
  return (
    <>
      <PageHeader
        eyebrow="Methodology"
        title="How this is measured"
        intro="The project's value is its willingness to exclude weak numbers. This page explains exactly what counts, what does not, and how every figure is produced."
      />
      <Container className="py-8">
        <div className="max-w-prose space-y-12 text-[15px] leading-relaxed text-ink-soft">
          <section>
            <H>What counts</H>
            <p>
              An event is a single workforce reduction at one company where credible evidence links
              artificial intelligence to the decision. Five articles about one layoff are still one
              event. A reduction enters the <strong>confirmed</strong> total only when it is in
              attribution categories A, B, or C, has a confidence of medium or higher, has already
              happened, and is supported by at least one source that explicitly links AI to the
              decision.
            </p>
            <p className="mt-3">
              What does not count: layoffs that merely happen near an AI announcement with no stated
              relationship; forecasts and targets that have not been executed (shown separately as
              &ldquo;planned&rdquo;); and headline totals inflated by counting the same reduction
              twice.
            </p>
          </section>

          <section id="attribution">
            <H>Attribution categories</H>
            <p>
              Every event carries one category. Categories A–C are treated as confirmed AI attribution.
              D and E are AI-linked but kept out of the confirmed total. F never counts.
            </p>
            <dl className="mt-4 space-y-4">
              {ATTRIBUTION_LEVELS.map((level) => {
                const m = ATTRIBUTION_META[level];
                const inConfirmed = ATTRIBUTION_RULES.confirmedLevels.includes(level);
                return (
                  <div key={level} className="border-l-2 pl-4" style={{ borderColor: `var(--attr-${level.toLowerCase()})` }}>
                    <dt className="font-medium text-ink">
                      {level} — {m.label}{" "}
                      <span className="text-xs font-normal text-faint">
                        {inConfirmed ? "counts as confirmed" : level === "F" ? "never counted" : "AI-linked, not confirmed"}
                      </span>
                    </dt>
                    <dd className="mt-1 text-sm text-muted">{m.description}</dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <section>
            <H>Worked examples</H>
            <Example
              quote="AI now performs work previously handled by 1,000 employees."
              verdict="A — Direct AI replacement"
            />
            <Example
              quote="Our restructuring reflects AI adoption, automation, simplification, and broader cost reduction."
              verdict="C — AI-related restructuring"
            />
            <Example
              quote="The company announced layoffs and, separately, a large AI investment, with no stated connection between them."
              verdict="F — Unconfirmed / context only"
            />
            <p className="mt-4 text-sm text-muted">
              The third case is the one most trackers get wrong. We do not write &ldquo;5,000 workers
              were fired to fund AI&rdquo; from a coincidence of timing. We write that both happened in
              the same period and that the evidence does not establish a financial relationship.
            </p>
          </section>

          <section>
            <H>Confidence</H>
            <p>The confidence label reflects how strong the underlying evidence is.</p>
            <dl className="mt-4 space-y-2">
              {CONFIDENCE_LEVELS.map((c) => (
                <div key={c} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <dt className="w-32 shrink-0 font-medium text-ink">{CONFIDENCE_META[c].label}</dt>
                  <dd className="text-sm text-muted">{CONFIDENCE_META[c].description}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm text-muted">
              An A/B/C event below medium confidence does not enter the confirmed total.
            </p>
          </section>

          <section>
            <H>Source hierarchy</H>
            <p>Stronger sources are preferred, in this order:</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
              {SOURCE_HIERARCHY.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="mt-3 text-sm text-muted">
              Layoff trackers can help find events but do not by themselves establish that AI caused a
              reduction. Social media does not qualify unless it is an official statement from the
              company or an executive.
            </p>
          </section>

          <section>
            <H>US versus global counts</H>
            <p>
              Global and US headcounts are stored separately. If a company announces 10,000 cuts
              worldwide and only 4,000 US positions are established, we record 10,000 global and 4,000
              US — never assuming the remainder is American. When the US figure is unknown it is stored
              as unknown, not zero. Zero and unknown mean different things, and the site shows a dash
              for unknown.
            </p>
          </section>

          <section>
            <H>No double counting</H>
            <p>
              Aggregations count each reduction once. A multi-stage program is modelled either as one
              event or as separate stage events; a program container that has stage events is treated
              as context and is not summed alongside its stages. This rule is enforced in code and
              covered by tests.
            </p>
          </section>

          <section id="estimates">
            <H>Estimated figures</H>
            <p>
              Wage and household figures are clearly marked as estimates and shown with a leading
              &ldquo;~&rdquo;. They are rounded and should be read as orders of magnitude.
            </p>

            <h3 id="wages" className="mt-6 font-medium text-ink">
              Estimated annual wages (US only)
            </h3>
            <p className="mt-1">
              This is the annual wage represented by tracked cuts, not GDP loss or permanent economic
              damage. Workers may receive severance and unemployment benefits, and many find other
              work at higher or lower pay. Because our reference wages are US figures, we value{" "}
              <strong>only the verified US headcount</strong>. If a company announced a global figure
              without a US breakdown, that event is excluded from the wage total rather than valued
              with a US wage. For each covered event we use, in order: a known compensation figure for
              the affected group; otherwise a reference industry median; otherwise the national median,
              from the{" "}
              <span className="text-ink-soft">U.S. Bureau of Labor Statistics (OEWS)</span>. Because
              US-specific disclosure is rare, coverage is low and the resulting figures are floors, not
              totals — the homepage shows the coverage share.
            </p>

            <h3 id="households" className="mt-6 font-medium text-ink">
              Estimated household exposure (US only)
            </h3>
            <p className="mt-1">
              This multiplies the verified US headcount by the average US household size (
              {loadDataset().householdReference.averageHouseholdSize}, US Census ACS). Global jobs
              without a verified US allocation are excluded, because the household-size figure is
              US-specific. It is not a count of individually identified people and may double-count
              households that contain more than one affected worker.
            </p>
          </section>

          <section id="benchmarks">
            <H>Benchmarks and why they differ</H>
            <p>
              Independent organisations publish much larger AI-layoff totals. We show one on the
              homepage for context but never add it to our ledger, because the methodologies differ:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
              <li>
                Challenger, Gray &amp; Christmas counts <em>announced</em> US job cuts where an employer
                cited AI. It is announcement-based (not verified as executed), US-only, and
                self-reported by employers.
              </li>
              <li>
                jobloss.ai aggregates US AI-linked reports with its own inclusion rules.
              </li>
            </ul>
            <p className="mt-3">
              Our confirmed total is lower and deliberately so. The difference comes from events we
              excluded for insufficient causal evidence (for example, a company that laid off staff
              while investing in AI but did not attribute the cuts to AI, or one that explicitly said
              AI did not drive the decision), announced plans we hold as &ldquo;planned&rdquo; until
              executed, the global-versus-US scope difference, and smaller employers we have not yet
              reviewed. Our broader all-verified total (categories A–E) is closer but still
              conservative. If our number were far below a credible benchmark with no explanation, that
              would signal our research is incomplete — so we track that gap openly.
            </p>
          </section>

          <section>
            <H>Dating and coverage</H>
            <p>
              We separate two dates. <strong>Research coverage through</strong> is the date up to which
              events have been reviewed to this standard; it is the meaningful currency of the dataset.
              <strong> Repository updated</strong> is simply when the files last changed. A recent
              commit does not imply recent coverage. Validation fails the build if the stated coverage
              date predates the newest event, and warns when coverage falls far behind the current
              date.
            </p>
          </section>

          <section>
            <H>AI investment relationships</H>
            <p>
              An investment is only linked to a reduction with an explicit classification, from
              directly confirmed down to context only. Closeness in time is never enough to claim a
              directly confirmed relationship.
            </p>
          </section>

          <section>
            <H>Corrections and limitations</H>
            <p>
              Corrections are recorded and{" "}
              <Link href="/corrections" className="text-accent underline underline-offset-2">
                published
              </Link>
              ; the full edit history also lives in version control. This V1 dataset is a curated set
              of well-documented events, not a continuous or exhaustive feed. Absence from the dataset
              does not mean an event did not happen — only that it has not yet been reviewed to this
              standard.
            </p>
            <p className="mt-4 text-sm text-faint">
              Methodology version {meta.methodologyVersion}. Data through {formatDate(meta.dataThrough)}.
            </p>
          </section>
        </div>
      </Container>
    </>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-xl font-semibold text-ink">{children}</h2>;
}

function Example({ quote, verdict }: { quote: string; verdict: string }) {
  return (
    <div className="mt-4 border border-rule bg-surface p-4">
      <p className="text-sm italic text-ink-soft">&ldquo;{quote}&rdquo;</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-accent">{verdict}</p>
    </div>
  );
}
