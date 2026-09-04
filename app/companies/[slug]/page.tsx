import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { StatTile } from "@/components/ui/Metric";
import { AttributionBadge, ConfidenceBadge, StatusBadge } from "@/components/ui/badges";
import { InvestmentTimeline, type TimelineItem } from "@/components/charts/InvestmentTimeline";
import { loadDataset } from "@/lib/data";
import { getCompanyStats } from "@/lib/aggregations";
import { formatApproxCurrency, formatDate, formatInt } from "@/lib/formatting";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadDataset().companies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = loadDataset().companies.find((c) => c.slug === slug);
  if (!company) return {};
  return {
    title: `${company.name} — AI-linked workforce reductions`,
    description: `Documented AI-linked workforce reductions and AI investments at ${company.name}.`,
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dataset = loadDataset();
  const company = dataset.companies.find((c) => c.slug === slug);
  if (!company) notFound();

  const industry = dataset.industries.find((i) => i.id === company.industryId);
  const stats = getCompanyStats(dataset, company.id);
  const events = [...stats.events].sort((a, b) => b.announcementDate.localeCompare(a.announcementDate));
  const investments = dataset.investments.filter((i) => i.companyId === company.id);

  const timeline: TimelineItem[] = [
    ...stats.events.map((e) => ({
      id: e.id,
      date: e.announcementDate,
      kind: "event" as const,
      title: `${e.globalJobsLost !== null ? formatInt(e.globalJobsLost) + " roles" : "Reduction"} — ${e.summary.split(".")[0]}.`,
      detail: e.whyClassified,
      href: `/events/${e.slug}`,
      attributionLevel: e.attributionLevel,
    })),
    ...investments.map((inv) => ({
      id: inv.id,
      date: inv.announcementDate,
      kind: "investment" as const,
      title: `${inv.amount ? formatApproxCurrency(inv.amount) : "AI investment"} — ${inv.timePeriod}`,
      detail: inv.description,
    })),
  ];

  return (
    <>
      <div className="border-b border-rule">
        <Container className="py-8">
          <div className="mb-3 text-xs text-muted">
            <Link href="/companies" className="hover:text-accent">
              Companies
            </Link>
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {company.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            {industry && (
              <Link href={`/industries/${industry.slug}`} className="hover:text-accent">
                {industry.name}
              </Link>
            )}
            {company.ticker && <span className="tnum">{company.ticker}</span>}
            {company.headquarters && <span>{company.headquarters}</span>}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1 hover:text-accent"
              >
                Website <ExternalLink size={12} />
              </a>
            )}
          </div>
          <p className="mt-3 max-w-prose text-sm text-ink-soft">{company.description}</p>
        </Container>
      </div>

      <Container className="py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            value={stats.confirmedJobs > 0 ? formatInt(stats.confirmedJobs) : "—"}
            label="Confirmed AI cuts"
          />
          <StatTile
            value={stats.aiLinkedJobs > 0 ? formatInt(stats.aiLinkedJobs) : "—"}
            label="All AI-linked"
          />
          <StatTile
            value={stats.plannedJobs > 0 ? formatInt(stats.plannedJobs) : "—"}
            label="Planned (not counted)"
          />
          <StatTile
            value={
              company.latestKnownWorkforce ? formatInt(company.latestKnownWorkforce) : "—"
            }
            label="Known workforce"
            sub={company.workforceAsOf ? `as of ${formatDate(company.workforceAsOf)}` : undefined}
          />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Tracked events
            </h2>
            <ul className="mt-4 space-y-4">
              {events.map((e) => (
                <li key={e.id} className="border-t border-rule pt-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <Link href={`/events/${e.slug}`} className="font-medium hover:text-accent hover:underline">
                      {e.globalJobsLost !== null ? `${formatInt(e.globalJobsLost)} roles` : "Headcount not disclosed"}
                    </Link>
                    <span className="text-xs text-muted tnum">{formatDate(e.announcementDate)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <AttributionBadge level={e.attributionLevel} />
                    <ConfidenceBadge confidence={e.confidence} />
                    {e.status !== "executed" && <StatusBadge status={e.status} />}
                  </div>
                  <p className="mt-2 max-w-prose text-sm text-ink-soft">{e.summary}</p>
                </li>
              ))}
            </ul>
          </div>

          <aside>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              AI investment and workforce timeline
            </h2>
            <div className="mt-4">
              <InvestmentTimeline items={timeline} />
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
