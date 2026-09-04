import { ExternalLink } from "lucide-react";
import type { Source } from "@/lib/schemas";
import { formatDate } from "@/lib/formatting";

const SUPPORT_LABELS: Array<{ key: keyof Source; label: string }> = [
  { key: "supportsHeadcount", label: "headcount" },
  { key: "supportsAIAttribution", label: "AI link" },
  { key: "supportsLocation", label: "location" },
  { key: "supportsInvestmentRelationship", label: "investment" },
];

export function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) {
    return <p className="text-sm text-muted">No sources recorded.</p>;
  }
  return (
    <ol className="space-y-4">
      {sources.map((source) => {
        const supports = SUPPORT_LABELS.filter((s) => source[s.key]);
        return (
          <li key={source.id} className="border-t border-rule pt-4">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-medium underline decoration-rule underline-offset-2 hover:decoration-accent hover:text-accent"
              >
                {source.title}
                <ExternalLink size={13} className="ml-1 inline align-baseline" aria-hidden />
              </a>
              {source.primarySource && (
                <span className="rounded-sm bg-accent-soft px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-accent">
                  Primary
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">
              {source.publisher}
              {source.publishedAt ? ` · ${formatDate(source.publishedAt)}` : ""} · retrieved{" "}
              {formatDate(source.retrievedAt)}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{source.evidenceNote}</p>
            {supports.length > 0 && (
              <p className="mt-1.5 flex flex-wrap gap-1.5">
                {supports.map((s) => (
                  <span
                    key={s.label}
                    className="rounded-sm border border-rule px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-faint"
                  >
                    {s.label}
                  </span>
                ))}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
