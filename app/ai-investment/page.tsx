import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader, SectionHeading } from "@/components/ui/Page";
import { StatTile } from "@/components/ui/Metric";
import { AttributionBadge } from "@/components/ui/badges";
import { loadDataset } from "@/lib/data";
import {
  getCapitalReallocationEvents,
  getCountableEvents,
  sumJobs,
} from "@/lib/aggregations";
import { INVESTMENT_RELATIONSHIP_META } from "@/lib/attribution";
import { formatApproxCurrency, formatDate, formatInt } from "@/lib/formatting";

export const metadata: Metadata = {
  title: "AI investment and workforce reductions",
  description:
    "Tracked AI investments shown alongside workforce reductions, with the relationship between them classified rather than assumed.",
};

const INVESTMENT_TYPE_LABELS: Record<string, string> = {
  ai_infrastructure: "AI infrastructure",
  data_centers: "Data centers",
  chips: "Chips",
  ai_rd: "AI R&D",
  ai_acquisition: "AI acquisition",
  model_development: "Model development",
  ai_hiring: "AI hiring",
  cloud_infrastructure: "Cloud infrastructure",
  other: "Other",
};

export default function AIInvestmentPage() {
  const dataset = loadDataset();
  const investments = [...dataset.investments].sort((a, b) =>
    b.announcementDate.localeCompare(a.announcementDate),
  );

  const disclosedTotal = investments.reduce((sum, i) => sum + (i.amount ?? 0), 0);
  const disclosedCount = investments.filter((i) => i.amount !== null).length;
  const investingCompanyIds = new Set(investments.map((i) => i.companyId));

  const reductionsAtInvestingCompanies = sumJobs(
    getCountableEvents(dataset.events).filter((e) => investingCompanyIds.has(e.companyId)),
    "global",
  ).jobs;

  const reallocationEvents = getCapitalReallocationEvents(dataset);
  const reallocationJobs = sumJobs(reallocationEvents, "global").jobs;

  return (
    <>
      <PageHeader
        eyebrow="AI Investment"
        title="Investment and workforce reductions"
        intro="Large AI investments and workforce reductions often happen at the same companies. That co-occurrence is not proof that one funded the other. These figures are kept separate on purpose."
      />
      <Container className="py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            value={formatApproxCurrency(disclosedTotal)}
            label="Tracked disclosed AI investment"
            sub={`${disclosedCount} disclosed figure${disclosedCount === 1 ? "" : "s"} across ${investingCompanyIds.size} companies`}
          />
          <StatTile
            value={formatInt(reductionsAtInvestingCompanies)}
            label="Reductions at companies with tracked AI investment"
            sub="Includes context-only cases; not attributed to the investment"
          />
          <StatTile
            value={formatInt(reallocationJobs)}
            label="Reductions explicitly tied to AI reallocation"
            sub="Category D only"
          />
        </div>

        <p className="mt-4 max-w-prose text-sm text-muted">
          The middle figure is deliberately not called &ldquo;jobs cut to fund AI.&rdquo; Establishing
          that a specific reduction paid for a specific investment requires the company to say so. See{" "}
          <Link href="/methodology" className="text-accent underline underline-offset-2">
            the methodology
          </Link>{" "}
          for how these relationships are classified.
        </p>

        <section className="mt-12">
          <SectionHeading>Tracked AI investments</SectionHeading>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-3 font-medium">Company</th>
                  <th className="py-2 pr-3 font-medium">Amount</th>
                  <th className="py-2 pr-3 font-medium">Period</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => {
                  const company = dataset.companies.find((c) => c.id === inv.companyId);
                  return (
                    <tr key={inv.id} className="border-b border-rule align-top">
                      <td className="py-3 pr-3">
                        {company ? (
                          <Link href={`/companies/${company.slug}`} className="font-medium hover:text-accent">
                            {company.name}
                          </Link>
                        ) : (
                          inv.companyId
                        )}
                      </td>
                      <td className="py-3 pr-3 tnum">
                        {inv.amount ? formatApproxCurrency(inv.amount) : "Undisclosed"}
                      </td>
                      <td className="py-3 pr-3 text-ink-soft">{inv.timePeriod}</td>
                      <td className="py-3 pr-3 text-ink-soft">
                        {INVESTMENT_TYPE_LABELS[inv.investmentType] ?? inv.investmentType}
                      </td>
                      <td className="max-w-md py-3 pr-3 text-muted">{inv.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <SectionHeading>Cuts explicitly tied to AI reallocation</SectionHeading>
          <p className="mb-4 mt-2 max-w-prose text-sm text-muted">
            Category D: the company said it was reducing workforce cost and shifting resources toward
            AI. This does not mean AI performed the eliminated jobs.
          </p>
          <ul className="space-y-4">
            {reallocationEvents.map((e) => {
              const company = dataset.companies.find((c) => c.id === e.companyId);
              return (
                <li key={e.id} className="border-t border-rule pt-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <Link href={`/events/${e.slug}`} className="font-medium hover:text-accent hover:underline">
                      {company?.name} — {e.globalJobsLost !== null ? `${formatInt(e.globalJobsLost)} roles` : "headcount not disclosed"}
                    </Link>
                    <span className="text-xs text-muted tnum">{formatDate(e.announcementDate)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <AttributionBadge level={e.attributionLevel} />
                    <span className="text-xs text-faint">
                      {INVESTMENT_RELATIONSHIP_META[e.investmentRelationship].label}
                    </span>
                  </div>
                  <p className="mt-2 max-w-prose text-sm text-ink-soft">{e.summary}</p>
                </li>
              );
            })}
          </ul>
        </section>
      </Container>
    </>
  );
}
