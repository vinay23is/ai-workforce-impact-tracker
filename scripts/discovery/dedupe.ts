import type { Candidate } from "../../lib/candidates";
import type { Source, WorkforceEvent } from "../../lib/schemas";
import { canonicalUrl } from "./normalize";
import type { DiscoveredItem } from "./types";

export interface DedupeIndex {
  eventSourceCanonicals: Map<string, string>; // canonicalUrl -> eventId
  candidateCanonicals: Map<string, string>; // canonicalUrl -> candidateId
  events: WorkforceEvent[];
  candidates: Candidate[];
}

export function buildDedupeIndex(
  events: WorkforceEvent[],
  sources: Source[],
  candidates: Candidate[],
): DedupeIndex {
  const eventSourceCanonicals = new Map<string, string>();
  for (const s of sources) {
    eventSourceCanonicals.set(canonicalUrl(s.url), s.eventId);
  }
  const candidateCanonicals = new Map<string, string>();
  for (const c of candidates) {
    for (const cs of c.sources) candidateCanonicals.set(cs.canonicalUrl, c.candidateId);
    for (const u of c.sourceUrls) candidateCanonicals.set(canonicalUrl(u), c.candidateId);
  }
  return { eventSourceCanonicals, candidateCanonicals, events, candidates };
}

function daysApart(a: string, b: string): number {
  return Math.abs((Date.parse(a) - Date.parse(b)) / 86_400_000);
}

/**
 * Returns ids of likely-existing matches (event ids or candidate ids). This never
 * deletes anything: an uncertain match is recorded on the candidate as
 * possibleDuplicateOf for a human to resolve.
 */
export function findPossibleDuplicates(item: DiscoveredItem, index: DedupeIndex): string[] {
  const hits = new Set<string>();

  const byUrlEvent = index.eventSourceCanonicals.get(item.canonicalUrl);
  if (byUrlEvent) hits.add(byUrlEvent);

  const byUrlCandidate = index.candidateCanonicals.get(item.canonicalUrl);
  if (byUrlCandidate) hits.add(byUrlCandidate);

  if (item.possibleCompanyId) {
    for (const e of index.events) {
      if (e.companyId !== item.possibleCompanyId) continue;
      if (item.publishedAt && daysApart(e.announcementDate, item.publishedAt) <= 21) {
        hits.add(e.id);
      } else if (!item.publishedAt) {
        // Company matches but no date to compare: flag softly for review.
        hits.add(e.id);
      }
    }
    for (const c of index.candidates) {
      if (c.possibleCompanyId === item.possibleCompanyId) hits.add(c.candidateId);
    }
  }

  return [...hits];
}
