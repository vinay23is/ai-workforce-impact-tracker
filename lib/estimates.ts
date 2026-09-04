import type { Dataset } from "./data";
import type { Company, WorkforceEvent } from "./schemas";
import type { WageReference } from "./reference";

export type WageMethod = "known_compensation" | "industry_median" | "national_median";

export interface EventWageEstimate {
  estimatedAnnualWage: number;
  perWorkerAnnualWage: number;
  jobsUsed: number;
  jobsBasis: "us" | "global";
  method: WageMethod;
  wageSource: string;
  wageSourceYear: number;
  /** Lower when a national/industry wage is applied to a non-US or estimated headcount. */
  confidence: "MEDIUM" | "LOW";
}

function bestHeadcount(event: WorkforceEvent): { jobs: number; basis: "us" | "global" } | null {
  if (event.usJobsLost !== null) return { jobs: event.usJobsLost, basis: "us" };
  if (event.globalJobsLost !== null) return { jobs: event.globalJobsLost, basis: "global" };
  return null;
}

/**
 * Wage estimate for a single event using the documented hierarchy:
 * known compensation, then BLS industry median, then the national median.
 * Returns null when there is not enough information (no headcount).
 */
export function estimateEventWage(
  event: WorkforceEvent,
  company: Company | undefined,
  wageRef: WageReference,
): EventWageEstimate | null {
  const headcount = bestHeadcount(event);
  if (!headcount) return null;

  let perWorker: number;
  let method: WageMethod;

  if (event.knownAnnualCompensationPerWorker !== null) {
    perWorker = event.knownAnnualCompensationPerWorker;
    method = "known_compensation";
  } else {
    const industryWage = company
      ? wageRef.byIndustry.find((w) => w.industryId === company.industryId)?.medianAnnualWage
      : undefined;
    if (industryWage) {
      perWorker = industryWage;
      method = "industry_median";
    } else {
      perWorker = wageRef.nationalMedianAnnualWage;
      method = "national_median";
    }
  }

  const confidence: "MEDIUM" | "LOW" =
    method === "known_compensation" && headcount.basis === "us" && !event.jobsEstimated
      ? "MEDIUM"
      : "LOW";

  return {
    estimatedAnnualWage: Math.round(perWorker * headcount.jobs),
    perWorkerAnnualWage: perWorker,
    jobsUsed: headcount.jobs,
    jobsBasis: headcount.basis,
    method,
    wageSource: wageRef.source,
    wageSourceYear: wageRef.sourceYear,
    confidence,
  };
}

export interface WageImpact {
  totalAnnualWages: number;
  jobsCovered: number;
  eventsCovered: number;
  eventsWithoutEstimate: number;
}

export function getEstimatedWageImpact(
  dataset: Dataset,
  events: WorkforceEvent[],
): WageImpact {
  let total = 0;
  let jobsCovered = 0;
  let eventsCovered = 0;
  let eventsWithout = 0;

  for (const event of events) {
    const company = dataset.companies.find((c) => c.id === event.companyId);
    const estimate = estimateEventWage(event, company, dataset.wageReference);
    if (!estimate) {
      eventsWithout += 1;
      continue;
    }
    total += estimate.estimatedAnnualWage;
    jobsCovered += estimate.jobsUsed;
    eventsCovered += 1;
  }

  return {
    totalAnnualWages: total,
    jobsCovered,
    eventsCovered,
    eventsWithoutEstimate: eventsWithout,
  };
}

export interface HouseholdExposure {
  people: number;
  jobs: number;
  averageHouseholdSize: number;
}

/**
 * Rough exposure estimate: affected workers times the average US household size.
 * This is not a count of identified people and may double-count households that
 * contain more than one affected worker.
 */
export function getEstimatedHouseholdExposure(jobs: number, averageHouseholdSize: number): HouseholdExposure {
  return {
    people: Math.round(jobs * averageHouseholdSize),
    jobs,
    averageHouseholdSize,
  };
}
