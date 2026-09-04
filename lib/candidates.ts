import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ATTRIBUTION_LEVELS, CONFIDENCE_LEVELS } from "./attribution";
import { reductionMechanisms } from "./schemas";

/**
 * A candidate is a REVIEW ARTIFACT produced by automated discovery. It is NOT a
 * WorkforceEvent: it carries pointers to evidence and, at most, *suggested* fields
 * that a human must confirm. Candidates are never loaded by lib/data.ts and never
 * enter any public total. A candidate can never be published.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const httpUrl = z.string().url();

export const candidateStatuses = [
  "NEEDS_REVIEW",
  "IN_REVIEW",
  "PROMOTED",
  "REJECTED",
  "DUPLICATE",
] as const;

export const candidateSourceSchema = z.object({
  url: httpUrl,
  canonicalUrl: z.string().min(1),
  domain: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().nullable().default(null),
  publishedAt: isoDate.nullable().default(null),
  discoveredAt: z.string().min(1),
  provider: z.string().min(1),
  sourceType: z.string().min(1),
  snippet: z.string().nullable().default(null),
});

export const candidateSchema = z
  .object({
    candidateId: z.string().min(1),
    discoveredAt: z.string().min(1),
    status: z.enum(candidateStatuses).default("NEEDS_REVIEW"),
    title: z.string().min(1),
    companyName: z.string().nullable().default(null),
    possibleCompanyId: z.string().nullable().default(null),
    reportedJobs: z.number().int().min(0).nullable().default(null),
    reportedUSJobs: z.number().int().min(0).nullable().default(null),
    announcementDate: isoDate.nullable().default(null),
    sourceUrls: z.array(httpUrl).default([]),
    sources: z.array(candidateSourceSchema).default([]),
    matchedQueries: z.array(z.string()).default([]),
    matchedKeywords: z.array(z.string()).default([]),
    possibleDuplicateOf: z.array(z.string()).default([]),
    // Suggestions only — never treated as verified. Prefer null over a guess.
    suggestedAttribution: z.enum(ATTRIBUTION_LEVELS).nullable().default(null),
    suggestedConfidence: z.enum(CONFIDENCE_LEVELS).nullable().default(null),
    suggestedReductionMechanism: z.enum(reductionMechanisms).nullable().default(null),
    reviewNotes: z.string().nullable().default(null),
    // A candidate must never be publishable. Present-and-false is tolerated; true is rejected.
    published: z.literal(false).optional(),
  })
  .strict();

export type Candidate = z.infer<typeof candidateSchema>;

export const CANDIDATES_DIR = path.join(process.cwd(), "data", "candidates");
export const DISCOVERED_DIR = path.join(CANDIDATES_DIR, "discovered");

/** Load every candidate JSON file (excluding the template and READMEs). */
export function listCandidateFiles(): string[] {
  const files: string[] = [];
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (
        entry.name.endsWith(".json") &&
        entry.name !== "TEMPLATE.json" &&
        !entry.name.startsWith("_")
      ) {
        files.push(full);
      }
    }
  }
  walk(CANDIDATES_DIR);
  return files;
}

export function loadCandidates(): Candidate[] {
  return listCandidateFiles().map((f) => candidateSchema.parse(JSON.parse(fs.readFileSync(f, "utf8"))));
}
