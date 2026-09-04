import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader, SectionHeading } from "@/components/ui/Page";
import { CsvDownload } from "@/components/data/CsvDownload";
import { loadDataset } from "@/lib/data";
import { buildEventRows } from "@/lib/rows";
import { formatDate } from "@/lib/formatting";

export const metadata: Metadata = {
  title: "Data",
  description:
    "Download the dataset as CSV, or use the static JSON files as a simple public API. Reproducible statistics with version metadata.",
};

const JSON_ENDPOINTS = [
  { path: "/generated/stats.json", label: "Aggregate statistics" },
  { path: "/generated/events.json", label: "Events (flattened, with sources)" },
  { path: "/generated/companies.json", label: "Companies" },
  { path: "/generated/industries.json", label: "Industries" },
  { path: "/generated/investments.json", label: "AI investments" },
  { path: "/generated/corrections.json", label: "Corrections" },
  { path: "/generated/timeline.json", label: "Cumulative timelines" },
];

export default function DataPage() {
  const dataset = loadDataset();
  const rows = buildEventRows(dataset);

  return (
    <>
      <PageHeader
        eyebrow="Data"
        title="Download and reuse"
        intro="The full dataset lives in version-controlled JSON in the repository. These files are generated at build time and include version metadata so statistics stay reproducible."
      />
      <Container className="py-8">
        <div className="max-w-prose space-y-10">
          <section>
            <SectionHeading>CSV</SectionHeading>
            <p className="mb-4 mt-2 text-sm text-muted">
              One row per event. Unknown values are blank, which means not disclosed — not zero.
            </p>
            <CsvDownload rows={rows} />
          </section>

          <section>
            <SectionHeading>Static JSON</SectionHeading>
            <p className="mb-4 mt-2 text-sm text-muted">
              No API keys, no server code — just static files served from the CDN. Each includes a{" "}
              <code className="rounded bg-surface px-1 text-xs">generatedAt</code> timestamp and{" "}
              <code className="rounded bg-surface px-1 text-xs">methodologyVersion</code>.
            </p>
            <ul className="divide-y divide-rule border-y border-rule">
              {JSON_ENDPOINTS.map((e) => (
                <li key={e.path} className="flex items-baseline justify-between gap-3 py-2.5">
                  <span className="text-sm text-ink-soft">{e.label}</span>
                  <a
                    href={e.path}
                    className="font-mono text-xs text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {e.path}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionHeading>Version</SectionHeading>
            <p className="mt-2 text-sm text-muted">
              Methodology v{dataset.meta.methodologyVersion} · Data through{" "}
              {formatDate(dataset.meta.dataThrough)} · Last update{" "}
              {formatDate(dataset.meta.lastDatasetUpdate)}. The methodology version increments when the
              rules that produce these numbers materially change, so historical figures remain
              interpretable.
            </p>
          </section>

          <section>
            <SectionHeading>License and reuse</SectionHeading>
            <p className="mt-2 text-sm text-muted">
              The dataset and code are released under the MIT License. Please cite the tracker and link
              to the original sources listed on each event. Reporting the confidence and attribution
              alongside any figure keeps its meaning intact.
            </p>
          </section>
        </div>
      </Container>
    </>
  );
}
