import {
  ATTRIBUTION_META,
  CONFIDENCE_META,
  type AttributionLevel,
  type Confidence,
} from "@/lib/attribution";

/**
 * Attribution is shown as a letter chip plus its label, never colour alone, so it
 * stays legible without colour perception and to screen readers.
 */
export function AttributionBadge({
  level,
  showLabel = true,
}: {
  level: AttributionLevel;
  showLabel?: boolean;
}) {
  const meta = ATTRIBUTION_META[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap align-middle text-xs"
      title={meta.description}
    >
      <span
        className="grid h-[18px] w-[18px] place-items-center rounded-sm text-[11px] font-bold text-white"
        style={{ backgroundColor: `var(--attr-${level.toLowerCase()})` }}
        aria-hidden
      >
        {level}
      </span>
      {showLabel && <span className="text-ink-soft">{meta.short}</span>}
      <span className="sr-only">{`Attribution: ${meta.label}`}</span>
    </span>
  );
}

const CONFIDENCE_DOTS: Record<Confidence, number> = {
  VERY_HIGH: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  UNCONFIRMED: 0,
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const meta = CONFIDENCE_META[confidence];
  const filled = CONFIDENCE_DOTS[confidence];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-soft"
      title={meta.description}
    >
      <span className="flex items-center gap-[2px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-[6px] w-[6px] rounded-full"
            style={{ backgroundColor: i < filled ? "var(--ink-soft)" : "var(--rule)" }}
          />
        ))}
      </span>
      {meta.label}
      <span className="sr-only">{`Confidence: ${meta.label}`}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: "executed" | "in_progress" | "planned" }) {
  const label =
    status === "executed" ? "Executed" : status === "in_progress" ? "In progress" : "Planned";
  const planned = status === "planned";
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] uppercase tracking-wide ${
        planned ? "border-rule text-faint" : "border-rule text-muted"
      }`}
    >
      {label}
    </span>
  );
}
