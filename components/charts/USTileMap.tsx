"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { EventRow } from "@/lib/rows";
import { ATTRIBUTION_LEVELS, ATTRIBUTION_META } from "@/lib/attribution";
import { AttributionBadge } from "@/components/ui/badges";
import { formatInt } from "@/lib/formatting";

interface GridState {
  abbr: string;
  name: string;
  tileRow: number;
  tileCol: number;
}

const COLS = 11;
const ROWS = 8;

export function USTileMap({ rows, grid }: { rows: EventRow[]; grid: GridState[] }) {
  const [year, setYear] = useState("");
  const [industry, setIndustry] = useState("");
  const [attribution, setAttribution] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const years = [...new Set(rows.map((r) => r.year))].sort().reverse();
  const industries = [...new Set(rows.map((r) => r.industryName).filter(Boolean))].sort() as string[];

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (year && r.year !== year) return false;
        if (industry && r.industryName !== industry) return false;
        if (attribution && r.attributionLevel !== attribution) return false;
        return true;
      }),
    [rows, year, industry, attribution],
  );

  const { byState, nationwide, outside } = useMemo(() => {
    const byState = new Map<string, EventRow[]>();
    const nationwide: EventRow[] = [];
    const outside: EventRow[] = [];
    for (const r of filtered) {
      if (r.states.length) {
        for (const s of r.states) {
          const list = byState.get(s) ?? [];
          list.push(r);
          byState.set(s, list);
        }
      } else if (r.countries.includes("United States")) {
        nationwide.push(r);
      } else if (r.countries.length) {
        outside.push(r);
      }
    }
    return { byState, nationwide, outside };
  }, [filtered]);

  const maxCount = Math.max(1, ...[...byState.values()].map((l) => l.length));
  const selectedEvents = selected ? byState.get(selected) ?? [] : [];
  const selectedName = grid.find((g) => g.abbr === selected)?.name ?? selected;

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-3">
        <MapSelect label="Year" value={year} onChange={setYear} options={years.map((y) => [y, y])} />
        <MapSelect
          label="Industry"
          value={industry}
          onChange={setIndustry}
          options={industries.map((i) => [i, i])}
        />
        <MapSelect
          label="Attribution"
          value={attribution}
          onChange={setAttribution}
          options={ATTRIBUTION_LEVELS.map((l) => [l, `${l} — ${ATTRIBUTION_META[l].short}`])}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-start">
        <div>
          <div
            className="mx-auto grid max-w-2xl gap-1"
            style={{
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
            }}
            role="group"
            aria-label="United States tile-grid map of AI-linked events by state"
          >
            {grid.map((s) => {
              const list = byState.get(s.abbr) ?? [];
              const count = list.length;
              const intensity = count === 0 ? 0 : 0.25 + 0.75 * (count / maxCount);
              const isSelected = selected === s.abbr;
              return (
                <button
                  key={s.abbr}
                  type="button"
                  disabled={count === 0}
                  onClick={() => setSelected(isSelected ? null : s.abbr)}
                  style={{
                    gridColumnStart: s.tileCol + 1,
                    gridRowStart: s.tileRow + 1,
                    backgroundColor:
                      count === 0 ? "var(--surface)" : `color-mix(in srgb, var(--accent) ${intensity * 100}%, var(--paper))`,
                    outline: isSelected ? "2px solid var(--ink)" : undefined,
                  }}
                  className={`aspect-square rounded-[3px] border border-rule text-[10px] font-medium ${
                    count === 0 ? "text-faint" : count / maxCount > 0.6 ? "text-white" : "text-ink"
                  } ${count > 0 ? "cursor-pointer hover:outline hover:outline-1 hover:outline-ink-soft" : "cursor-default"}`}
                  title={count > 0 ? `${s.name}: ${count} event${count > 1 ? "s" : ""}` : s.name}
                  aria-label={`${s.name}: ${count} event${count === 1 ? "" : "s"} with state-level evidence`}
                >
                  {s.abbr}
                </button>
              );
            })}
          </div>
          <div className="mx-auto mt-4 flex max-w-2xl items-center gap-3 text-xs text-muted">
            <span>Fewer</span>
            <span className="flex gap-0.5">
              {[0.25, 0.5, 0.75, 1].map((v) => (
                <span
                  key={v}
                  className="h-3 w-6 rounded-[2px] border border-rule"
                  style={{ backgroundColor: `color-mix(in srgb, var(--accent) ${v * 100}%, var(--paper))` }}
                />
              ))}
            </span>
            <span>More events</span>
          </div>
        </div>

        <aside className="space-y-4">
          {selected ? (
            <div className="border border-rule bg-surface p-4">
              <h3 className="text-sm font-semibold">{selectedName}</h3>
              <ul className="mt-3 space-y-3">
                {selectedEvents.map((e) => (
                  <li key={e.id} className="border-t border-rule pt-3 first:border-0 first:pt-0">
                    <Link href={`/events/${e.slug}`} className="text-sm font-medium hover:text-accent">
                      {e.companyName}
                    </Link>
                    <div className="mt-1"><AttributionBadge level={e.attributionLevel} /></div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="border border-rule bg-surface p-4 text-sm text-muted">
              Click a shaded state to see the events with evidence there.
            </div>
          )}

          <div className="border border-rule bg-surface p-4 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Not mapped to a state
            </h3>
            <p className="mt-2 tnum">
              {formatInt(nationwide.length)} US events with no state-level breakdown
            </p>
            <p className="tnum">{formatInt(outside.length)} events outside the US</p>
            <p className="mt-2 text-xs text-faint">
              Nationwide reductions are not spread across states. Most companies do not disclose a
              geographic breakdown, so those events stay unmapped rather than being guessed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MapSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="text-xs">
      <span className="mb-1 block uppercase tracking-wide text-faint">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-sm border border-rule bg-surface px-2 py-1.5 text-sm focus:border-ink-soft focus:outline-none"
      >
        <option value="">All</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
