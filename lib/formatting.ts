const intFormatter = new Intl.NumberFormat("en-US");

export function formatInt(n: number): string {
  return intFormatter.format(Math.round(n));
}

/** Compact form used for estimated figures: 8.4B, 324K, 1.2M. */
export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${trimZero(n / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${trimZero(n / 1_000_000)}M`;
  if (abs >= 10_000) return `${trimZero(n / 1_000, 0)}K`;
  if (abs >= 1_000) return `${trimZero(n / 1_000)}K`;
  return formatInt(n);
}

function trimZero(value: number, digits = 1): string {
  const rounded = value.toFixed(digits);
  return rounded.replace(/\.0+$/, "");
}

/** Approximate currency for estimated aggregates, e.g. ~$8.4B. */
export function formatApproxCurrency(n: number): string {
  return `~$${formatCompact(n)}`;
}

/** Approximate count for estimated aggregates, e.g. ~324K. */
export function formatApproxCount(n: number): string {
  if (Math.abs(n) < 1000) return `~${formatInt(n)}`;
  return `~${formatCompact(n)}`;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatMonthYear(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return iso;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatPercent(value: number): string {
  return `${trimZero(value)}%`;
}
