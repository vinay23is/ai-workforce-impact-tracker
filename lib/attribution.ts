/**
 * Single source of truth for the attribution taxonomy, confidence scale, and the
 * rules that decide which events are allowed into headline totals.
 *
 * Nothing elsewhere in the codebase should hard-code these decisions. Aggregation,
 * validation, and UI all read from here so the "confirmed" number can never drift
 * from what the methodology page describes.
 */

export const METHODOLOGY_VERSION = "1.1.0";

export const ATTRIBUTION_LEVELS = ["A", "B", "C", "D", "E", "F"] as const;
export type AttributionLevel = (typeof ATTRIBUTION_LEVELS)[number];

export const CONFIDENCE_LEVELS = [
  "VERY_HIGH",
  "HIGH",
  "MEDIUM",
  "LOW",
  "UNCONFIRMED",
] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export const INVESTMENT_RELATIONSHIPS = [
  "DIRECTLY_CONFIRMED",
  "PARTIALLY_CONFIRMED",
  "SAME_RESTRUCTURING_PROGRAM",
  "CONTEXT_ONLY",
  "UNCONFIRMED",
] as const;
export type InvestmentRelationship = (typeof INVESTMENT_RELATIONSHIPS)[number];

interface AttributionMeta {
  level: AttributionLevel;
  label: string;
  short: string;
  description: string;
}

export const ATTRIBUTION_META: Record<AttributionLevel, AttributionMeta> = {
  A: {
    level: "A",
    label: "Direct AI replacement",
    short: "Direct replacement",
    description:
      "AI directly performs work previously done by people, and the company or a regulatory filing says so.",
  },
  B: {
    level: "B",
    label: "AI-enabled productivity reduction",
    short: "AI-enabled reduction",
    description:
      "The company states that AI lets it operate with fewer workers, without a one-to-one replacement of specific roles.",
  },
  C: {
    level: "C",
    label: "AI-related restructuring",
    short: "AI restructuring",
    description:
      "AI is explicitly named as one reason for a broader restructuring that also cites other factors.",
  },
  D: {
    level: "D",
    label: "AI capital reallocation",
    short: "Capital reallocation",
    description:
      "The company explicitly ties workforce cost reductions to shifting money toward AI. This does not mean AI performed the eliminated jobs.",
  },
  E: {
    level: "E",
    label: "Reported AI connection",
    short: "Reported connection",
    description:
      "Credible reporting connects AI to the reduction, but company evidence is not strong enough for a higher category.",
  },
  F: {
    level: "F",
    label: "Unconfirmed / context only",
    short: "Context only",
    description:
      "Layoffs occur alongside heavy AI investment, but available evidence does not establish that AI caused them. Never counted.",
  },
};

export const CONFIDENCE_META: Record<Confidence, { label: string; description: string }> = {
  VERY_HIGH: {
    label: "Very high",
    description:
      "A primary company or regulatory statement explicitly connects AI and the workforce reduction.",
  },
  HIGH: {
    label: "High",
    description: "An executive statement or several highly credible independent reports.",
  },
  MEDIUM: {
    label: "Medium",
    description: "AI explicitly appears among multiple stated restructuring factors.",
  },
  LOW: { label: "Low", description: "Indirect evidence only." },
  UNCONFIRMED: {
    label: "Unconfirmed",
    description: "Correlation or context only; no established causal link.",
  },
};

export const INVESTMENT_RELATIONSHIP_META: Record<
  InvestmentRelationship,
  { label: string; description: string }
> = {
  DIRECTLY_CONFIRMED: {
    label: "Directly confirmed",
    description: "The company states that savings from the reduction fund a specific AI investment.",
  },
  PARTIALLY_CONFIRMED: {
    label: "Partially confirmed",
    description: "The company links the two decisions in general terms without full detail.",
  },
  SAME_RESTRUCTURING_PROGRAM: {
    label: "Same program",
    description: "Both appear inside one announced restructuring program.",
  },
  CONTEXT_ONLY: {
    label: "Context only",
    description: "The two decisions occurred in the same period with no stated relationship.",
  },
  UNCONFIRMED: {
    label: "Unconfirmed",
    description: "No established relationship.",
  },
};

/**
 * Rule set that gates headline totals. Changing any of these is a methodology change
 * and should be accompanied by a METHODOLOGY_VERSION bump.
 */
export const ATTRIBUTION_RULES = {
  /** Levels where AI is an established cause of reduced labor need. */
  confirmedLevels: ["A", "B", "C"] as AttributionLevel[],
  /** Minimum confidence for an event to enter the confirmed total. */
  confirmedMinConfidence: "MEDIUM" as Confidence,
  /** Levels counted as "AI-linked" in the broader total (context-only F excluded). */
  aiLinkedLevels: ["A", "B", "C", "D", "E"] as AttributionLevel[],
  /** Level for the capital-reallocation metric. */
  capitalReallocationLevels: ["D"] as AttributionLevel[],
  /** Level for the direct-replacement metric. */
  directReplacementLevels: ["A"] as AttributionLevel[],
} as const;

const CONFIDENCE_RANK: Record<Confidence, number> = {
  UNCONFIRMED: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  VERY_HIGH: 4,
};

export function confidenceMeetsThreshold(confidence: Confidence, min: Confidence): boolean {
  return CONFIDENCE_RANK[confidence] >= CONFIDENCE_RANK[min];
}

export function attributionColorVar(level: AttributionLevel): string {
  return `var(--attr-${level.toLowerCase()})`;
}
