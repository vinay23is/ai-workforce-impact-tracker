import { describe, expect, it } from "vitest";
import {
  estimateEventWage,
  getEstimatedHouseholdExposure,
  getEstimatedWageImpact,
} from "@/lib/estimates";
import { makeCompany, makeDataset, makeEvent } from "./helpers";
import type { WageReference } from "@/lib/reference";

const ref: WageReference = {
  source: "t",
  sourceUrl: "https://e.com",
  sourceYear: 2023,
  note: "n",
  nationalMedianAnnualWage: 50000,
  byIndustry: [{ industryId: "technology", medianAnnualWage: 100000 }],
};

describe("wage estimation is US-only", () => {
  it("values the verified US headcount, not the global one", () => {
    const event = makeEvent({ globalJobsLost: 1000, usJobsLost: 40 });
    const wage = estimateEventWage(event, makeCompany(), ref);
    expect(wage?.jobsBasis).toBe("us");
    expect(wage?.jobsUsed).toBe(40);
    expect(wage?.estimatedAnnualWage).toBe(40 * 100000);
  });

  it("returns null when the US headcount is unknown, even if global is known", () => {
    const event = makeEvent({ globalJobsLost: 5000, usJobsLost: null });
    expect(estimateEventWage(event, makeCompany(), ref)).toBeNull();
  });

  it("prefers a known compensation figure over reference wages", () => {
    const event = makeEvent({ usJobsLost: 10, knownAnnualCompensationPerWorker: 80000 });
    const wage = estimateEventWage(event, makeCompany(), ref);
    expect(wage?.method).toBe("known_compensation");
    expect(wage?.estimatedAnnualWage).toBe(800000);
  });

  it("never applies a US wage to a global-only headcount in the aggregate", () => {
    const dataset = makeDataset({
      events: [
        makeEvent({ id: "us", slug: "us", globalJobsLost: 100, usJobsLost: 100 }),
        makeEvent({ id: "global", slug: "global", globalJobsLost: 9000, usJobsLost: null }),
      ],
    });
    const impact = getEstimatedWageImpact(dataset, dataset.events);
    expect(impact.eventsCovered).toBe(1);
    expect(impact.eventsWithoutUsHeadcount).toBe(1);
    expect(impact.usJobsCovered).toBe(100);
    expect(impact.totalAnnualWages).toBe(100 * 100000);
  });
});

describe("household estimation is US-only", () => {
  it("multiplies verified US workers by the average household size", () => {
    const exposure = getEstimatedHouseholdExposure(1000, 2.5);
    expect(exposure.people).toBe(2500);
    expect(exposure.jobs).toBe(1000);
  });
});
