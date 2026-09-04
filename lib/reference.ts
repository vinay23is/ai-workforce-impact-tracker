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

export type WageReference = z.infer<typeof wageReferenceSchema>;
export type HouseholdReference = z.infer<typeof householdReferenceSchema>;
export type GeographicReference = z.infer<typeof geographicReferenceSchema>;
