import { z } from "zod";
import {
  ATTRIBUTION_LEVELS,
  CONFIDENCE_LEVELS,
  INVESTMENT_RELATIONSHIPS,
} from "./attribution";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Not a valid calendar date");

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slugs are lowercase, hyphen-separated");

const httpUrl = z.string().url().refine((u) => u.startsWith("http://") || u.startsWith("https://"), "URL must be http(s)");

/**
 * `null` means the value is genuinely unknown and must never be coerced to 0.
 * A count of 0 would be a positive claim that no jobs were affected.
 */
const unknownableCount = z.number().int().min(0).nullable();

export const industrySchema = z.object({
  id: z.string().min(1),
  slug,
  name: z.string().min(1),
  description: z.string().min(1),
});

export const companySchema = z.object({
  id: z.string().min(1),
  slug,
  name: z.string().min(1),
  ticker: z.string().nullable().default(null),
  industryId: z.string().min(1),
  website: httpUrl.nullable().default(null),
  headquarters: z.string().nullable().default(null),
  latestKnownWorkforce: z.number().int().positive().nullable().default(null),
  workforceAsOf: isoDate.nullable().default(null),
  description: z.string().min(1),
});

export const sourceTypes = [
  "regulatory_filing",
  "company_announcement",
  "earnings_call",
  "warn_notice",
  "wire_service",
  "financial_press",
  "industry_press",
  "local_press",
  "layoff_tracker",
  "other",
] as const;

export const sourceSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  url: httpUrl,
  title: z.string().min(1),
  publisher: z.string().min(1),
  publishedAt: isoDate.nullable().default(null),
  retrievedAt: isoDate,
  sourceType: z.enum(sourceTypes),
  primarySource: z.boolean(),
  supportsHeadcount: z.boolean().default(false),
  supportsAIAttribution: z.boolean().default(false),
  supportsLocation: z.boolean().default(false),
  supportsInvestmentRelationship: z.boolean().default(false),
  evidenceNote: z.string().min(1),
});

export const locationSchema = z.object({
  country: z.string().min(1),
  state: z
    .string()
    .regex(/^[A-Z]{2}$/, "US state must be a 2-letter code")
    .nullable()
    .default(null),
  city: z.string().nullable().default(null),
  jobs: unknownableCount.default(null),
  note: z.string().nullable().default(null),
});

export const occupationSchema = z.object({
  title: z.string().min(1),
  category: z.string().nullable().default(null),
  jobs: unknownableCount.default(null),
});

/**
 * How the reduction happened. This is not the same as its cause: a net headcount
 * decline (e.g. Oracle) is not the same claim as a headcount of documented layoffs.
 * Use UNKNOWN or MIXED when the evidence does not clearly establish one mechanism.
 */
export const reductionMechanisms = [
  "LAYOFFS",
  "ROLE_ELIMINATIONS",
  "NET_HEADCOUNT_DECLINE",
  "ATTRITION",
  "REDEPLOYMENT",
  "HIRING_REDUCTION",
  "MIXED",
  "UNKNOWN",
] as const;

export const eventSchema = z
  .object({
    id: z.string().min(1),
    slug,
    companyId: z.string().min(1),
    announcementDate: isoDate,
    effectiveDate: isoDate.nullable().default(null),
    globalJobsLost: unknownableCount.default(null),
    usJobsLost: unknownableCount.default(null),
    // The portion of the workforce action a source specifically quantifies as
    // AI-attributable. null = not quantified. NEVER estimate this or split it
    // yourself; only populate it when a source states an AI-specific number.
    aiAttributedJobsGlobal: unknownableCount.default(null),
    aiAttributedJobsUS: unknownableCount.default(null),
    reductionMechanism: z.enum(reductionMechanisms).default("UNKNOWN"),
    jobsEstimated: z.boolean().default(false),
    percentageWorkforce: z.number().min(0).max(100).nullable().default(null),
    attributionLevel: z.enum(ATTRIBUTION_LEVELS),
    confidence: z.enum(CONFIDENCE_LEVELS),
    // "planned" reductions (a stated target or projection) are shown separately and
    // never enter the "jobs already lost" totals. Default is an executed cut.
    status: z.enum(["executed", "in_progress", "planned"]).default("executed"),
    summary: z.string().min(1),
    whyClassified: z.string().min(1),
    whatWeKnow: z.array(z.string().min(1)).default([]),
    whatWeDontKnow: z.array(z.string().min(1)).min(1, "Every event must state what is unknown"),
    aiInvestmentContext: z.string().nullable().default(null),
    locations: z.array(locationSchema).default([]),
    occupations: z.array(occupationSchema).default([]),
    sourceIds: z.array(z.string().min(1)).default([]),
    investmentRelationship: z.enum(INVESTMENT_RELATIONSHIPS).default("UNCONFIRMED"),
    relatedInvestmentIds: z.array(z.string().min(1)).default([]),
    /** Per-worker annual compensation, when a credible figure is known for this event. */
    knownAnnualCompensationPerWorker: z.number().positive().nullable().default(null),
    /** Program modelling. A parent is a context container and is not counted; its stages are. */
    parentEventId: z.string().nullable().default(null),
    programId: z.string().nullable().default(null),
    published: z.boolean().default(false),
    lastReviewedAt: isoDate,
    notes: z.string().nullable().default(null),
  })
  .refine(
    (e) => e.globalJobsLost === null || e.usJobsLost === null || e.usJobsLost <= e.globalJobsLost,
    { message: "US jobs cannot exceed global jobs when both are known", path: ["usJobsLost"] },
  )
  .refine(
    (e) =>
      e.aiAttributedJobsGlobal === null ||
      e.globalJobsLost === null ||
      e.aiAttributedJobsGlobal <= e.globalJobsLost,
    {
      message: "AI-attributed global jobs cannot exceed total global jobs",
      path: ["aiAttributedJobsGlobal"],
    },
  )
  .refine(
    (e) =>
      e.aiAttributedJobsUS === null ||
      e.usJobsLost === null ||
      e.aiAttributedJobsUS <= e.usJobsLost,
    { message: "AI-attributed US jobs cannot exceed total US jobs", path: ["aiAttributedJobsUS"] },
  )
  .refine(
    (e) =>
      e.aiAttributedJobsUS === null ||
      e.aiAttributedJobsGlobal === null ||
      e.aiAttributedJobsUS <= e.aiAttributedJobsGlobal,
    {
      message: "AI-attributed US jobs cannot exceed AI-attributed global jobs",
      path: ["aiAttributedJobsUS"],
    },
  );

export const investmentTypes = [
  "ai_infrastructure",
  "data_centers",
  "chips",
  "ai_rd",
  "ai_acquisition",
  "model_development",
  "ai_hiring",
  "cloud_infrastructure",
  "other",
] as const;

export const investmentSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  announcementDate: isoDate,
  amount: z.number().positive().nullable().default(null),
  currency: z.string().length(3).default("USD"),
  timePeriod: z.string().min(1),
  investmentType: z.enum(investmentTypes),
  description: z.string().min(1),
  sourceIds: z.array(z.string().min(1)).default([]),
});

export const correctionSchema = z.object({
  id: z.string().min(1),
  date: isoDate,
  eventId: z.string().nullable().default(null),
  entity: z.string().min(1),
  field: z.string().min(1),
  oldValue: z.string(),
  newValue: z.string(),
  reason: z.string().min(1),
  sourceUrl: httpUrl.nullable().default(null),
});

export type Industry = z.infer<typeof industrySchema>;
export type Company = z.infer<typeof companySchema>;
export type Source = z.infer<typeof sourceSchema>;
export type EventLocation = z.infer<typeof locationSchema>;
export type Occupation = z.infer<typeof occupationSchema>;
export type WorkforceEvent = z.infer<typeof eventSchema>;
export type ReductionMechanism = (typeof reductionMechanisms)[number];
export type Investment = z.infer<typeof investmentSchema>;
export type Correction = z.infer<typeof correctionSchema>;
