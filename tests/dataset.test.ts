import { describe, expect, it } from "vitest";
import { loadDataset, getSourcesForEvent } from "@/lib/data";
import { getConfirmedEvents } from "@/lib/aggregations";
import { eventSchema } from "@/lib/schemas";
import { makeEvent } from "./helpers";

const dataset = loadDataset();

describe("real dataset integrity", () => {
  it("loads and shape-validates without throwing", () => {
    expect(dataset.events.length).toBeGreaterThan(0);
  });

  it("gives every published event at least one source", () => {
    for (const event of dataset.events.filter((e) => e.published)) {
      expect(getSourcesForEvent(dataset, event.id).length).toBeGreaterThan(0);
    }
  });

  it("backs every confirmed event with an AI-attribution source", () => {
    for (const event of getConfirmedEvents(dataset)) {
      const hasAI = getSourcesForEvent(dataset, event.id).some((s) => s.supportsAIAttribution);
      expect(hasAI, `event ${event.id} lacks an AI-attribution source`).toBe(true);
    }
  });

  it("points every correction at an existing event", () => {
    const ids = new Set(dataset.events.map((e) => e.id));
    for (const correction of dataset.corrections) {
      if (correction.eventId) expect(ids.has(correction.eventId)).toBe(true);
    }
  });

  it("loads 2026 events automatically from the year files", () => {
    expect(dataset.events.some((e) => e.announcementDate.startsWith("2026"))).toBe(true);
  });

  it("keeps dataThrough at or after the newest published event", () => {
    const newest = dataset.events
      .filter((e) => e.published)
      .map((e) => e.announcementDate)
      .sort()
      .at(-1)!;
    expect(dataset.meta.dataThrough >= newest).toBe(true);
  });

  it("carries external benchmarks that are separate from the event ledger", () => {
    expect(dataset.externalBenchmarks.length).toBeGreaterThan(0);
    const eventIds = new Set(dataset.events.map((e) => e.id));
    for (const b of dataset.externalBenchmarks) expect(eventIds.has(b.id)).toBe(false);
  });
});

describe("schema rejects invalid events", () => {
  it("rejects a negative headcount", () => {
    expect(eventSchema.safeParse(makeEvent({ globalJobsLost: -5 })).success).toBe(false);
  });

  it("rejects US jobs exceeding global jobs", () => {
    expect(
      eventSchema.safeParse(makeEvent({ globalJobsLost: 100, usJobsLost: 200 })).success,
    ).toBe(false);
  });

  it("rejects an unknown attribution level", () => {
    expect(
      eventSchema.safeParse(makeEvent({ attributionLevel: "Z" as never })).success,
    ).toBe(false);
  });

  it("requires at least one 'what we don't know' entry", () => {
    expect(eventSchema.safeParse(makeEvent({ whatWeDontKnow: [] })).success).toBe(false);
  });

  it("rejects an invalid announcement date", () => {
    expect(eventSchema.safeParse(makeEvent({ announcementDate: "2025-13-40" })).success).toBe(false);
  });
});
