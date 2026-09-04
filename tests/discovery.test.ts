import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";

// Mock the HTTP layer so provider-failure tests need no network and no real backoff.
vi.mock("@/scripts/discovery/http", () => ({
  fetchJson: vi.fn(() => Promise.reject(new Error("network down"))),
  fetchText: vi.fn(() => Promise.reject(new Error("network down"))),
  sleep: vi.fn(() => Promise.resolve()),
}));

import { secProvider } from "@/scripts/discovery/providers/sec";
import { gdeltProvider } from "@/scripts/discovery/providers/gdelt";
import { runDiscovery } from "@/scripts/discovery";
import type { DiscoveryContext } from "@/scripts/discovery/types";

const ctx: DiscoveryContext = {
  companies: [{ id: "oracle", name: "Oracle", ticker: "ORCL" }],
  aiKeywords: ["AI"],
  workforceKeywords: ["layoffs"],
  log: () => {},
  today: "2026-09-04",
};

const DISCOVERED_DIR = path.join(process.cwd(), "data", "candidates", "discovered");
const METHODOLOGY = path.join(process.cwd(), "data", "methodology.json");

afterAll(() => {
  fs.rmSync(DISCOVERED_DIR, { recursive: true, force: true });
});

describe("provider enable/disable defaults", () => {
  it("SEC is enabled by default; GDELT is disabled by default", () => {
    expect(secProvider.isEnabled()).toBe(true);
    expect(gdeltProvider.isEnabled()).toBe(false);
  });
});

describe("provider failure never throws or fabricates", () => {
  it("SEC returns [] when the network fails", async () => {
    await expect(secProvider.discover(ctx)).resolves.toEqual([]);
  });

  it("GDELT returns [] when enabled but the network fails", async () => {
    process.env.DISCOVERY_ENABLE_GDELT = "1";
    try {
      expect(gdeltProvider.isEnabled()).toBe(true);
      await expect(gdeltProvider.discover(ctx)).resolves.toEqual([]);
    } finally {
      delete process.env.DISCOVERY_ENABLE_GDELT;
    }
  });
});

describe("discovery does not touch production data or coverage dates", () => {
  it("with providers disabled, produces no candidates and leaves methodology.json unchanged", async () => {
    process.env.DISCOVERY_DISABLE_SEC = "1";
    const before = fs.readFileSync(METHODOLOGY, "utf8");
    try {
      const summary = await runDiscovery();
      expect(summary.newCandidates).toBe(0);
      expect(summary.candidateIds).toEqual([]);
    } finally {
      delete process.env.DISCOVERY_DISABLE_SEC;
    }
    expect(fs.readFileSync(METHODOLOGY, "utf8")).toBe(before);
  });
});
