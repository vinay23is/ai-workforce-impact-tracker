import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/Page";
import { loadDataset } from "@/lib/data";
import { getJobsByCompany } from "@/lib/aggregations";
import { formatInt } from "@/lib/formatting";

export const metadata: Metadata = {
  title: "Companies tracked for AI-linked job cuts",
  description:
    "Companies with documented workforce reductions linked to AI, with confirmed and broader AI-linked headcounts.",
};

export default function CompaniesPage() {
  const dataset = loadDataset();
  const groups = getJobsByCompany(dataset);

  return (
    <>
      <PageHeader
        eyebrow="Companies"
        title="Companies tracked"
        intro="Ordered by AI-linked headcount. Confirmed is the conservative subset; AI-linked is broader. A dash means no headcount was disclosed for that company's events."
      />
      <Container className="py-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 font-medium">Company</th>
                <th className="py-2 pr-3 font-medium">Industry</th>
                <th className="py-2 pr-3 text-right font-medium">Events</th>
                <th className="py-2 pr-3 text-right font-medium">Confirmed</th>
                <th className="py-2 pr-3 text-right font-medium">All AI-linked</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const company = dataset.companies.find((c) => c.slug === g.key);
                const industry = company
                  ? dataset.industries.find((i) => i.id === company.industryId)
                  : undefined;
                return (
                  <tr key={g.key} className="border-b border-rule hover:bg-surface">
                    <td className="py-3 pr-3">
                      <Link href={`/companies/${g.key}`} className="font-medium hover:text-accent hover:underline">
                        {g.label}
                      </Link>
                    </td>
                    <td className="py-3 pr-3 text-ink-soft">
                      {industry ? (
                        <Link href={`/industries/${industry.slug}`} className="hover:text-accent">
                          {industry.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 pr-3 text-right tnum text-ink-soft">{g.events}</td>
                    <td className="py-3 pr-3 text-right tnum font-medium">
                      {g.confirmedJobs > 0 ? formatInt(g.confirmedJobs) : "—"}
                    </td>
                    <td className="py-3 pr-3 text-right tnum">
                      {g.aiLinkedJobs > 0 ? formatInt(g.aiLinkedJobs) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Container>
    </>
  );
}
