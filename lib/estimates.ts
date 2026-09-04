import type { Dataset } from "./data";
import type { Company, WorkforceEvent } from "./schemas";
import type { WageReference } from "./reference";

export type WageMethod = "known_compensation" | "industry_median" | "national_median";

export interface EventWageEstimate {
  estimatedAnnualWage: number;
  perWorkerAnnualWage: number;
  jobsUsed: number;
  jobsBasis: "us";
  method: WageMethod;
  wageSource: string;
  wageSourceYear: number;
  confidence: "MEDIUM" | "LOW";
}

/**
 * Wage estimate for a single event, US-only. The reference wages are US (BLS),
 * so we only value the verified US headcount. If the US count is unknown we return
 * null rather than applying a US wage to a global or non-US headcount.
 */
export function estimateEventWage(
  event: WorkforceEvent,
  company: Company | undefined,
  wageRef: WageReference,
): EventWageEstimate | null {
  if (event.usJobsLost === null) return null;
  const jobs = event.usJobsLost;

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
    method === "known_compensation" && !event.jobsEstimated ? "MEDIUM" : "LOW";

  return {
    estimatedAnnualWage: Math.round(perWorker * jobs),
    perWorkerAnnualWage: perWorker,
    jobsUsed: jobs,
    jobsBasis: "us",
    method,
    wageSource: wageRef.source,
    wageSourceYear: wageRef.sourceYear,
    confidence,
  };
}

export interface WageImpact {
  totalAnnualWages: number;
  /** Verified US jobs that received a wage estimate. */
  usJobsCovered: number;
  eventsCovered: number;
  eventsWithoutUsHeadcount: number;
}

/**
 * Aggregate US wage exposure across a set of events. Only events with a verified
 * US headcount contribute; everything else is reported as uncovered.
 */
export function getEstimatedWageImpact(dataset: Dataset, events: WorkforceEvent[]): WageImpact {
  let total = 0;
  let usJobsCovered = 0;
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
    usJobsCovered += estimate.jobsUsed;
    eventsCovered += 1;
  }

  return { totalAnnualWages: total, usJobsCovered, eventsCovered, eventsWithoutUsHeadcount: eventsWithout };
}

export interface HouseholdExposure {
  people: number;
  jobs: number;
  averageHouseholdSize: number;
}

/**
 * US household exposure: verified US workers times the US Census average household
 * size. Global jobs without a verified US allocation are excluded, because the
 * household-size figure is US-specific.
 */
export function getEstimatedHouseholdExposure(usJobs: number, averageHouseholdSize: number): HouseholdExposure {
  return {
    people: Math.round(usJobs * averageHouseholdSize),
    jobs: usJobs,
    averageHouseholdSize,
  };
}
