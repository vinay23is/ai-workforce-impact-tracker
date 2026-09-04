import { describe, expect, it } from "vitest";
import {
  getConfirmedJobs,
  getDirectOrEnabledJobs,
  getJobsByLevel,
  getQuantifiedAIAttributedJobs,
} from "@/lib/aggregations";
import { eventSchema } from "@/lib/schemas";
import { makeDataset, makeEvent, makeSource } from "./helpers";

function confirmedDataset() {
  return makeDataset({
    events: [
      makeEvent({ id: "a", slug: "a", attributionLevel: "A", globalJobsLost: 10, sourceIds: ["sa"] }),
      makeEvent({ id: "b", slug: "b", attributionLevel: "B", globalJobsLost: 20, sourceIds: ["sb"] }),
      makeEvent({ id: "c", slug: "c", attributionLevel: "C", confidence: "MEDIUM", globalJobsLost: 21000, sourceIds: ["sc"] }),
    ],
    sources: [
      makeSource({ id: "sa", eventId: "a" }),
      makeSource({ id: "sb", eventId: "b" }),
      makeSource({ id: "sc", eventId: "c" }),
    ],
  });
}

describe("direct-or-enabled (A+B) is a distinct, stronger causal metric", () => {
  it("sums only A and B, not C", () => {
    const dataset = confirmedDataset();
    expect(getConfirmedJobs(dataset).jobs).toBe(21030); // A+B+C
    expect(getDirectOrEnabledJobs(dataset).jobs).toBe(30); // A+B only
  });
});

describe("Category C total is not an AI-attributable count", () => {
  it("counts C's full workforce-action headcount but excludes it from quantified AI-attributed when null", () => {
    const dataset = confirmedDataset();
    // C has global 21000 but no aiAttributedJobsGlobal.
    expect(getConfirmedJobs(dataset).jobs).toBe(21030);
    const quantified = getQuantifiedAIAttributedJobs(dataset, "global");
    expect(quantified.jobs).toBe(0);
    expect(quantified.eventsWithUnknownCount).toBe(3);
  });

  it("only sums an AI-specific figure where a source quantified one", () => {
    const dataset = makeDataset({
      events: [
        makeEvent({ id: "q", slug: "q", attributionLevel: "B", globalJobsLost: 100, aiAttributedJobsGlobal: 40, sourceIds: ["sq"] }),
        makeEvent({ id: "n", slug: "n", attributionLevel: "C", confidence: "MEDIUM", globalJobsLost: 5000, aiAttributedJobsGlobal: null, sourceIds: ["sn"] }),
      ],
      sources: [makeSource({ id: "sq", eventId: "q" }), makeSource({ id: "sn", eventId: "n" })],
    });
    const quantified = getQuantifiedAIAttributedJobs(dataset, "global");
    expect(quantified.jobs).toBe(40);
    expect(quantified.eventsWithKnownCount).toBe(1);
    expect(quantified.eventsWithUnknownCount).toBe(1);
  });
});

describe("per-level totals", () => {
  it("reports each attribution level separately", () => {
    const dataset = confirmedDataset();
    expect(getJobsByLevel(dataset, "A").jobs).toBe(10);
    expect(getJobsByLevel(dataset, "B").jobs).toBe(20);
    expect(getJobsByLevel(dataset, "C").jobs).toBe(21000);
    expect(getJobsByLevel(dataset, "D").jobs).toBe(0);
  });
});

describe("schema: AI-attributed and reduction mechanism", () => {
  it("accepts a valid reduction mechanism and rejects an invalid one", () => {
    expect(eventSchema.safeParse(makeEvent({ reductionMechanism: "NET_HEADCOUNT_DECLINE" })).success).toBe(true);
    expect(eventSchema.safeParse(makeEvent({ reductionMechanism: "BOGUS" as never })).success).toBe(false);
  });

  it("rejects AI-attributed global exceeding total global", () => {
    expect(
      eventSchema.safeParse(makeEvent({ globalJobsLost: 100, aiAttributedJobsGlobal: 200 })).success,
    ).toBe(false);
  });

  it("rejects AI-attributed US exceeding AI-attributed global", () => {
    expect(
      eventSchema.safeParse(
        makeEvent({ globalJobsLost: 100, usJobsLost: 100, aiAttributedJobsGlobal: 40, aiAttributedJobsUS: 60 }),
      ).success,
    ).toBe(false);
  });

  it("keeps a null AI-attributed value null (defaults, no coercion to 0)", () => {
    const parsed = eventSchema.parse(makeEvent({ globalJobsLost: 21000 }));
    expect(parsed.aiAttributedJobsGlobal).toBeNull();
    expect(parsed.aiAttributedJobsUS).toBeNull();
    expect(parsed.reductionMechanism).toBe("UNKNOWN");
  });
});
