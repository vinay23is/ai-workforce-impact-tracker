import {
  ATTRIBUTION_RULES,
  confidenceMeetsThreshold,
  type AttributionLevel,
} from "./attribution";
import type { Dataset } from "./data";
import type { Source, WorkforceEvent } from "./schemas";

export type JobsBasis = "global" | "us";

export interface JobsTotal {
  jobs: number;
  events: number;
  eventsWithKnownCount: number;
  eventsWithUnknownCount: number;
}

/**
 * Events that may be summed. A parent event referenced by another published event
 * is a context container for a multi-stage program; its stages carry the counts,
 * so the parent itself is excluded to prevent double counting.
 */
export function getCountableEvents(events: WorkforceEvent[]): WorkforceEvent[] {
  const parentIds = new Set(
    events.filter((e) => e.published && e.parentEventId).map((e) => e.parentEventId as string),
  );
  return events.filter((e) => e.published && !parentIds.has(e.id));
}

function hasAIAttributionSource(event: WorkforceEvent, sources: Source[]): boolean {
  return sources.some((s) => s.eventId === event.id && s.supportsAIAttribution);
}

/** Whether the cut has actually happened. Planned targets are counted separately. */
export function isCounted(event: WorkforceEvent): boolean {
  return event.status === "executed" || event.status === "in_progress";
}

function inLevels(event: WorkforceEvent, levels: AttributionLevel[]): boolean {
  return levels.includes(event.attributionLevel);
}

/** The conservative headline set: AI is an established cause and evidence clears the bar. */
export function isConfirmed(event: WorkforceEvent, sources: Source[]): boolean {
  return (
    inLevels(event, ATTRIBUTION_RULES.confirmedLevels) &&
    confidenceMeetsThreshold(event.confidence, ATTRIBUTION_RULES.confirmedMinConfidence) &&
    hasAIAttributionSource(event, sources)
  );
}

export function isAILinked(event: WorkforceEvent): boolean {
  return inLevels(event, ATTRIBUTION_RULES.aiLinkedLevels);
}

export function isDirectReplacement(event: WorkforceEvent): boolean {
  return inLevels(event, ATTRIBUTION_RULES.directReplacementLevels);
}

export function isCapitalReallocation(event: WorkforceEvent): boolean {
  return inLevels(event, ATTRIBUTION_RULES.capitalReallocationLevels);
}

function jobField(event: WorkforceEvent, basis: JobsBasis): number | null {
  return basis === "global" ? event.globalJobsLost : event.usJobsLost;
}

export function sumJobs(events: WorkforceEvent[], basis: JobsBasis): JobsTotal {
  let jobs = 0;
  let known = 0;
  let unknown = 0;
  for (const event of events) {
    const value = jobField(event, basis);
    if (value === null) {
      unknown += 1;
    } else {
      jobs += value;
      known += 1;
    }
  }
  return { jobs, events: events.length, eventsWithKnownCount: known, eventsWithUnknownCount: unknown };
}

// Event selectors ----------------------------------------------------------

export function getConfirmedEvents(dataset: Dataset): WorkforceEvent[] {
  return getCountableEvents(dataset.events).filter(
    (e) => isCounted(e) && isConfirmed(e, dataset.sources),
  );
}

export function getAllAILinkedEvents(dataset: Dataset): WorkforceEvent[] {
  return getCountableEvents(dataset.events).filter((e) => isCounted(e) && isAILinked(e));
}

export function getDirectReplacementEvents(dataset: Dataset): WorkforceEvent[] {
  return getCountableEvents(dataset.events).filter((e) => isCounted(e) && isDirectReplacement(e));
}

export function getCapitalReallocationEvents(dataset: Dataset): WorkforceEvent[] {
  return getCountableEvents(dataset.events).filter((e) => isCounted(e) && isCapitalReallocation(e));
}

/** Announced but not-yet-executed AI-linked reductions (stated targets/projections). */
export function getPlannedEvents(dataset: Dataset): WorkforceEvent[] {
  return getCountableEvents(dataset.events).filter(
    (e) => e.status === "planned" && isAILinked(e),
  );
}

export function getPlannedJobs(dataset: Dataset, basis: JobsBasis = "global"): JobsTotal {
  return sumJobs(getPlannedEvents(dataset), basis);
}

// Totals -------------------------------------------------------------------

export function getConfirmedJobs(dataset: Dataset, basis: JobsBasis = "global"): JobsTotal {
  return sumJobs(getConfirmedEvents(dataset), basis);
}

export function getAllAILinkedJobs(dataset: Dataset, basis: JobsBasis = "global"): JobsTotal {
  return sumJobs(getAllAILinkedEvents(dataset), basis);
}

export function getDirectReplacementJobs(dataset: Dataset, basis: JobsBasis = "global"): JobsTotal {
  return sumJobs(getDirectReplacementEvents(dataset), basis);
}

export function getCapitalReallocationJobs(dataset: Dataset, basis: JobsBasis = "global"): JobsTotal {
  return sumJobs(getCapitalReallocationEvents(dataset), basis);
}

// Breakdowns ---------------------------------------------------------------

export interface GroupTotal {
  key: string;
  label: string;
  confirmedJobs: number;
  aiLinkedJobs: number;
  events: number;
}

export function getJobsByCompany(dataset: Dataset, basis: JobsBasis = "global"): GroupTotal[] {
  const confirmed = new Set(getConfirmedEvents(dataset).map((e) => e.id));
  const linked = getAllAILinkedEvents(dataset);
  const byCompany = new Map<string, GroupTotal>();

  for (const event of linked) {
    const company = dataset.companies.find((c) => c.id === event.companyId);
    if (!company) continue;
    const entry =
      byCompany.get(company.id) ??
      { key: company.slug, label: company.name, confirmedJobs: 0, aiLinkedJobs: 0, events: 0 };
    const value = jobField(event, basis) ?? 0;
    entry.aiLinkedJobs += value;
    if (confirmed.has(event.id)) entry.confirmedJobs += value;
    entry.events += 1;
    byCompany.set(company.id, entry);
  }

  return [...byCompany.values()].sort((a, b) => b.aiLinkedJobs - a.aiLinkedJobs);
}

export function getJobsByIndustry(dataset: Dataset, basis: JobsBasis = "global"): GroupTotal[] {
  const confirmed = new Set(getConfirmedEvents(dataset).map((e) => e.id));
  const linked = getAllAILinkedEvents(dataset);
  const byIndustry = new Map<string, GroupTotal>();

  for (const event of linked) {
    const company = dataset.companies.find((c) => c.id === event.companyId);
    if (!company) continue;
    const industry = dataset.industries.find((i) => i.id === company.industryId);
    if (!industry) continue;
    const entry =
      byIndustry.get(industry.id) ??
      { key: industry.slug, label: industry.name, confirmedJobs: 0, aiLinkedJobs: 0, events: 0 };
    const value = jobField(event, basis) ?? 0;
    entry.aiLinkedJobs += value;
    if (confirmed.has(event.id)) entry.confirmedJobs += value;
    entry.events += 1;
    byIndustry.set(industry.id, entry);
  }

  return [...byIndustry.values()].sort((a, b) => b.aiLinkedJobs - a.aiLinkedJobs);
}

export function getJobsByYear(dataset: Dataset, basis: JobsBasis = "global"): GroupTotal[] {
  const confirmed = new Set(getConfirmedEvents(dataset).map((e) => e.id));
  const linked = getAllAILinkedEvents(dataset);
  const byYear = new Map<string, GroupTotal>();

  for (const event of linked) {
    const year = event.announcementDate.slice(0, 4);
    const entry =
      byYear.get(year) ??
      { key: year, label: year, confirmedJobs: 0, aiLinkedJobs: 0, events: 0 };
    const value = jobField(event, basis) ?? 0;
    entry.aiLinkedJobs += value;
    if (confirmed.has(event.id)) entry.confirmedJobs += value;
    entry.events += 1;
    byYear.set(year, entry);
  }

  return [...byYear.values()].sort((a, b) => a.key.localeCompare(b.key));
}

// Per-company ---------------------------------------------------------------

export interface CompanyStats {
  events: WorkforceEvent[];
  confirmedJobs: number;
  aiLinkedJobs: number;
  plannedJobs: number;
}

export function getCompanyStats(dataset: Dataset, companyId: string): CompanyStats {
  const events = getCountableEvents(dataset.events).filter((e) => e.companyId === companyId);
  const confirmed = events.filter((e) => isCounted(e) && isConfirmed(e, dataset.sources));
  const linked = events.filter((e) => isCounted(e) && isAILinked(e));
  const planned = events.filter((e) => e.status === "planned" && isAILinked(e));
  return {
    events,
    confirmedJobs: sumJobs(confirmed, "global").jobs,
    aiLinkedJobs: sumJobs(linked, "global").jobs,
    plannedJobs: sumJobs(planned, "global").jobs,
  };
}

// Countries affected -------------------------------------------------------

export function getCountriesAffected(dataset: Dataset): string[] {
  const set = new Set<string>();
  for (const event of getAllAILinkedEvents(dataset)) {
    for (const loc of event.locations) set.add(loc.country);
  }
  return [...set].sort();
}

// Timeline -----------------------------------------------------------------

export interface TimelinePoint {
  date: string;
  added: number;
  cumulative: number;
  eventId: string;
  companyName: string;
  attributionLevel: AttributionLevel;
}

export function getTimeline(
  events: WorkforceEvent[],
  dataset: Dataset,
  basis: JobsBasis = "global",
): TimelinePoint[] {
  const sorted = [...events]
    .filter((e) => jobField(e, basis) !== null)
    .sort((a, b) => a.announcementDate.localeCompare(b.announcementDate));
  let cumulative = 0;
  return sorted.map((event) => {
    const added = jobField(event, basis) ?? 0;
    cumulative += added;
    const company = dataset.companies.find((c) => c.id === event.companyId);
    return {
      date: event.announcementDate,
      added,
      cumulative,
      eventId: event.id,
      companyName: company?.name ?? event.companyId,
      attributionLevel: event.attributionLevel,
    };
  });
}
