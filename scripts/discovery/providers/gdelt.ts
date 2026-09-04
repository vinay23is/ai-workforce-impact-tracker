import { fetchJson, sleep } from "../http";
import { canonicalUrl, domainOf, extractObviousJobCount, matchCompany } from "../normalize";
import type { DiscoveredItem, DiscoveryContext, Provider } from "../types";

const ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";

// A small, precise set of AI + workforce phrase combinations.
const QUERIES = [
  '("artificial intelligence" OR "generative AI" OR "AI agents") (layoffs OR "job cuts")',
  '("artificial intelligence" OR automation) ("workforce reduction" OR "role elimination" OR "fewer employees")',
];

interface GdeltArticle {
  url?: string;
  title?: string;
  seendate?: string; // YYYYMMDDTHHMMSSZ
  domain?: string;
}
interface GdeltResponse {
  articles?: GdeltArticle[];
}

function seendateToIso(seendate: string | undefined): string | null {
  if (!seendate || seendate.length < 8) return null;
  return `${seendate.slice(0, 4)}-${seendate.slice(4, 6)}-${seendate.slice(6, 8)}`;
}

/**
 * GDELT DOC 2.0. Disabled by default: from our test environment the endpoint
 * consistently returns HTTP 429 (rate limited). Enable with DISCOVERY_ENABLE_GDELT=1
 * where the network is not rate limited (e.g. a GitHub-hosted runner). Any failure
 * returns [] so it can never break the build or delete candidates.
 */
export const gdeltProvider: Provider = {
  name: "gdelt-doc",
  isEnabled() {
    return process.env.DISCOVERY_ENABLE_GDELT === "1";
  },
  async discover(ctx: DiscoveryContext): Promise<DiscoveredItem[]> {
    const items: DiscoveredItem[] = [];
    const seen = new Set<string>();
    const keywords = [...ctx.aiKeywords, ...ctx.workforceKeywords];

    for (const q of QUERIES) {
      const url = `${ENDPOINT}?query=${encodeURIComponent(
        q,
      )}&mode=ArtList&maxrecords=25&format=json&timespan=3d&sort=DateDesc`;
      let res: GdeltResponse;
      try {
        res = await fetchJson<GdeltResponse>(url, {
          headers: {
            "User-Agent":
              "ai-workforce-impact-tracker discovery (+https://github.com/vinay23is/ai-workforce-impact-tracker)",
          },
          timeoutMs: 25_000,
          retries: 1,
        });
      } catch (error) {
        ctx.log(`gdelt: query failed (${q}): ${(error as Error).message}`);
        await sleep(6000);
        continue;
      }
      const articles = res.articles ?? [];
      ctx.log(`gdelt: "${q.slice(0, 40)}..." -> ${articles.length} articles`);
      for (const a of articles) {
        if (!a.url || !a.title) continue;
        const canon = canonicalUrl(a.url);
        if (seen.has(canon)) continue;
        seen.add(canon);
        const company = matchCompany(a.title, ctx.companies);
        items.push({
          title: a.title,
          url: a.url,
          canonicalUrl: canon,
          domain: a.domain ?? domainOf(a.url),
          publisher: a.domain ?? null,
          publishedAt: seendateToIso(a.seendate),
          discoveredAt: new Date().toISOString(),
          provider: this.name,
          query: q,
          matchedKeywords: keywords.filter((k) => a.title!.toLowerCase().includes(k.toLowerCase())),
          possibleCompanyName: company?.name ?? null,
          possibleCompanyId: company?.id ?? null,
          possibleJobs: extractObviousJobCount(a.title),
          sourceType: "layoff_tracker",
          snippet: null,
        });
      }
      await sleep(6000); // GDELT asks for >=5s between requests.
    }
    return items;
  },
};
