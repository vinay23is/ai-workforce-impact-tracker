"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { EventRow } from "@/lib/rows";

const COLUMNS: Array<{ key: keyof EventRow; header: string }> = [
  { key: "id", header: "id" },
  { key: "slug", header: "slug" },
  { key: "companyName", header: "company" },
  { key: "industryName", header: "industry" },
  { key: "date", header: "announcement_date" },
  { key: "globalJobsLost", header: "global_jobs_lost" },
  { key: "usJobsLost", header: "us_jobs_lost" },
  { key: "attributionLevel", header: "attribution" },
  { key: "confidence", header: "confidence" },
  { key: "status", header: "status" },
  { key: "estimatedAnnualWage", header: "estimated_annual_wage" },
  { key: "sourcesCount", header: "sources" },
];

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = Array.isArray(value) ? value.join("; ") : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function CsvDownload({ rows }: { rows: EventRow[] }) {
  const [done, setDone] = useState(false);

  function download() {
    const header = [...COLUMNS.map((c) => c.header), "countries", "states"].join(",");
    const lines = rows.map((row) =>
      [...COLUMNS.map((c) => cell(row[c.key])), cell(row.countries), cell(row.states)].join(","),
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-workforce-events.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-2 rounded-sm border border-ink px-3 py-2 text-sm font-medium hover:bg-ink hover:text-paper"
    >
      <Download size={15} />
      {done ? "Downloaded" : `Download CSV (${rows.length} events)`}
    </button>
  );
}
