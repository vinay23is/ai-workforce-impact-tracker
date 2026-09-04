import type { Dataset } from "./data";
import {
  getAllAILinkedEvents,
  getAllAILinkedJobs,
  getCapitalReallocationJobs,
  getConfirmedEvents,
  getConfirmedJobs,
  getCountriesAffected,
  getDirectOrEnabledJobs,
  getDirectReplacementJobs,
  getJobsByLevel,
  getPlannedEvents,
  getPlannedJobs,
  getQuantifiedAIAttributedJobs,
  getCountableEvents,
} from "./aggregations";
import { getEstimatedHouseholdExposure, getEstimatedWageImpact } from "./estimates";
import { METHODOLOGY_VERSION } from "./attribution";

function distinctCompanies(events: { companyId: string }[]): number {
  return new Set(events.map((e) => e.companyId)).size;
}

/**
 * The one place headline numbers are computed. Pages and the generated public
 * JSON both read from here, so a figure can never differ between the site and
 * the downloadable data.
 *
 * Company counts are always paired with the SAME population as the event count
 * they sit next to (e.g. confirmed events + confirmed companies), never mixed.
 */
export function getSiteStats(dataset: Dataset) {
  const confirmedEvents = getConfirmedEvents(dataset);
  const confirmed = getConfirmedJobs(dataset, "global");
  const confirmedUs = getConfirmedJobs(dataset, "us");
  const allLinked = getAllAILinkedJobs(dataset, "global");
  const direct = getDirectReplacementJobs(dataset, "global");
  const capital = getCapitalReallocationJobs(dataset, "global");
  const planned = getPlannedJobs(dataset, "global");
  const directOrEnabled = getDirectOrEnabledJobs(dataset, "global");
  const quantifiedAIAttributed = getQuantifiedAIAttributedJobs(dataset, "global");

  // Per-attribution-level totals (executed). A–C match the verified headline;
  // D and E are AI-linked but not part of it; F is context-only and never AI-linked.
  const byLevel = {
    A: getJobsByLevel(dataset, "A", "global"),
    B: getJobsByLevel(dataset, "B", "global"),
    C: getJobsByLevel(dataset, "C", "global"),
    D: getJobsByLevel(dataset, "D", "global"),
    E: getJobsByLevel(dataset, "E", "global"),
    F: getJobsByLevel(dataset, "F", "global"),
  };

  const countable = getCountableEvents(dataset.events);
  const linkedEvents = getAllAILinkedEvents(dataset);

  // Wage and household are US-only: reference wages and the household-size figure
  // are US, so they must not be applied to global or non-US headcounts.
  const wage = getEstimatedWageImpact(dataset, confirmedEvents);
  const household = getEstimatedHouseholdExposure(
    confirmedUs.jobs,
    dataset.householdReference.averageHouseholdSize,
  );
  const wageCoveragePct = confirmed.jobs > 0 ? Math.round((confirmedUs.jobs / confirmed.jobs) * 100) : 0;

  const primaryIds = new Set(
    dataset.sources.filter((s) => s.primarySource).map((s) => s.eventId),
  );
  const secondaryOnly = linkedEvents.filter((e) => !primaryIds.has(e.id)).length;
  const unknownUsHeadcount = linkedEvents.filter((e) => e.usJobsLost === null).length;

  const primaryBenchmark =
    dataset.externalBenchmarks.find((b) => b.primary) ?? dataset.externalBenchmarks[0] ?? null;

  return {
    methodologyVersion: METHODOLOGY_VERSION,
    dataThrough: dataset.meta.dataThrough,
    lastDatasetUpdate: dataset.meta.lastDatasetUpdate,

    // A–C total workforce-action headcount (gated). Public label: "jobs in verified
    // AI-linked workforce reductions", NOT "jobs caused by/replaced by AI".
    confirmed,
    confirmedUs,
    confirmedCompanies: distinctCompanies(confirmedEvents),
    directOrEnabled,
    quantifiedAIAttributed,
    byLevel,
    allLinked,
    direct,
    capital,
    planned,
    plannedCompanies: distinctCompanies(getPlannedEvents(dataset)),

    companiesTracked: distinctCompanies(countable),
    industriesAffected: new Set(
      countable
        .map((e) => dataset.companies.find((c) => c.id === e.companyId)?.industryId)
        .filter(Boolean),
    ).size,
    countriesAffected: getCountriesAffected(dataset),
    countriesCount: getCountriesAffected(dataset).length,

    // Coverage / data-quality panel.
    coverage: {
      trackedEvents: countable.length,
      aiLinkedEvents: linkedEvents.length,
      companiesRepresented: distinctCompanies(countable),
      unknownUsHeadcount,
      secondaryOnly,
    },

    wage: {
      totalAnnualWages: wage.totalAnnualWages,
      usJobsCovered: wage.usJobsCovered,
      eventsCovered: wage.eventsCovered,
      coveragePct: wageCoveragePct,
    },
    household: {
      people: household.people,
      usJobs: household.jobs,
      averageHouseholdSize: household.averageHouseholdSize,
    },

    primaryBenchmark,
  };
}

export type SiteStats = ReturnType<typeof getSiteStats>;
