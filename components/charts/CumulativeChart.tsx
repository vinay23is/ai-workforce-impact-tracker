"use client";

import { useMemo, useState } from "react";
import { formatInt, formatDate } from "@/lib/formatting";

export interface ChartPoint {
  date: string;
  cumulative: number;
  added: number;
  companyName: string;
  level: string;
}

export interface ChartSeries {
  key: string;
  label: string;
  colorVar: string;
  points: ChartPoint[];
}

const W = 820;
const H = 360;
const PAD = { top: 20, right: 20, bottom: 34, left: 52 };

export function CumulativeChart({ series }: { series: ChartSeries[] }) {
  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(series.map((s, i) => [s.key, i < 2])),
  );
  const [hover, setHover] = useState<{ seriesKey: string; index: number } | null>(null);

  const active = series.filter((s) => visible[s.key]);

  const { xOf, yOf, xTicks, yTicks } = useMemo(() => {
    const allDates = series.flatMap((s) => s.points.map((p) => Date.parse(p.date)));
    const minX = allDates.length ? Math.min(...allDates) : 0;
    const maxX = allDates.length ? Math.max(...allDates) : 1;
    const maxY = Math.max(
      1,
      ...active.flatMap((s) => s.points.map((p) => p.cumulative)),
    );

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const spanX = maxX - minX || 1;

    const xOf = (date: string) => PAD.left + ((Date.parse(date) - minX) / spanX) * innerW;
    const yOf = (value: number) => PAD.top + innerH - (value / maxY) * innerH;

    const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxY / 4) * i));
    const years = Array.from(
      new Set(series.flatMap((s) => s.points.map((p) => p.date.slice(0, 4)))),
    ).sort();
    const xTicks = years.map((y) => ({ label: y, x: xOf(`${y}-06-15`) }));

    return { xOf, yOf, xTicks, yTicks, maxY };
  }, [series, active]);

  function steppedPath(points: ChartPoint[]): string {
    if (points.length === 0) return "";
    let d = `M ${xOf(points[0]!.date)} ${yOf(points[0]!.cumulative)}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]!;
      const cur = points[i]!;
      d += ` L ${xOf(cur.date)} ${yOf(prev.cumulative)} L ${xOf(cur.date)} ${yOf(cur.cumulative)}`;
    }
    return d;
  }

  const hoveredPoint =
    hover != null
      ? series.find((s) => s.key === hover.seriesKey)?.points[hover.index]
      : null;
  const hoveredSeries = hover != null ? series.find((s) => s.key === hover.seriesKey) : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {series.map((s) => {
          const on = visible[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setVisible((v) => ({ ...v, [s.key]: !v[s.key] }))}
              aria-pressed={on}
              className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs transition-colors ${
                on ? "border-ink-soft text-ink" : "border-rule text-faint"
              }`}
            >
              <span
                className="h-[3px] w-4 rounded"
                style={{ backgroundColor: on ? s.colorVar : "var(--rule)" }}
              />
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Cumulative AI-linked job cuts over time by attribution category"
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yOf(t)}
                y2={yOf(t)}
                stroke="var(--rule)"
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={yOf(t) + 4} textAnchor="end" className="fill-faint text-[11px]">
                {formatInt(t)}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text
              key={t.label}
              x={t.x}
              y={H - 12}
              textAnchor="middle"
              className="fill-faint text-[11px]"
            >
              {t.label}
            </text>
          ))}

          {active.map((s) => (
            <path
              key={s.key}
              d={steppedPath(s.points)}
              fill="none"
              stroke={s.colorVar}
              strokeWidth={s.key === "confirmed" ? 2.5 : 1.75}
              strokeLinejoin="round"
            />
          ))}

          {active.flatMap((s) =>
            s.points.map((p, i) => (
              <circle
                key={`${s.key}-${i}`}
                cx={xOf(p.date)}
                cy={yOf(p.cumulative)}
                r={hover?.seriesKey === s.key && hover.index === i ? 5 : 3}
                fill="var(--surface)"
                stroke={s.colorVar}
                strokeWidth={1.75}
                tabIndex={0}
                role="button"
                aria-label={`${s.label}: ${p.companyName}, ${formatDate(p.date)}, ${formatInt(
                  p.cumulative,
                )} cumulative`}
                className="cursor-pointer focus:outline-none"
                onMouseEnter={() => setHover({ seriesKey: s.key, index: i })}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover({ seriesKey: s.key, index: i })}
                onBlur={() => setHover(null)}
              />
            )),
          )}
        </svg>

        {hoveredPoint && hoveredSeries && (
          <div
            className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-sm border border-rule bg-surface px-3 py-2 text-xs shadow-sm"
            role="status"
          >
            <div className="font-medium">{hoveredPoint.companyName}</div>
            <div className="text-muted">{formatDate(hoveredPoint.date)}</div>
            <div className="mt-1 tnum">
              <span style={{ color: hoveredSeries.colorVar }}>+{formatInt(hoveredPoint.added)}</span>{" "}
              → {formatInt(hoveredPoint.cumulative)} cumulative
            </div>
            <div className="text-faint">{hoveredSeries.label}</div>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-muted">
        Cumulative global job cuts by announcement date. Toggle categories above. Hover or focus a
        point for detail. Planned future reductions are excluded.
      </p>
    </div>
  );
}
