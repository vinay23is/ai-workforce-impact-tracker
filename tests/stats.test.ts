import { describe, expect, it } from "vitest";
import { getSiteStats } from "@/lib/stats";
import { makeDataset, makeEvent, makeSource } from "./helpers";
import type { ExternalBenchmark } from "@/lib/reference";

function datasetWith(events = 2) {
  return makeDataset({
    events: [
      makeEvent({ id: "a", slug: "a", companyId: "acme", sourceIds: ["s-a"], globalJobsLost: 100, usJobsLost: 40 }),
      makeEvent({ id: "b", slug: "b", companyId: "beta", sourceIds: ["s-b"], globalJobsLost: 60, usJobsLost: null }),
    ].slice(0, events),
    companies: [
      { id: "acme", slug: "acme", name: "Acme", ticker: null, industryId: "technology", website: null, headquarters: null, latestKnownWorkforce: null, workforceAsOf: null, description: "x" },
      { id: "beta", slug: "beta", name: "Beta", ticker: null, industryId: "technology", website: null, headquarters: null, latestKnownWorkforce: null, workforceAsOf: null, description: "x" },
    ],
    sources: [makeSource({ id: "s-a", eventId: "a" }), makeSource({ id: "s-b", eventId: "b" })],
  });
}

describe("confirmed company count uses the confirmed population", () => {
  it("counts only companies with a confirmed event, not all tracked companies", () => {
    const dataset = makeDataset({
      events: [
        makeEvent({ id: "a", slug: "a", companyId: "acme", sourceIds: ["s-a"], attributionLevel: "A", globalJobsLost: 100 }),
        makeEvent({ id: "f", slug: "f", companyId: "beta", sourceIds: ["s-f"], attributionLevel: "F", confidence: "UNCONFIRMED", globalJobsLost: 9000 }),
      ],
      companies: [
        { id: "acme", slug: "acme", name: "Acme", ticker: null, industryId: "technology", website: null, headquarters: null, latestKnownWorkforce: null, workforceAsOf: null, description: "x" },
        { id: "beta", slug: "beta", name: "Beta", ticker: null, industryId: "technology", website: null, headquarters: null, latestKnownWorkforce: null, workforceAsOf: null, description: "x" },
      ],
      sources: [makeSource({ id: "s-a", eventId: "a" }), makeSource({ id: "s-f", eventId: "f", supportsAIAttribution: false })],
    });
    const stats = getSiteStats(dataset);
    expect(stats.confirmed.events).toBe(1);
    expect(stats.confirmedCompanies).toBe(1);
    expect(stats.companiesTracked).toBe(2);
  });
});

describe("US-only estimates in site stats", () => {
  it("household people is verified US jobs times household size, not global", () => {
    const dataset = datasetWith();
    const stats = getSiteStats(dataset);
    // Only event 'a' has a US headcount of 40.
    expect(stats.confirmedUs.jobs).toBe(40);
    expect(stats.household.usJobs).toBe(40);
    expect(stats.household.people).toBe(Math.round(40 * dataset.householdReference.averageHouseholdSize));
  });

  it("wage total values only US headcount and reports coverage share", () => {
    const dataset = datasetWith();
    const stats = getSiteStats(dataset);
    expect(stats.wage.usJobsCovered).toBe(40);
    // confirmed global jobs = 100 + 60 = 160; US-covered = 40 -> 25%.
    expect(stats.wage.coveragePct).toBe(25);
  });
});

describe("external benchmarks never enter internal aggregates", () => {
  it("adding a benchmark does not change any headline total", () => {
    const base = datasetWith();
    const benchmark: ExternalBenchmark = {
      id: "x",
      publisher: "Someone",
      metric: "announced AI cuts",
      periodStart: "2026-01-01",
      periodEnd: "2026-08-31",
      jobs: 999999,
      geography: "United States",
      scope: "announced",
      sourceUrl: "https://example.com",
      retrievedAt: "2026-09-01",
      methodologyNote: "n",
      primary: true,
    };
    const withBenchmark = makeDataset({ ...base, externalBenchmarks: [benchmark] });
    expect(getSiteStats(withBenchmark).confirmed.jobs).toBe(getSiteStats(base).confirmed.jobs);
    expect(getSiteStats(withBenchmark).allLinked.jobs).toBe(getSiteStats(base).allLinked.jobs);
    expect(getSiteStats(withBenchmark).primaryBenchmark?.jobs).toBe(999999);
  });
});
