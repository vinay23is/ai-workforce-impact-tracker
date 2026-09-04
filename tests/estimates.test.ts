import { describe, expect, it } from "vitest";
import {
  estimateEventWage,
  getEstimatedHouseholdExposure,
  getEstimatedWageImpact,
} from "@/lib/estimates";
import { makeCompany, makeDataset, makeEvent } from "./helpers";

describe("wage estimation", () => {
  it("prefers a known compensation figure over reference wages", () => {
    const event = makeEvent({ globalJobsLost: 10, knownAnnualCompensationPerWorker: 80000 });
    const wage = estimateEventWage(event, makeCompany(), {
      source: "t",
      sourceUrl: "https://e.com",
      sourceYear: 2023,
      note: "n",
      nationalMedianAnnualWage: 50000,
      byIndustry: [{ industryId: "technology", medianAnnualWage: 100000 }],
    });
    expect(wage?.method).toBe("known_compensation");
    expect(wage?.estimatedAnnualWage).toBe(800000);
  });

  it("uses the US headcount when available and falls back to global otherwise", () => {
    const usEvent = makeEvent({ globalJobsLost: 100, usJobsLost: 40 });
    const globalEvent = makeEvent({ globalJobsLost: 100, usJobsLost: null });
    const ref = {
      source: "t",
      sourceUrl: "https://e.com",
      sourceYear: 2023,
      note: "n",
      nationalMedianAnnualWage: 50000,
      byIndustry: [{ industryId: "technology", medianAnnualWage: 100000 }],
    };
    expect(estimateEventWage(usEvent, makeCompany(), ref)?.jobsBasis).toBe("us");
    expect(estimateEventWage(usEvent, makeCompany(), ref)?.jobsUsed).toBe(40);
    expect(estimateEventWage(globalEvent, makeCompany(), ref)?.jobsBasis).toBe("global");
  });

  it("returns null when there is no headcount to estimate from", () => {
    const event = makeEvent({ globalJobsLost: null, usJobsLost: null });
    expect(estimateEventWage(event, makeCompany(), {
      source: "t",
      sourceUrl: "https://e.com",
      sourceYear: 2023,
      note: "n",
      nationalMedianAnnualWage: 50000,
      byIndustry: [],
    })).toBeNull();
  });

  it("aggregates wages and reports events it could not estimate", () => {
    const dataset = makeDataset({
      events: [
        makeEvent({ id: "a", slug: "a", globalJobsLost: 100 }),
        makeEvent({ id: "b", slug: "b", globalJobsLost: null }),
      ],
    });
    const impact = getEstimatedWageImpact(dataset, dataset.events);
    expect(impact.eventsCovered).toBe(1);
    expect(impact.eventsWithoutEstimate).toBe(1);
    expect(impact.totalAnnualWages).toBe(100 * 100000);
  });
});

describe("household estimation", () => {
  it("multiplies affected workers by the average household size", () => {
    const exposure = getEstimatedHouseholdExposure(1000, 2.5);
    expect(exposure.people).toBe(2500);
    expect(exposure.averageHouseholdSize).toBe(2.5);
  });
});
