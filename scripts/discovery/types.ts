/**
 * Shared types for the discovery pipeline. Discovery only produces *pointers to
 * evidence* (a title, URL, publisher, date, matched keywords) — it never decides
 * causal attribution and never writes to data/events.
 */

export interface DiscoveredItem {
  title: string;
  url: string;
  canonicalUrl: string;
  domain: string;
  publisher: string | null;
  publishedAt: string | null;
  discoveredAt: string;
  provider: string;
  query: string;
  matchedKeywords: string[];
  possibleCompanyName: string | null;
  possibleCompanyId: string | null;
  /** Only when a number is structurally obvious in the provider's own data. */
  possibleJobs: number | null;
  sourceType: string;
  snippet: string | null;
}

export interface DiscoveryContext {
  /** Company records used only to *suggest* a possible company id — never to assert. */
  companies: { id: string; name: string; ticker: string | null }[];
  aiKeywords: string[];
  workforceKeywords: string[];
  log: (msg: string) => void;
  /** ISO date (YYYY-MM-DD) discovery is running for. */
  today: string;
}

export interface Provider {
  name: string;
  /** Providers can be disabled via env without removing the adapter. */
  isEnabled(): boolean;
  /** Must resolve to [] on any failure — never throw, never fabricate. */
  discover(ctx: DiscoveryContext): Promise<DiscoveredItem[]>;
}

export interface ProviderRunResult {
  provider: string;
  enabled: boolean;
  ok: boolean;
  items: number;
  error: string | null;
}
