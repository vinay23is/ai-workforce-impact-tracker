import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { HeadlineMetric, SecondaryMetric, StatTile } from "@/components/ui/Metric";
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
    .slice(0, 10)
    .map((g) => ({
      key: g.key,
      label: g.label,
      value: g.aiLinkedJobs,
      confirmedValue: g.confirmedJobs,
      href: `/companies/${g.key}`,
    }));

  const benchmark = stats.primaryBenchmark;

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
                Across {formatInt(stats.confirmed.events)} verified events at{" "}
                {formatInt(stats.confirmedCompanies)} companies (categories A–C, executed or in
                progress). Every counted event has a source explicitly linking AI to the decision.
              </p>
              <p className="mt-3">
                A broader, still-verified total and an independent industry benchmark are below.{" "}
                <Link href="/methodology" className="text-accent underline underline-offset-2">
                  How we classify
                </Link>
                .
              </p>
              <p className="mt-4 text-xs text-faint">
                Research coverage through {formatDate(stats.dataThrough)} · Repository updated{" "}
                {formatDate(stats.lastDatasetUpdate)}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-rule">
        <Container className="py-10">
          <SectionHeading>Verified ledger</SectionHeading>
          <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            <SecondaryMetric
              value={formatInt(stats.allLinked.jobs)}
              label="All verified AI-linked cuts"
              note="Categories A–E, executed. Includes capital reallocation and reported connections; excludes context-only."
            />
            <SecondaryMetric
              value={formatInt(stats.direct.jobs)}
              label="Direct AI replacement"
              note="Category A: AI performs work people previously did."
            />
            <SecondaryMetric
              value={formatInt(stats.capital.jobs)}
              label="AI capital reallocation"
              note="Category D: cuts tied to shifting money toward AI. Not AI performing the jobs."
            />
            <SecondaryMetric
              value={formatInt(stats.planned.jobs)}
              label="Announced / planned"
              note="AI-attributed reductions stated as future targets. Kept out of the executed totals."
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-xs text-faint">
            <span>{formatInt(stats.companiesTracked)} companies tracked</span>
            <span>{stats.industriesAffected} industries</span>
            <span>{stats.countriesCount} countries</span>
            <span>{formatInt(stats.confirmed.events)} confirmed of {formatInt(stats.coverage.trackedEvents)} tracked events</span>
          </div>
        </Container>
      </section>

      {benchmark && (
        <section className="border-b border-rule bg-surface">
          <Container className="py-10">
            <SectionHeading>Independent US benchmark</SectionHeading>
            <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-12">
              <div>
                <div className="tnum font-serif text-5xl font-semibold sm:text-6xl">
                  {formatInt(benchmark.jobs)}
                </div>
                <p className="mt-2 max-w-xs text-sm font-medium text-ink-soft">
                  {benchmark.metric}, {new Date(benchmark.periodStart).getUTCFullYear()} through
                  August
                </p>
                <p className="mt-1 text-xs text-muted">Source: {benchmark.publisher}</p>
              </div>
              <div className="max-w-prose text-sm leading-relaxed text-muted">
                <p>
                  This benchmark uses a different methodology and counts announced US job cuts where
                  employers cited AI. It is shown for context and is{" "}
                  <strong className="font-semibold text-ink-soft">not</strong> added to this
                  site&apos;s verified-event totals.
                </p>
                <p className="mt-3">
                  Our verified confirmed total ({formatInt(stats.confirmed.jobs)}) is lower and
                  spans 2023–2026 globally; the benchmark is US-only, announcement-based, and 2026
                  only. The gap reflects events we excluded for insufficient causal evidence,
                  announced plans not yet executed, and smaller employers we have not yet reviewed.{" "}
                  <Link href="/methodology#benchmarks" className="text-accent underline underline-offset-2">
                    Why the numbers differ
                  </Link>
                  .
                </p>
              </div>
            </div>
          </Container>
        </section>
      )}

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

      <section className="border-b border-rule">
        <Container className="py-10">
          <SectionHeading>Data quality &amp; coverage</SectionHeading>
          <p className="mb-6 mt-2 max-w-prose text-sm text-muted">
            Where the dataset is thin, we show it. Coverage is curated, not exhaustive — absence
            from the dataset means an event has not yet been reviewed to this standard.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile value={formatInt(stats.coverage.trackedEvents)} label="Tracked events" />
            <StatTile value={formatInt(stats.coverage.companiesRepresented)} label="Companies" />
            <StatTile value={formatDate(stats.dataThrough)} label="Coverage through" />
            <StatTile value={formatInt(stats.coverage.unknownUsHeadcount)} label="Unknown US headcount" />
            <StatTile value={formatInt(stats.coverage.secondaryOnly)} label="Secondary-source only" />
            <StatTile
              value={`${stats.wage.coveragePct}%`}
              label="Confirmed jobs with US data"
              sub="basis for US wage/household"
            />
          </div>
          <p className="mt-4 max-w-prose text-xs text-muted">
            US-specific estimates cover only the {stats.wage.coveragePct}% of confirmed cuts with a
            disclosed US headcount. On that basis, estimated US annual wages represented are{" "}
            {formatApproxCurrency(stats.wage.totalAnnualWages)} and estimated people in affected US
            worker households are {formatApproxCount(stats.household.people)}. Most companies announce
            global figures without a US breakdown, so these are floors, not totals.{" "}
            <Link href="/methodology#estimates" className="underline">
              Method
            </Link>
            .
          </p>
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
