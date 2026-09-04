import type { Dataset } from "./data";
import { getCountableEvents } from "./aggregations";
import { estimateEventWage } from "./estimates";
import type { AttributionLevel, Confidence } from "./attribution";

export interface EventRow {
  id: string;
  slug: string;
  date: string;
  year: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  industryId: string | null;
  industryName: string | null;
  industrySlug: string | null;
  countries: string[];
  states: string[];
  globalJobsLost: number | null;
  usJobsLost: number | null;
  attributionLevel: AttributionLevel;
  confidence: Confidence;
  status: "executed" | "in_progress" | "planned";
  summary: string;
  estimatedAnnualWage: number | null;
  sourcesCount: number;
}

export function buildEventRows(dataset: Dataset): EventRow[] {
  const sourcesByEvent = new Map<string, number>();
  for (const s of dataset.sources) {
    sourcesByEvent.set(s.eventId, (sourcesByEvent.get(s.eventId) ?? 0) + 1);
  }

  return getCountableEvents(dataset.events)
    .map((event) => {
      const company = dataset.companies.find((c) => c.id === event.companyId);
      const industry = company
        ? dataset.industries.find((i) => i.id === company.industryId)
        : undefined;
      const wage = estimateEventWage(event, company, dataset.wageReference);
      return {
        id: event.id,
        slug: event.slug,
        date: event.announcementDate,
        year: event.announcementDate.slice(0, 4),
        companyId: event.companyId,
        companyName: company?.name ?? event.companyId,
        companySlug: company?.slug ?? event.companyId,
        industryId: company?.industryId ?? null,
        industryName: industry?.name ?? null,
        industrySlug: industry?.slug ?? null,
        countries: [...new Set(event.locations.map((l) => l.country))],
        states: [...new Set(event.locations.map((l) => l.state).filter((s): s is string => !!s))],
        globalJobsLost: event.globalJobsLost,
        usJobsLost: event.usJobsLost,
        attributionLevel: event.attributionLevel,
        confidence: event.confidence,
        status: event.status,
        summary: event.summary,
        estimatedAnnualWage: wage?.estimatedAnnualWage ?? null,
        sourcesCount: sourcesByEvent.get(event.id) ?? 0,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
