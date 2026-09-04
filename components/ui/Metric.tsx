import type { ReactNode } from "react";

export function HeadlineMetric({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description?: ReactNode;
}) {
  return (
    <div>
      <div className="tnum font-serif text-mega font-semibold text-accent">{value}</div>
      <h2 className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink">{label}</h2>
      {description && (
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">{description}</p>
      )}
    </div>
  );
}

export function SecondaryMetric({
  value,
  label,
  note,
  estimated = false,
}: {
  value: string;
  label: string;
  note?: ReactNode;
  estimated?: boolean;
}) {
  return (
    <div className="border-t border-rule pt-3">
      <div className="tnum font-serif text-3xl font-semibold sm:text-4xl">{value}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
          {label}
        </h3>
        {estimated && (
          <span className="text-[10px] uppercase tracking-wide text-faint">Estimate</span>
        )}
      </div>
      {note && <p className="mt-1 text-xs leading-relaxed text-muted">{note}</p>}
    </div>
  );
}

export function StatTile({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: ReactNode;
}) {
  return (
    <div className="border border-rule bg-surface p-4">
      <div className="tnum font-serif text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
        {label}
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
