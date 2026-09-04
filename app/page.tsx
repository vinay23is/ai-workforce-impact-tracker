import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { HeadlineMetric, SecondaryMetric } from "@/components/ui/Metric";
import { SectionHeading } from "@/components/ui/Page";
import { CumulativeChart, type ChartSeries } from "@/components/charts/CumulativeChart";
import { BarList } from "@/components/charts/BarList";
import { loadDataset } from "@/lib/data";
import { getSiteStats } from "@/lib/stats";
import {
  getAllAILinkedEvents,
  getCapitalReallocationEvents,
  getConfirmedEvents,
  getDirectReplacementEvents,
  getJobsByCompany,
  getJobsByIndustry,
  getTimeline,
} from "@/lib/aggregations";
import {
  formatApproxCount,
  formatApproxCurrency,
  formatDate,
  formatInt,
} from "@/lib/formatting";
import { attributionColorVar } from "@/lib/attribution";

export default function HomePage() {
  const dataset = loadDataset();
  const stats = getSiteStats(dataset);

  const toPoints = (events: ReturnType<typeof getConfirmedEvents>) =>
    getTimeline(events, dataset, "global").map((p) => ({
      date: p.date,
      cumulative: p.cumulative,
      added: p.added,
      companyName: p.companyName,
      level: p.attributionLevel,
    }));

  const series: ChartSeries[] = [
    { key: "confirmed", label: "Confirmed", colorVar: "var(--accent)", points: toPoints(getConfirmedEvents(dataset)) },
    { key: "linked", label: "All AI-linked", colorVar: "var(--attr-e)", points: toPoints(getAllAILinkedEvents(dataset)) },
    { key: "direct", label: "Direct replacement", colorVar: attributionColorVar("A"), points: toPoints(getDirectReplacementEvents(dataset)) },
    { key: "capital", label: "Capital reallocation", colorVar: attributionColorVar("D"), points: toPoints(getCapitalReallocationEvents(dataset)) },
  ];

  const industries = getJobsByIndustry(dataset).map((g) => ({
    key: g.key,
    label: g.label,
    value: g.aiLinkedJobs,
    confirmedValue: g.confirmedJobs,
    href: `/industries/${g.key}`,
    meta: `${g.events} ${g.events === 1 ? "event" : "events"}`,
  }));

  const companies = getJobsByCompany(dataset)
    .slice(0, 8)
    .map((g) => ({
      key: g.key,
      label: g.label,
      value: g.aiLinkedJobs,
      confirmedValue: g.confirmedJobs,
      href: `/companies/${g.key}`,
    }));

  return (
    <>
      <section className="border-b border-rule">
        <Container className="py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            AI Workforce Impact
          </p>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <HeadlineMetric
              value={formatInt(stats.confirmed.jobs)}
              label="Confirmed AI-attributed job cuts"
              description="Publicly documented workforce reductions where available evidence explicitly connects AI to the decision. This is the most conservative count on the site."
            />
            <div className="text-sm text-muted">
              <p>
                Across {formatInt(stats.confirmed.events)} events at{" "}
                {formatInt(stats.companiesTracked)} companies. One event with an undisclosed
                headcount is counted but adds no jobs.
              </p>
              <p className="mt-3">
                Every counted event has at least one source explicitly linking AI to the workforce
                decision.{" "}
                <Link href="/methodology" className="text-accent underline underline-offset-2">
                  How we classify
                </Link>
                .
              </p>
              <p className="mt-4 text-xs text-faint">
                Data through {formatDate(stats.dataThrough)} · Last dataset update{" "}
                {formatDate(stats.lastDatasetUpdate)}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-rule">
        <Container className="py-10">
          <SectionHeading>The numbers in context</SectionHeading>
          <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <SecondaryMetric
              value={formatInt(stats.allLinked.jobs)}
              label="All AI-linked cuts"
              note={
                <>
                  Broader set including capital reallocation and reported connections (categories
                  A–E). Excludes context-only cases.
                </>
              }
            />
            <SecondaryMetric
              value={formatInt(stats.direct.jobs)}
              label="Direct AI replacement"
              note="Roles where AI performs work people previously did (category A)."
            />
            <SecondaryMetric
              value={formatInt(stats.capital.jobs)}
              label="AI capital-reallocation cuts"
              note="Cuts tied to shifting money toward AI. This does not mean AI performed the jobs (category D)."
            />
            <SecondaryMetric
              value={formatApproxCurrency(stats.wage.totalAnnualWages)}
              label="Estimated annual wages represented"
              estimated
              note={
                <>
                  Rough estimate for confirmed cuts using reference wages, not permanent economic
                  loss.{" "}
                  <Link href="/methodology#wages" className="underline underline-offset-2">
                    Method
                  </Link>
                  .
                </>
              }
            />
            <SecondaryMetric
              value={formatApproxCount(stats.household.people)}
              label="People in affected worker households"
              estimated
              note={
                <>
                  Confirmed cuts × average US household size ({stats.household.averageHouseholdSize}).
                  Not a count of identified people; may double-count.{" "}
                  <Link href="/methodology#households" className="underline underline-offset-2">
                    Method
                  </Link>
                  .
                </>
              }
            />
            <SecondaryMetric
              value={formatInt(stats.planned.jobs)}
              label="Announced but not yet executed"
              note="AI-attributed reductions stated as future targets. Kept out of the executed totals above."
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-xs text-faint">
            <span>{formatInt(stats.companiesTracked)} companies tracked</span>
            <span>{stats.industriesAffected} industries</span>
            <span>{stats.countriesCount} countries</span>
            <span>US-specific counts not separately disclosed for most events</span>
          </div>
        </Container>
      </section>

      <section className="border-b border-rule">
        <Container className="py-10">
          <div className="flex items-baseline justify-between">
            <SectionHeading>Cumulative cuts over time</SectionHeading>
            <Link href="/events" className="text-xs text-accent hover:underline">
              See all events
            </Link>
          </div>
          <div className="mt-6">
            <CumulativeChart series={series} />
          </div>
        </Container>
      </section>

      <section className="border-b border-rule">
        <Container className="py-10">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <div className="flex items-baseline justify-between">
                <SectionHeading>By industry</SectionHeading>
                <Link href="/industries" className="text-xs text-accent hover:underline">
                  Industries
                </Link>
              </div>
              <p className="mb-4 mt-2 text-xs text-muted">
                Darker segment is the confirmed subset; lighter is all AI-linked.
              </p>
              <BarList items={industries} />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <SectionHeading>Largest tracked reductions</SectionHeading>
                <Link href="/companies" className="text-xs text-accent hover:underline">
                  Companies
                </Link>
              </div>
              <p className="mb-4 mt-2 text-xs text-muted">By AI-linked headcount, top companies.</p>
              <BarList items={companies} />
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <HomeLink href="/methodology" title="Methodology" text="What counts, what does not, and why." />
            <HomeLink href="/ai-investment" title="AI investment" text="Where cuts sit alongside AI spending — and where evidence stops." />
            <HomeLink href="/data" title="Download the data" text="CSV and JSON. Reproducible statistics." />
            <HomeLink href="/resources" title="Worker resources" text="Neutral links to public support programs." />
          </div>
        </Container>
      </section>
    </>
  );
}

function HomeLink({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} className="group border-t border-ink pt-3">
      <div className="flex items-center justify-between">
        <span className="font-serif text-lg font-semibold">{title}</span>
        <ArrowRight
          size={16}
          className="text-faint transition-transform group-hover:translate-x-1 group-hover:text-accent"
        />
      </div>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </Link>
  );
}
