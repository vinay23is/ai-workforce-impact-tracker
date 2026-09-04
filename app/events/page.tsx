import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/Page";
import { EventsExplorer } from "@/components/data/EventsExplorer";
import { loadDataset } from "@/lib/data";
import { buildEventRows } from "@/lib/rows";

export const metadata: Metadata = {
  title: "Tracker — AI-linked workforce reductions",
  description:
    "A filterable list of documented workforce reductions with credible links to AI, with attribution and confidence for each event.",
};

export default function EventsPage() {
  const dataset = loadDataset();
  const rows = buildEventRows(dataset);

  return (
    <>
      <PageHeader
        eyebrow="Tracker"
        title="Documented events"
        intro="Every record links AI to a workforce reduction with at least one source. Filter by attribution, confidence, industry, and location. A dash means the headcount was not disclosed — which is different from zero."
      />
      <Container className="py-8">
        <EventsExplorer rows={rows} />
      </Container>
    </>
  );
}
