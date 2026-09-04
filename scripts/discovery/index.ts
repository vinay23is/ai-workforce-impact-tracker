import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadDataset } from "../../lib/data";
import { loadCandidates, candidateSchema, DISCOVERED_DIR, type Candidate } from "../../lib/candidates";
import { buildDedupeIndex, findPossibleDuplicates } from "./dedupe";
import type { DiscoveredItem, DiscoveryContext, Provider, ProviderRunResult } from "./types";
import { secProvider } from "./providers/sec";
import { gdeltProvider } from "./providers/gdelt";

const AI_KEYWORDS = ["artificial intelligence", "generative AI", "AI agents", "AI", "automation"];
const WORKFORCE_KEYWORDS = [
  "layoffs",
  "job cuts",
  "workforce reduction",
  "headcount reduction",
  "role elimination",
  "restructuring",
  "fewer employees",
  "reduction in force",
];

const PROVIDERS: Provider[] = [secProvider, gdeltProvider];

export interface DiscoverySummary {
  today: string;
  providerResults: ProviderRunResult[];
  itemsDiscovered: number;
  newCandidates: number;
  deduped: number;
  candidateIds: string[];
}

function candidateIdFor(canonicalUrl: string, today: string): string {
  const hash = crypto.createHash("sha1").update(canonicalUrl).digest("hex").slice(0, 10);
  return `disc-${today.replace(/-/g, "")}-${hash}`;
}

function toCandidate(item: DiscoveredItem, possibleDuplicateOf: string[], today: string): Candidate {
  const candidate = {
    candidateId: candidateIdFor(item.canonicalUrl, today),
    discoveredAt: item.discoveredAt,
    status: "NEEDS_REVIEW" as const,
    title: item.title,
    companyName: item.possibleCompanyName,
    possibleCompanyId: item.possibleCompanyId,
    reportedJobs: item.possibleJobs,
    reportedUSJobs: null,
    announcementDate: null,
    sourceUrls: [item.url],
    sources: [
      {
        url: item.url,
        canonicalUrl: item.canonicalUrl,
        domain: item.domain,
        title: item.title,
        publisher: item.publisher,
        publishedAt: item.publishedAt,
        discoveredAt: item.discoveredAt,
        provider: item.provider,
        sourceType: item.sourceType,
        snippet: item.snippet,
      },
    ],
    matchedQueries: [item.query],
    matchedKeywords: item.matchedKeywords,
    possibleDuplicateOf,
    suggestedAttribution: null,
    suggestedConfidence: null,
    suggestedReductionMechanism: null,
    reviewNotes:
      `Auto-discovered via ${item.provider}. This is a keyword/discovery match only and does NOT ` +
      `establish that AI caused any workforce change. A human must verify the primary source and ` +
      `determine attribution before promotion.`,
  };
  // Parse to apply defaults and guarantee it satisfies the candidate schema.
  return candidateSchema.parse(candidate);
}

export async function runDiscovery(): Promise<DiscoverySummary> {
  const dataset = loadDataset();
  const existingCandidates = loadCandidates();
  const today = new Date().toISOString().slice(0, 10);

  const ctx: DiscoveryContext = {
    companies: dataset.companies.map((c) => ({ id: c.id, name: c.name, ticker: c.ticker })),
    aiKeywords: AI_KEYWORDS,
    workforceKeywords: WORKFORCE_KEYWORDS,
    log: (msg) => console.log(`  ${msg}`),
    today,
  };

  const providerResults: ProviderRunResult[] = [];
  const allItems: DiscoveredItem[] = [];

  for (const provider of PROVIDERS) {
    if (!provider.isEnabled()) {
      console.log(`Provider ${provider.name}: disabled (skipped).`);
      providerResults.push({ provider: provider.name, enabled: false, ok: true, items: 0, error: null });
      continue;
    }
    console.log(`Provider ${provider.name}: running...`);
    try {
      const items = await provider.discover(ctx);
      allItems.push(...items);
      providerResults.push({ provider: provider.name, enabled: true, ok: true, items: items.length, error: null });
      console.log(`Provider ${provider.name}: ${items.length} item(s).`);
    } catch (error) {
      // Should not happen (providers swallow errors), but never let it break the run.
      providerResults.push({
        provider: provider.name,
        enabled: true,
        ok: false,
        items: 0,
        error: (error as Error).message,
      });
      console.log(`Provider ${provider.name}: FAILED (${(error as Error).message}). Continuing.`);
    }
  }

  const index = buildDedupeIndex(dataset.events, dataset.sources, existingCandidates);

  const seenThisRun = new Set<string>();
  const newCandidates: Candidate[] = [];
  let deduped = 0;

  for (const item of allItems) {
    if (seenThisRun.has(item.canonicalUrl)) continue;
    seenThisRun.add(item.canonicalUrl);

    // Already a known event source or existing candidate URL -> not a new candidate.
    if (index.eventSourceCanonicals.has(item.canonicalUrl) || index.candidateCanonicals.has(item.canonicalUrl)) {
      deduped += 1;
      continue;
    }
    const dupes = findPossibleDuplicates(item, index);
    newCandidates.push(toCandidate(item, dupes, today));
  }

  fs.mkdirSync(DISCOVERED_DIR, { recursive: true });
  const written: string[] = [];
  for (const candidate of newCandidates) {
    const file = path.join(DISCOVERED_DIR, `${candidate.candidateId}.json`);
    if (fs.existsSync(file)) {
      deduped += 1;
      continue; // Deterministic id already on disk from a prior run.
    }
    fs.writeFileSync(file, JSON.stringify(candidate, null, 2) + "\n");
    written.push(candidate.candidateId);
  }

  // Discovery metadata lives with candidates and never touches methodology.json.
  // lastDiscoveryRun (automation ran) is NOT dataThrough (humans reviewed through).
  const logFile = path.join(DISCOVERED_DIR, "_discovery-log.json");
  fs.writeFileSync(
    logFile,
    JSON.stringify(
      { lastDiscoveryRun: new Date().toISOString(), today, providerResults, newCandidates: written.length },
      null,
      2,
    ) + "\n",
  );

  return {
    today,
    providerResults,
    itemsDiscovered: allItems.length,
    newCandidates: written.length,
    deduped,
    candidateIds: written,
  };
}
