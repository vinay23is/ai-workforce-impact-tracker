import { describe, expect, it } from "vitest";
import {
  getAllAILinkedJobs,
  getCapitalReallocationJobs,
  getConfirmedEvents,
  getConfirmedJobs,
  getCountableEvents,
  getDirectReplacementJobs,
  getPlannedJobs,
  isConfirmed,
} from "@/lib/aggregations";
import { makeDataset, makeEvent, makeSource } from "./helpers";

describe("confirmed aggregation", () => {
  it("sums global jobs for A/B/C events that clear the confidence bar and have an AI source", () => {
    const dataset = makeDataset({
      events: [
        makeEvent({ id: "a", slug: "a", sourceIds: ["s-a"], attributionLevel: "A", globalJobsLost: 100 }),
        makeEvent({ id: "b", slug: "b", sourceIds: ["s-b"], attributionLevel: "C", confidence: "MEDIUM", globalJobsLost: 50 }),
      ],
      sources: [makeSource({ id: "s-a", eventId: "a" }), makeSource({ id: "s-b", eventId: "b" })],
    });
    expect(getConfirmedJobs(dataset).jobs).toBe(150);
  });

  it("excludes an A/B/C event with no AI-attribution source from the confirmed total", () => {
    const dataset = makeDataset({
      events: [makeEvent({ id: "a", slug: "a", sourceIds: ["s-a"], globalJobsLost: 100 })],
      sources: [makeSource({ id: "s-a", eventId: "a", supportsAIAttribution: false })],
    });
    expect(getConfirmedJobs(dataset).jobs).toBe(0);
    expect(isConfirmed(dataset.events[0]!, dataset.sources)).toBe(false);
  });

  it("excludes events below the MEDIUM confidence threshold", () => {
    const dataset = makeDataset({
      events: [makeEvent({ id: "a", slug: "a", confidence: "LOW", globalJobsLost: 100 })],
      sources: [makeSource({ id: "src-1", eventId: "a" })],
    });
    expect(getConfirmedJobs(dataset).jobs).toBe(0);
  });
});

describe("attribution filtering", () => {
  it("keeps context-only (F) records out of every AI-attributed total", () => {
    const dataset = makeDataset({
      events: [
        makeEvent({ id: "f", slug: "f", attributionLevel: "F", confidence: "UNCONFIRMED", globalJobsLost: 9000 }),
      ],
      sources: [makeSource({ id: "src-1", eventId: "f", supportsAIAttribution: false })],
    });
    expect(getConfirmedJobs(dataset).jobs).toBe(0);
    expect(getAllAILinkedJobs(dataset).jobs).toBe(0);
    expect(getDirectReplacementJobs(dataset).jobs).toBe(0);
  });

  it("counts D as capital reallocation and AI-linked but not confirmed or direct", () => {
    const dataset = makeDataset({
      events: [makeEvent({ id: "d", slug: "d", attributionLevel: "D", globalJobsLost: 200 })],
      sources: [makeSource({ id: "src-1", eventId: "d" })],
    });
    expect(getConfirmedJobs(dataset).jobs).toBe(0);
    expect(getCapitalReallocationJobs(dataset).jobs).toBe(200);
    expect(getAllAILinkedJobs(dataset).jobs).toBe(200);
    expect(getDirectReplacementJobs(dataset).jobs).toBe(0);
  });

  it("counts only A as direct replacement", () => {
    const dataset = makeDataset({
      events: [
        makeEvent({ id: "a", slug: "a", attributionLevel: "A", globalJobsLost: 10 }),
        makeEvent({ id: "b", slug: "b", attributionLevel: "B", globalJobsLost: 20, sourceIds: ["s-b"] }),
      ],
      sources: [makeSource({ id: "src-1", eventId: "a" }), makeSource({ id: "s-b", eventId: "b" })],
    });
    expect(getDirectReplacementJobs(dataset).jobs).toBe(10);
  });
});

describe("US versus global distinction", () => {
  it("keeps US and global sums independent and never assumes the remainder is US", () => {
    const dataset = makeDataset({
      events: [makeEvent({ id: "a", slug: "a", globalJobsLost: 10000, usJobsLost: 4000 })],
      sources: [makeSource({ id: "src-1", eventId: "a" })],
    });
    expect(getConfirmedJobs(dataset, "global").jobs).toBe(10000);
    expect(getConfirmedJobs(dataset, "us").jobs).toBe(4000);
  });

  it("treats an unknown US count as unknown, not zero", () => {
    const dataset = makeDataset({
      events: [makeEvent({ id: "a", slug: "a", globalJobsLost: 10000, usJobsLost: null })],
      sources: [makeSource({ id: "src-1", eventId: "a" })],
    });
    const us = getConfirmedJobs(dataset, "us");
    expect(us.jobs).toBe(0);
    expect(us.eventsWithUnknownCount).toBe(1);
    expect(us.eventsWithKnownCount).toBe(0);
  });
});

describe("planned versus executed", () => {
  it("excludes planned events from executed totals and reports them separately", () => {
    const dataset = makeDataset({
      events: [
        makeEvent({ id: "p", slug: "p", status: "planned", attributionLevel: "B", globalJobsLost: 10000 }),
      ],
      sources: [makeSource({ id: "src-1", eventId: "p" })],
    });
    expect(getConfirmedJobs(dataset).jobs).toBe(0);
    expect(getAllAILinkedJobs(dataset).jobs).toBe(0);
    expect(getPlannedJobs(dataset).jobs).toBe(10000);
  });
});

describe("duplicate prevention", () => {
  it("does not count a program parent alongside its stage events", () => {
    const dataset = makeDataset({
      events: [
        makeEvent({ id: "parent", slug: "parent", globalJobsLost: 300, sourceIds: ["s-p"] }),
        makeEvent({ id: "child-1", slug: "child-1", parentEventId: "parent", globalJobsLost: 100, sourceIds: ["s-1"] }),
        makeEvent({ id: "child-2", slug: "child-2", parentEventId: "parent", globalJobsLost: 200, sourceIds: ["s-2"] }),
      ],
      sources: [
        makeSource({ id: "s-p", eventId: "parent" }),
        makeSource({ id: "s-1", eventId: "child-1" }),
        makeSource({ id: "s-2", eventId: "child-2" }),
      ],
    });
    const countable = getCountableEvents(dataset.events).map((e) => e.id);
    expect(countable).not.toContain("parent");
    expect(getConfirmedJobs(dataset).jobs).toBe(300);
  });

  it("ignores unpublished events entirely", () => {
    const dataset = makeDataset({
      events: [makeEvent({ id: "a", slug: "a", published: false, globalJobsLost: 500 })],
      sources: [makeSource({ id: "src-1", eventId: "a" })],
    });
    expect(getConfirmedEvents(dataset)).toHaveLength(0);
  });
});
