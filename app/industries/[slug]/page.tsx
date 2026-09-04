import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { StatTile } from "@/components/ui/Metric";
import { AttributionBadge, ConfidenceBadge } from "@/components/ui/badges";
import { loadDataset } from "@/lib/data";
import {
  getCountableEvents,
  isAILinked,
  isConfirmed,
  isCounted,
  sumJobs,
} from "@/lib/aggregations";
import { formatDate, formatInt } from "@/lib/formatting";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadDataset().industries.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = loadDataset().industries.find((i) => i.slug === slug);
  if (!industry) return {};
  return {
    title: `AI job cuts in ${industry.name}`,
    description: `Documented AI-linked workforce reductions in ${industry.name}.`,
  };
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dataset = loadDataset();
  const industry = dataset.industries.find((i) => i.slug === slug);
  if (!industry) notFound();

  const companyIds = new Set(
    dataset.companies.filter((c) => c.industryId === industry.id).map((c) => c.id),
  );
  const events = getCountableEvents(dataset.events)
    .filter((e) => companyIds.has(e.companyId))
    .sort((a, b) => b.announcementDate.localeCompare(a.announcementDate));

  const confirmed = sumJobs(
    events.filter((e) => isCounted(e) && isConfirmed(e, dataset.sources)),
    "global",
  ).jobs;
  const linked = sumJobs(events.filter((e) => isCounted(e) && isAILinked(e)), "global").jobs;
  const companies = [...new Set(events.map((e) => e.companyId))];

  return (
    <>
      <div className="border-b border-rule">
        <Container className="py-8">
          <div className="mb-3 text-xs text-muted">
            <Link href="/industries" className="hover:text-accent">
              Industries
            </Link>
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {industry.name}
          </h1>
          <p className="mt-3 max-w-prose text-sm text-ink-soft">{industry.description}</p>
        </Container>
      </div>

      <Container className="py-8">
        {events.length === 0 ? (
          <p className="text-sm text-muted">No AI-linked events recorded in this industry yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile value={confirmed > 0 ? formatInt(confirmed) : "—"} label="Confirmed AI cuts" />
              <StatTile value={linked > 0 ? formatInt(linked) : "—"} label="All AI-linked" />
              <StatTile value={String(events.length)} label="Events" />
              <StatTile value={String(companies.length)} label="Companies" />
            </div>

            <ul className="mt-10 space-y-4">
              {events.map((e) => {
                const company = dataset.companies.find((c) => c.id === e.companyId);
                return (
                  <li key={e.id} className="border-t border-rule pt-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <Link href={`/events/${e.slug}`} className="font-medium hover:text-accent hover:underline">
                        {company?.name} —{" "}
                        {e.globalJobsLost !== null ? `${formatInt(e.globalJobsLost)} roles` : "headcount not disclosed"}
                      </Link>
                      <span className="text-xs text-muted tnum">{formatDate(e.announcementDate)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <AttributionBadge level={e.attributionLevel} />
                      <ConfidenceBadge confidence={e.confidence} />
                    </div>
                    <p className="mt-2 max-w-prose text-sm text-ink-soft">{e.summary}</p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Container>
    </>
  );
}
