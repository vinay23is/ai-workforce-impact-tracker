import { z } from "zod";

export const wageReferenceSchema = z.object({
  source: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceYear: z.number().int(),
  note: z.string().min(1),
  nationalMedianAnnualWage: z.number().positive(),
  byIndustry: z.array(
    z.object({
      industryId: z.string().min(1),
      medianAnnualWage: z.number().positive(),
    }),
  ),
});

export const householdReferenceSchema = z.object({
  averageHouseholdSize: z.number().positive(),
  source: z.string().min(1),
  sourceUrl: z.string().url(),
  year: z.number().int(),
  note: z.string().min(1),
});

export const geographicReferenceSchema = z.object({
  states: z.array(
    z.object({
      abbr: z.string().regex(/^[A-Z]{2}$/),
      name: z.string().min(1),
      region: z.string().min(1),
      // Position on a tile-grid cartogram (row/col), an established data-journalism
      // technique that needs no projection data or paid map service.
      tileRow: z.number().int().min(0),
      tileCol: z.number().int().min(0),
    }),
  ),
});

/**
 * Independent third-party totals shown for context only. These use other
 * organisations' methodologies and must never be added to this tracker's ledger.
 */
export const externalBenchmarkSchema = z.object({
  id: z.string().min(1),
  publisher: z.string().min(1),
  metric: z.string().min(1),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jobs: z.number().int().positive(),
  geography: z.string().min(1),
  scope: z.enum(["announced", "executed", "mixed"]),
  sourceUrl: z.string().url(),
  retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  methodologyNote: z.string().min(1),
  primary: z.boolean().default(false),
});

export const externalBenchmarksFileSchema = z.object({
  benchmarks: z.array(externalBenchmarkSchema),
});

export type WageReference = z.infer<typeof wageReferenceSchema>;
export type HouseholdReference = z.infer<typeof householdReferenceSchema>;
export type GeographicReference = z.infer<typeof geographicReferenceSchema>;
export type ExternalBenchmark = z.infer<typeof externalBenchmarkSchema>;
