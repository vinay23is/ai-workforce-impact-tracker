const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "fbclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_src",
  "cmpid",
  "cmp",
  "spm",
];

/** Strip tracking params, fragments, and trailing slashes; lowercase the host. */
export function canonicalUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = "";
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    for (const p of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.includes(p.toLowerCase())) u.searchParams.delete(p);
    }
    let out = u.toString();
    // Drop a trailing slash on the path (but keep the bare origin).
    out = out.replace(/\/(?=$|\?)/, (m, offset: number) => (offset > u.origin.length ? "" : m));
    return out;
  } catch {
    return raw.trim();
  }
}

export function domainOf(raw: string): string {
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function matchedKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k.toLowerCase()));
}

/** Suggest a possible company id by loose name match. Suggestion only. */
export function matchCompany(
  text: string,
  companies: { id: string; name: string; ticker: string | null }[],
): { id: string; name: string } | null {
  const lower = text.toLowerCase();
  for (const c of companies) {
    const name = c.name.toLowerCase();
    // Match on the distinctive first word of the company name, or the exact name.
    const head = name.split(/[\s.,]/)[0];
    if (head && head.length >= 3 && lower.includes(name)) return { id: c.id, name: c.name };
  }
  for (const c of companies) {
    const head = c.name.toLowerCase().split(/[\s.,]/)[0];
    if (head && head.length >= 4 && new RegExp(`\\b${escapeRegex(head)}\\b`).test(lower)) {
      return { id: c.id, name: c.name };
    }
  }
  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True only if a number is structurally obvious as a job count near layoff words. */
export function extractObviousJobCount(text: string): number | null {
  const m = text.match(
    /\b([\d,]{2,7})\s+(?:jobs?|roles?|employees?|positions?|staff|workers?)\b/i,
  );
  if (!m || !m[1]) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 && n < 1_000_000 ? n : null;
}
