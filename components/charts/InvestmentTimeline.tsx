import Link from "next/link";
import { formatDate } from "@/lib/formatting";
import { AttributionBadge } from "@/components/ui/badges";
import type { AttributionLevel } from "@/lib/attribution";

export interface TimelineItem {
  id: string;
  date: string;
  kind: "event" | "investment";
  title: string;
  detail: string;
  href?: string;
  attributionLevel?: AttributionLevel;
}

/**
 * Places workforce events and AI investments on one dated timeline. It shows the
 * sequence without asserting a causal link — the reader draws their own conclusion.
 */
export function InvestmentTimeline({ items }: { items: TimelineItem[] }) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    return <p className="text-sm text-muted">No dated events or investments recorded.</p>;
  }
  return (
    <ol className="relative border-l border-rule pl-6">
      {sorted.map((item) => (
        <li key={item.id} className="relative pb-6 last:pb-0">
          <span
            className="absolute -left-[25px] top-1.5 grid h-3 w-3 place-items-center rounded-full border-2 border-paper"
            style={{
              backgroundColor: item.kind === "investment" ? "var(--attr-d)" : "var(--accent)",
            }}
            aria-hidden
          />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-xs uppercase tracking-wide text-faint tnum">
              {formatDate(item.date)}
            </span>
            <span className="rounded-sm border border-rule px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
              {item.kind === "investment" ? "AI investment" : "Workforce"}
            </span>
            {item.attributionLevel && <AttributionBadge level={item.attributionLevel} showLabel={false} />}
          </div>
          <p className="mt-1 font-medium">
            {item.href ? (
              <Link href={item.href} className="hover:text-accent hover:underline">
                {item.title}
              </Link>
            ) : (
              item.title
            )}
          </p>
          <p className="mt-0.5 text-sm text-muted">{item.detail}</p>
        </li>
      ))}
    </ol>
  );
}
