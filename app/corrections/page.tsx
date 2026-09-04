import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/Page";
import { loadDataset } from "@/lib/data";
import { formatDate } from "@/lib/formatting";

export const metadata: Metadata = {
  title: "Corrections",
  description: "A public log of corrections to the dataset. History is never silently rewritten.",
};

export default function CorrectionsPage() {
  const dataset = loadDataset();
  const corrections = [...dataset.corrections].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHeader
        eyebrow="Corrections"
        title="Corrections log"
        intro="When a figure or classification changes, it is recorded here. The full edit history also lives in the project's version control."
      />
      <Container className="py-8">
        {corrections.length === 0 ? (
          <p className="text-sm text-muted">No corrections have been recorded yet.</p>
        ) : (
          <ul className="max-w-prose space-y-6">
            {corrections.map((c) => {
              const event = c.eventId
                ? dataset.events.find((e) => e.id === c.eventId)
                : undefined;
              return (
                <li key={c.id} className="border-t border-rule pt-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="font-medium">{c.entity}</span>
                    <span className="text-xs text-muted tnum">{formatDate(c.date)}</span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-wide text-faint">Field: {c.field}</p>
                  <p className="mt-2 text-sm text-ink-soft">{c.reason}</p>
                  <p className="mt-2 text-sm text-muted">
                    <span className="line-through">{c.oldValue}</span> → {c.newValue}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {event && (
                      <Link href={`/events/${event.slug}`} className="text-accent hover:underline">
                        View event
                      </Link>
                    )}
                    {c.sourceUrl && (
                      <a
                        href={c.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-accent hover:underline"
                      >
                        Source
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}
