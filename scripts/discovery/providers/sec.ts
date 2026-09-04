import { fetchJson, sleep } from "../http";
import { canonicalUrl, domainOf, matchCompany } from "../normalize";
import type { DiscoveredItem, DiscoveryContext, Provider } from "../types";

// SEC's WAF rejects User-Agents containing URLs or parentheses. Fair-access format
// is a plain "name email" string (see https://www.sec.gov/os/webmaster-faq#developers).
const UA = "ai-workforce-impact-tracker 3p1csvec@gmail.com";
const FTS = "https://efts.sec.gov/LATEST/search-index";

// AI + workforce phrase pairs. Two quoted phrases in `q` are ANDed, which keeps
// precision far above a bare "AI" match. A hit is a review pointer, not causation.
const QUERIES = [
  '"artificial intelligence" "reduction in force"',
  '"artificial intelligence" "workforce reduction"',
  '"generative AI" "reduction in workforce"',
  '"AI" "reductions to our workforce"',
];
const FORMS = "10-K,10-Q,8-K,20-F,6-K";

interface FtsHit {
  _id: string;
  _source: {
    display_names?: string[];
    ciks?: string[];
    file_type?: string;
    file_date?: string;
    root_forms?: string[];
  };
}
interface FtsResponse {
  hits?: { hits?: FtsHit[] };
}

function filingUrl(id: string, cik: string): string | null {
  const [adsh, file] = id.split(":");
  if (!adsh || !file) return null;
  const cikNum = String(Number(cik));
  const adshNoDashes = adsh.replace(/-/g, "");
  return `https://www.sec.gov/Archives/edgar/data/${cikNum}/${adshNoDashes}/${file}`;
}

export const secProvider: Provider = {
  name: "sec-edgar-fts",
  isEnabled() {
    return process.env.DISCOVERY_DISABLE_SEC !== "1";
  },
  async discover(ctx: DiscoveryContext): Promise<DiscoveredItem[]> {
    const end = ctx.today;
    const start = new Date(Date.parse(ctx.today) - 14 * 86_400_000).toISOString().slice(0, 10);
    const items: DiscoveredItem[] = [];
    const seen = new Set<string>();

    for (const q of QUERIES) {
      const url = `${FTS}?q=${encodeURIComponent(q)}&forms=${encodeURIComponent(
        FORMS,
      )}&startdt=${start}&enddt=${end}`;
      let res: FtsResponse;
      try {
        res = await fetchJson<FtsResponse>(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      } catch (error) {
        ctx.log(`sec: query failed (${q}): ${(error as Error).message}`);
        await sleep(1200);
        continue;
      }
      const hits = res.hits?.hits ?? [];
      ctx.log(`sec: "${q}" -> ${hits.length} hits`);
      for (const hit of hits.slice(0, 15)) {
        const src = hit._source;
        const cik = src.ciks?.[0];
        if (!cik) continue;
        const url2 = filingUrl(hit._id, cik);
        if (!url2) continue;
        const canon = canonicalUrl(url2);
        if (seen.has(canon)) continue;
        seen.add(canon);
        const displayName = (src.display_names?.[0] ?? "").replace(/\s*\(CIK.*\)$/i, "").trim();
        const company = matchCompany(displayName, ctx.companies);
        items.push({
          title: `${displayName || "SEC filer"} — ${src.file_type ?? "filing"} ${src.file_date ?? ""}`.trim(),
          url: url2,
          canonicalUrl: canon,
          domain: domainOf(url2),
          publisher: "SEC EDGAR",
          publishedAt: src.file_date ?? null,
          discoveredAt: new Date().toISOString(),
          provider: this.name,
          query: q,
          matchedKeywords: q.match(/"([^"]+)"/g)?.map((s) => s.replace(/"/g, "")) ?? [],
          possibleCompanyName: displayName || null,
          possibleCompanyId: company?.id ?? null,
          possibleJobs: null,
          sourceType: "regulatory_filing",
          snippet: null,
        });
      }
      await sleep(1200); // Stay well under SEC's fair-access limits.
    }
    return items;
  },
};
