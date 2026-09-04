import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { AttributionBadge, ConfidenceBadge, StatusBadge } from "@/components/ui/badges";
import { SourceList } from "@/components/ui/SourceList";
import { loadDataset, getSourcesForEvent } from "@/lib/data";
import { estimateEventWage, getEstimatedHouseholdExposure } from "@/lib/estimates";
import {
  ATTRIBUTION_META,
  INVESTMENT_RELATIONSHIP_META,
} from "@/lib/attribution";
import {
  formatApproxCount,
  formatApproxCurrency,
  formatDate,
  formatInt,
  formatPercent,
} from "@/lib/formatting";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadDataset()
    .events.filter((e) => e.published)
    .map((e) => ({ slug: e.slug }));
}

function getEvent(slug: string) {
  const dataset = loadDataset();
  const event = dataset.events.find((e) => e.slug === slug && e.published);
  return event ? { dataset, event } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = getEvent(slug);
  if (!found) return {};
  const { dataset, event } = found;
  const company = dataset.companies.find((c) => c.id === event.companyId);
  return {
    title: `${company?.name ?? "Event"}: AI-linked workforce reduction`,
    description: event.summary.slice(0, 155),
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = getEvent(slug);
  if (!found) notFound();
  const { dataset, event } = found;

  const company = dataset.companies.find((c) => c.id === event.companyId);
  const industry = company
    ? dataset.industries.find((i) => i.id === company.industryId)
    : undefined;
  const sources = getSourcesForEvent(dataset, event.id);
  const wage = estimateEventWage(event, company, dataset.wageReference);
  const corrections = dataset.corrections.filter((c) => c.eventId === event.id);
  const investments = dataset.investments.filter((i) =>
    event.relatedInvestmentIds.includes(i.id),
  );
  const attributionMeta = ATTRIBUTION_META[event.attributionLevel];

  // Household exposure is US-only: the average household size is a US figure.
  const household =
    event.usJobsLost !== null
      ? getEstimatedHouseholdExposure(event.usJobsLost, dataset.householdReference.averageHouseholdSize)
      : null;

  return (
    <>
      <div className="border-b border-rule">
        <Container className="py-8">
          <div className="mb-3 text-xs text-muted">
            <Link href="/events" className="hover:text-accent">
              Tracker
            </Link>{" "}
            / {company?.name}
          </div>
          <h1 className="max-w-prose font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {company?.name}: {attributionMeta.label.toLowerCase()}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {company && (
              <Link href={`/companies/${company.slug}`} className="hover:text-accent">
                {company.name}
              </Link>
            )}
            {industry && (
              <Link href={`/industries/${industry.slug}`} className="text-ink-soft hover:text-accent">
                {industry.name}
              </Link>
            )}
            <span className="text-muted tnum">Announced {formatDate(event.announcementDate)}</span>
            <AttributionBadge level={event.attributionLevel} />
            <ConfidenceBadge confidence={event.confidence} />
            <StatusBadge status={event.status} />
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_18rem] lg:items-start">
          <div className="max-w-prose">
            <Section title="What happened">
              <p>{event.summary}</p>
            </Section>

            <Section title="Why we classify this as AI-linked">
              <p>{event.whyClassified}</p>
              <p className="mt-3 rounded-sm border border-rule bg-surface p-3 text-sm text-muted">
                <span className="font-medium text-ink-soft">
                  {event.attributionLevel} — {attributionMeta.label}.
                </span>{" "}
                {attributionMeta.description}
              </p>
            </Section>

            {event.whatWeKnow.length > 0 && (
              <Section title="What we know">
                <ul className="list-disc space-y-1.5 pl-5">
                  {event.whatWeKnow.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="What we don't know">
              <ul className="list-disc space-y-1.5 pl-5">
                {event.whatWeDontKnow.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Section>

            {(event.aiInvestmentContext || investments.length > 0) && (
              <Section title="AI investment context">
                {event.aiInvestmentContext && <p>{event.aiInvestmentContext}</p>}
                {investments.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {investments.map((inv) => (
                      <li key={inv.id} className="text-sm text-ink-soft">
                        {inv.amount ? formatApproxCurrency(inv.amount) : "Undisclosed amount"} —{" "}
                        {inv.description}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-faint">
                  Relationship to the reduction:{" "}
                  {INVESTMENT_RELATIONSHIP_META[event.investmentRelationship].label} —{" "}
                  {INVESTMENT_RELATIONSHIP_META[event.investmentRelationship].description}
                </p>
              </Section>
            )}

            {event.occupations.length > 0 && (
              <Section title="Occupations affected">
                <ul className="space-y-1 text-sm">
                  {event.occupations.map((occ, i) => (
                    <li key={i}>
                      {occ.title}
                      {occ.jobs !== null && <span className="text-muted"> — {formatInt(occ.jobs)}</span>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Sources">
              <SourceList sources={sources} />
            </Section>

            {corrections.length > 0 && (
              <Section title="Corrections">
                <ul className="space-y-3">
                  {corrections.map((c) => (
                    <li key={c.id} className="border-t border-rule pt-3 text-sm">
                      <p className="text-xs text-muted tnum">{formatDate(c.date)} · {c.field}</p>
                      <p className="mt-1">{c.reason}</p>
                      <p className="mt-1 text-muted">
                        <span className="line-through">{c.oldValue}</span> → {c.newValue}
                      </p>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {event.notes && (
              <p className="mt-8 border-t border-rule pt-4 text-xs text-faint">
                Editor&apos;s note: {event.notes}
              </p>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20">
            <div className="border border-rule bg-surface p-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Key numbers
              </h2>
              <dl className="mt-3 space-y-3">
                <NumberRow
                  label="Global jobs"
                  value={event.globalJobsLost === null ? "Not disclosed" : formatInt(event.globalJobsLost)}
                  estimated={event.jobsEstimated && event.globalJobsLost !== null}
                />
                <NumberRow
                  label="US jobs"
                  value={event.usJobsLost === null ? "Not disclosed" : formatInt(event.usJobsLost)}
                />
                {event.percentageWorkforce !== null && (
                  <NumberRow label="Share of workforce" value={formatPercent(event.percentageWorkforce)} />
                )}
                {wage && (
                  <NumberRow
                    label="Est. US annual wages"
                    value={formatApproxCurrency(wage.estimatedAnnualWage)}
                    estimated
                  />
                )}
                {household && (
                  <NumberRow
                    label="Est. US household exposure"
                    value={`${formatApproxCount(household.people)} people`}
                    estimated
                  />
                )}
              </dl>
              {(wage || household) && (
                <p className="mt-3 border-t border-rule pt-2 text-[11px] leading-relaxed text-faint">
                  Estimates use{" "}
                  {wage?.method === "known_compensation"
                    ? "a known compensation figure"
                    : "reference wages"}{" "}
                  and average household size.{" "}
                  <Link href="/methodology#estimates" className="underline">
                    Method
                  </Link>
                  .
                </p>
              )}
            </div>

            {event.locations.length > 0 && (
              <div className="border border-rule bg-surface p-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Locations
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {event.locations.map((loc, i) => (
                    <li key={i}>
                      <span className="font-medium">
                        {loc.country}
                        {loc.state ? ` · ${loc.state}` : ""}
                        {loc.city ? ` · ${loc.city}` : ""}
                      </span>
                      {loc.jobs !== null && (
                        <span className="text-muted"> — {formatInt(loc.jobs)} jobs</span>
                      )}
                      {loc.note && <p className="text-xs text-faint">{loc.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </Container>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">{title}</h2>
      <div className="text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

function NumberRow({
  label,
  value,
  estimated = false,
}: {
  label: string;
  value: string;
  estimated?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-sm text-muted">
        {label}
        {estimated && <span className="ml-1 text-[10px] uppercase text-faint">est</span>}
      </dt>
      <dd className="tnum text-right text-sm font-medium">{value}</dd>
    </div>
  );
}
