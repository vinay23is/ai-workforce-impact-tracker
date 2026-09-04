import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/Page";
import { USTileMap } from "@/components/charts/USTileMap";
import { loadDataset } from "@/lib/data";
import { buildEventRows } from "@/lib/rows";

export const metadata: Metadata = {
  title: "Where AI-linked job cuts are happening",
  description:
    "A US tile-grid map of AI-linked workforce reductions. States are shaded only where geographic evidence exists.",
};

export default function MapPage() {
  const dataset = loadDataset();
  const rows = buildEventRows(dataset);
  const grid = dataset.geographicReference.states.map((s) => ({
    abbr: s.abbr,
    name: s.name,
    tileRow: s.tileRow,
    tileCol: s.tileCol,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Map"
        title="Where the cuts are"
        intro="A tile-grid map of the United States — one square per state. A state is shaded only when an event has specific geographic evidence for it. Nationwide reductions are not distributed across states, and non-US events are counted separately."
      />
      <Container className="py-8">
        <USTileMap rows={rows} grid={grid} />
      </Container>
    </>
  );
}
