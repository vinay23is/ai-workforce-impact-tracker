import type { Dataset } from "./data";
import {
  getAllAILinkedEvents,
  getAllAILinkedJobs,
  getCapitalReallocationJobs,
  getConfirmedEvents,
  getConfirmedJobs,
  getCountriesAffected,
  getDirectReplacementJobs,
  getPlannedJobs,
  getCountableEvents,
} from "./aggregations";
import { getEstimatedHouseholdExposure, getEstimatedWageImpact } from "./estimates";
import { METHODOLOGY_VERSION } from "./attribution";

/**
 * The one place headline numbers are computed. Pages and the generated public
 * JSON both read from here, so a figure can never differ between the site and
 * the downloadable data.
 */
export function getSiteStats(dataset: Dataset) {
  const confirmed = getConfirmedJobs(dataset, "global");
  const confirmedUs = getConfirmedJobs(dataset, "us");
  const allLinked = getAllAILinkedJobs(dataset, "global");
  const direct = getDirectReplacementJobs(dataset, "global");
  const capital = getCapitalReallocationJobs(dataset, "global");
  const planned = getPlannedJobs(dataset, "global");

  const publishedCountable = getCountableEvents(dataset.events);
  const companiesTracked = new Set(publishedCountable.map((e) => e.companyId)).size;
  const industriesAffected = new Set(
    publishedCountable
      .map((e) => dataset.companies.find((c) => c.id === e.companyId)?.industryId)
      .filter(Boolean),
  ).size;
  const countries = getCountriesAffected(dataset);

  const wage = getEstimatedWageImpact(dataset, getConfirmedEvents(dataset));
  const household = getEstimatedHouseholdExposure(
    confirmed.jobs,
    dataset.householdReference.averageHouseholdSize,
  );

  return {
    methodologyVersion: METHODOLOGY_VERSION,
    dataThrough: dataset.meta.dataThrough,
    lastDatasetUpdate: dataset.meta.lastDatasetUpdate,
    confirmed,
    confirmedUs,
    allLinked,
    direct,
    capital,
    planned,
    companiesTracked,
    industriesAffected,
    countriesAffected: countries,
    countriesCount: countries.length,
    aiLinkedEvents: getAllAILinkedEvents(dataset).length,
    wage: {
      totalAnnualWages: wage.totalAnnualWages,
      jobsCovered: wage.jobsCovered,
      eventsCovered: wage.eventsCovered,
      eventsWithoutEstimate: wage.eventsWithoutEstimate,
    },
    household: {
      people: household.people,
      averageHouseholdSize: household.averageHouseholdSize,
    },
  };
}

export type SiteStats = ReturnType<typeof getSiteStats>;
