export const SITE_NAME = "AI Workforce Impact Tracker";

export const SITE_TAGLINE =
  "Documenting workforce reductions with credible links to artificial intelligence.";

export const SITE_DESCRIPTION =
  "A public dataset and website documenting workforce reductions with credible links to artificial intelligence. It separates confirmed AI-attributed job cuts from broader restructuring and from layoffs that merely occur alongside AI investment.";

export const NAV = [
  { href: "/events", label: "Tracker" },
  { href: "/companies", label: "Companies" },
  { href: "/industries", label: "Industries" },
  { href: "/map", label: "Map" },
  { href: "/ai-investment", label: "AI Investment" },
  { href: "/methodology", label: "Methodology" },
  { href: "/data", label: "Data" },
];

/**
 * Absolute site URL for metadata. Derived from Vercel's build-time environment so
 * nothing is hard-coded to a specific domain; falls back to localhost in dev.
 */
export function getSiteUrl(): string {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;
  const deployment = process.env.VERCEL_URL;
  if (deployment) return `https://${deployment}`;
  return "http://localhost:3000";
}
