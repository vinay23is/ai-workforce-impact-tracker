import Link from "next/link";
import { formatInt } from "@/lib/formatting";

export interface BarItem {
  key: string;
  label: string;
  value: number;
  confirmedValue?: number;
  href?: string;
  meta?: string;
}

/**
 * Horizontal bars scaled to the largest value. When confirmedValue is given, the
 * confirmed portion is drawn darker so the conservative subset reads at a glance.
 */
export function BarList({ items, unit = "jobs" }: { items: BarItem[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const width = (item.value / max) * 100;
        const confirmedWidth = item.confirmedValue ? (item.confirmedValue / max) * 100 : 0;
        return (
          <li key={item.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">
                {item.href ? (
                  <Link href={item.href} className="hover:text-accent hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  item.label
                )}
                {item.meta && <span className="ml-2 text-xs text-faint">{item.meta}</span>}
              </span>
              <span className="tnum shrink-0 text-ink-soft">{formatInt(item.value)}</span>
            </div>
            <div className="relative mt-1 h-2.5 w-full rounded-sm bg-[var(--accent-soft)]">
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-[var(--faint)]"
                style={{ width: `${width}%` }}
                aria-hidden
              />
              {confirmedWidth > 0 && (
                <div
                  className="absolute inset-y-0 left-0 rounded-sm bg-[var(--accent)]"
                  style={{ width: `${confirmedWidth}%` }}
                  aria-hidden
                />
              )}
            </div>
          </li>
        );
      })}
      {items.length === 0 && <li className="text-sm text-muted">No {unit} recorded.</li>}
    </ul>
  );
}
