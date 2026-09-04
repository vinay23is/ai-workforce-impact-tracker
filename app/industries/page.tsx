import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/Page";
import { BarList } from "@/components/charts/BarList";
import { loadDataset } from "@/lib/data";
import { getJobsByIndustry } from "@/lib/aggregations";

export const metadata: Metadata = {
  title: "AI-linked job cuts by industry",
  description: "Documented AI-linked workforce reductions grouped by industry.",
};

export default function IndustriesPage() {
  const dataset = loadDataset();
  const groups = getJobsByIndustry(dataset);
  const items = groups.map((g) => ({
    key: g.key,
    label: g.label,
    value: g.aiLinkedJobs,
    confirmedValue: g.confirmedJobs,
    href: `/industries/${g.key}`,
    meta: `${g.events} ${g.events === 1 ? "event" : "events"}`,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Industries"
        title="By industry"
        intro="A controlled set of industries. The darker bar segment is the confirmed subset; the lighter segment is all AI-linked cuts. Only industries with tracked events appear."
      />
      <Container className="py-8">
        <div className="max-w-2xl">
          <BarList items={items} />
        </div>
      </Container>
    </>
  );
}
