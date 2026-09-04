"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import type { EventRow } from "@/lib/rows";
import {
  ATTRIBUTION_LEVELS,
  ATTRIBUTION_META,
  CONFIDENCE_LEVELS,
  CONFIDENCE_META,
} from "@/lib/attribution";
import { AttributionBadge, ConfidenceBadge, StatusBadge } from "@/components/ui/badges";
import { formatDate, formatInt } from "@/lib/formatting";

type SortKey = "date" | "jobs" | "company";

function jobsValue(row: EventRow): number {
  return row.globalJobsLost ?? -1;
}

export function EventsExplorer({ rows }: { rows: EventRow[] }) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [attribution, setAttribution] = useState("");
  const [confidence, setConfidence] = useState("");
  const [status, setStatus] = useState("");
  const [minJobs, setMinJobs] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [asc, setAsc] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const years = [...new Set(rows.map((r) => r.year))].sort().reverse();
  const industries = [...new Set(rows.map((r) => r.industryName).filter(Boolean))].sort() as string[];
  const countries = [...new Set(rows.flatMap((r) => r.countries))].sort();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minJobs ? Number(minJobs) : null;
    const result = rows.filter((r) => {
      if (q && !`${r.companyName} ${r.summary}`.toLowerCase().includes(q)) return false;
      if (year && r.year !== year) return false;
      if (industry && r.industryName !== industry) return false;
      if (country && !r.countries.includes(country)) return false;
      if (attribution && r.attributionLevel !== attribution) return false;
      if (confidence && r.confidence !== confidence) return false;
      if (status && r.status !== status) return false;
      if (min !== null && (r.globalJobsLost ?? 0) < min) return false;
      return true;
    });
    result.sort((a, b) => {
      let cmp = 0;
      if (sort === "date") cmp = a.date.localeCompare(b.date);
      else if (sort === "jobs") cmp = jobsValue(a) - jobsValue(b);
      else cmp = a.companyName.localeCompare(b.companyName);
      return asc ? cmp : -cmp;
    });
    return result;
  }, [rows, query, year, industry, country, attribution, confidence, status, minJobs, sort, asc]);

  const activeFilterCount = [year, industry, country, attribution, confidence, status, minJobs].filter(
    Boolean,
  ).length;

  function toggleSort(key: SortKey) {
    if (sort === key) setAsc((v) => !v);
    else {
      setSort(key);
      setAsc(false);
    }
  }

  function reset() {
    setQuery("");
    setYear("");
    setIndustry("");
    setCountry("");
    setAttribution("");
    setConfidence("");
    setStatus("");
    setMinJobs("");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or keyword"
            className="w-full rounded-sm border border-rule bg-surface py-2 pl-9 pr-3 text-sm focus:border-ink-soft focus:outline-none"
            aria-label="Search events"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-2 rounded-sm border border-rule px-3 py-2 text-sm"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-accent px-1.5 text-[11px] text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mt-3 grid gap-3 rounded-sm border border-rule bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Year" value={year} onChange={setYear} options={years.map((y) => [y, y])} />
          <Select
            label="Industry"
            value={industry}
            onChange={setIndustry}
            options={industries.map((i) => [i, i])}
          />
          <Select
            label="Country"
            value={country}
            onChange={setCountry}
            options={countries.map((c) => [c, c])}
          />
          <Select
            label="Attribution"
            value={attribution}
            onChange={setAttribution}
            options={ATTRIBUTION_LEVELS.map((l) => [l, `${l} — ${ATTRIBUTION_META[l].short}`])}
          />
          <Select
            label="Confidence"
            value={confidence}
            onChange={setConfidence}
            options={CONFIDENCE_LEVELS.map((c) => [c, CONFIDENCE_META[c].label])}
          />
          <Select
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              ["executed", "Executed"],
              ["in_progress", "In progress"],
              ["planned", "Planned"],
            ]}
          />
          <label className="text-xs">
            <span className="mb-1 block uppercase tracking-wide text-faint">Minimum jobs</span>
            <input
              type="number"
              inputMode="numeric"
              value={minJobs}
              onChange={(e) => setMinJobs(e.target.value)}
              placeholder="0"
              className="w-full rounded-sm border border-rule bg-surface px-2 py-1.5 text-sm focus:border-ink-soft focus:outline-none"
            />
          </label>
          <div className="flex items-end">
            <button type="button" onClick={reset} className="text-xs text-accent hover:underline">
              Clear all filters
            </button>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        {formatInt(filtered.length)} of {formatInt(rows.length)} events
      </p>

      {/* Table for larger screens */}
      <div className="mt-2 hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink text-left text-xs uppercase tracking-wide text-muted">
              <Th onClick={() => toggleSort("date")} active={sort === "date"} asc={asc}>Date</Th>
              <Th onClick={() => toggleSort("company")} active={sort === "company"} asc={asc}>Company</Th>
              <th className="py-2 pr-3 font-medium">Industry</th>
              <th className="py-2 pr-3 font-medium">Location</th>
              <Th onClick={() => toggleSort("jobs")} active={sort === "jobs"} asc={asc} align="right">Jobs</Th>
              <th className="py-2 pr-3 font-medium">Attribution</th>
              <th className="py-2 pr-3 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-rule align-top hover:bg-[var(--surface)]">
                <td className="whitespace-nowrap py-3 pr-3 text-muted tnum">{formatDate(row.date)}</td>
                <td className="py-3 pr-3">
                  <Link href={`/events/${row.slug}`} className="font-medium hover:text-accent hover:underline">
                    {row.companyName}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2">
                    {row.status !== "executed" && <StatusBadge status={row.status} />}
                  </div>
                </td>
                <td className="py-3 pr-3 text-ink-soft">{row.industryName ?? "—"}</td>
                <td className="py-3 pr-3 text-ink-soft">{locationLabel(row)}</td>
                <td className="py-3 pr-3 text-right tnum">
                  {row.globalJobsLost === null ? (
                    <span className="text-faint" title="Headcount not disclosed">—</span>
                  ) : (
                    formatInt(row.globalJobsLost)
                  )}
                  {row.usJobsLost !== null && (
                    <span className="block text-xs text-faint">US {formatInt(row.usJobsLost)}</span>
                  )}
                </td>
                <td className="py-3 pr-3"><AttributionBadge level={row.attributionLevel} /></td>
                <td className="py-3 pr-3"><ConfidenceBadge confidence={row.confidence} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards for small screens */}
      <ul className="mt-2 space-y-3 md:hidden">
        {filtered.map((row) => (
          <li key={row.id} className="border border-rule bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/events/${row.slug}`} className="font-medium hover:text-accent">
                {row.companyName}
              </Link>
              <span className="tnum text-right text-sm">
                {row.globalJobsLost === null ? "—" : formatInt(row.globalJobsLost)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted tnum">
              {formatDate(row.date)} · {row.industryName ?? "—"} · {locationLabel(row)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <AttributionBadge level={row.attributionLevel} />
              <ConfidenceBadge confidence={row.confidence} />
              {row.status !== "executed" && <StatusBadge status={row.status} />}
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="mt-6 text-sm text-muted">No events match these filters.</p>
      )}
    </div>
  );
}

function locationLabel(row: EventRow): string {
  if (row.states.length) return `${row.countries[0] ?? "US"} (${row.states.join(", ")})`;
  if (row.countries.length) return row.countries.join(", ");
  return "Not specified";
}

function Th({
  children,
  onClick,
  active,
  asc,
  align = "left",
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  asc: boolean;
  align?: "left" | "right";
}) {
  return (
    <th className={`py-2 pr-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-ink ${
          active ? "text-ink" : ""
        }`}
      >
        {children}
        {active && <span aria-hidden>{asc ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

function Select({
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
        className="w-full rounded-sm border border-rule bg-surface px-2 py-1.5 text-sm focus:border-ink-soft focus:outline-none"
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
