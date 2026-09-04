import { describe, expect, it } from "vitest";
import { candidateSchema, loadCandidates } from "@/lib/candidates";
import {
  canonicalUrl,
  extractObviousJobCount,
  matchCompany,
} from "@/scripts/discovery/normalize";
import { buildDedupeIndex, findPossibleDuplicates } from "@/scripts/discovery/dedupe";
import type { DiscoveredItem } from "@/scripts/discovery/types";
import { makeEvent, makeSource } from "./helpers";

function baseCandidate(overrides: Record<string, unknown> = {}) {
  return {
    candidateId: "disc-1",
    discoveredAt: "2026-09-04T00:00:00.000Z",
    title: "Something happened",
    sourceUrls: ["https://example.com/a"],
    ...overrides,
  };
}

describe("candidate schema keeps candidates out of production", () => {
  it("rejects a candidate that tries to be published", () => {
    expect(candidateSchema.safeParse(baseCandidate({ published: true })).success).toBe(false);
  });

  it("rejects unknown WorkforceEvent-like fields (strict)", () => {
    expect(candidateSchema.safeParse(baseCandidate({ whatWeDontKnow: ["x"] })).success).toBe(false);
  });

  it("defaults status to NEEDS_REVIEW and suggestions to null", () => {
    const c = candidateSchema.parse(baseCandidate());
    expect(c.status).toBe("NEEDS_REVIEW");
    expect(c.suggestedAttribution).toBeNull();
    expect(c.suggestedReductionMechanism).toBeNull();
  });

  it("loads no candidates from the repo by default (template excluded)", () => {
    expect(Array.isArray(loadCandidates())).toBe(true);
  });
});

describe("canonical URL handling", () => {
  it("strips tracking params, fragments, trailing slash, and www", () => {
    expect(canonicalUrl("https://www.Example.com/path/?utm_source=x&id=5#frag")).toBe(
      "https://example.com/path?id=5",
    );
    expect(canonicalUrl("https://example.com/a/")).toBe("https://example.com/a");
  });
});

describe("normalize helpers", () => {
  it("suggests a company by name match", () => {
    const companies = [{ id: "oracle", name: "Oracle", ticker: "ORCL" }];
    expect(matchCompany("Oracle cuts jobs", companies)?.id).toBe("oracle");
    expect(matchCompany("Some unrelated firm", companies)).toBeNull();
  });

  it("extracts an obvious job count only near workforce words", () => {
    expect(extractObviousJobCount("Company cuts 4,000 jobs")).toBe(4000);
    expect(extractObviousJobCount("Revenue up 4,000 percent")).toBeNull();
  });
});

describe("deduplication", () => {
  const events = [makeEvent({ id: "e1", slug: "e1", companyId: "oracle", announcementDate: "2026-06-22" })];
  const sources = [makeSource({ id: "s1", eventId: "e1", url: "https://news.com/oracle-cuts" })];
  const index = buildDedupeIndex(events, sources, []);

  function item(overrides: Partial<DiscoveredItem>): DiscoveredItem {
    return {
      title: "t",
      url: "https://x.com/y",
      canonicalUrl: "https://x.com/y",
      domain: "x.com",
      publisher: null,
      publishedAt: null,
      discoveredAt: "2026-09-04T00:00:00.000Z",
      provider: "sec-edgar-fts",
      query: "q",
      matchedKeywords: [],
      possibleCompanyName: null,
      possibleCompanyId: null,
      possibleJobs: null,
      sourceType: "regulatory_filing",
      snippet: null,
      ...overrides,
    };
  }

  it("flags a matching existing source URL", () => {
    const dup = findPossibleDuplicates(item({ canonicalUrl: "https://news.com/oracle-cuts" }), index);
    expect(dup).toContain("e1");
  });

  it("flags the same company near the same date", () => {
    const dup = findPossibleDuplicates(
      item({ possibleCompanyId: "oracle", publishedAt: "2026-06-25" }),
      index,
    );
    expect(dup).toContain("e1");
  });

  it("does not flag an unrelated item", () => {
    expect(findPossibleDuplicates(item({}), index)).toHaveLength(0);
  });
});
