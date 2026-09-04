import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  companySchema,
  correctionSchema,
  eventSchema,
  industrySchema,
  investmentSchema,
  sourceSchema,
  type Company,
  type Correction,
  type Industry,
  type Investment,
  type Source,
  type WorkforceEvent,
} from "./schemas";
import {
  externalBenchmarksFileSchema,
  geographicReferenceSchema,
  householdReferenceSchema,
  wageReferenceSchema,
  type ExternalBenchmark,
  type GeographicReference,
  type HouseholdReference,
  type WageReference,
} from "./reference";

const DATA_DIR = path.join(process.cwd(), "data");

export interface Dataset {
  industries: Industry[];
  companies: Company[];
  events: WorkforceEvent[];
  sources: Source[];
  investments: Investment[];
  corrections: Correction[];
  wageReference: WageReference;
  householdReference: HouseholdReference;
  geographicReference: GeographicReference;
  externalBenchmarks: ExternalBenchmark[];
  meta: {
    dataThrough: string;
    lastDatasetUpdate: string;
    methodologyVersion: string;
  };
}

function readJson(relativePath: string): unknown {
  const full = path.join(DATA_DIR, relativePath);
  const raw = fs.readFileSync(full, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in data/${relativePath}: ${(error as Error).message}`);
  }
}

function parseArray<S extends z.ZodTypeAny>(
  schema: S,
  value: unknown,
  label: string,
): z.infer<S>[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected data/${label} to contain a JSON array`);
  }
  return value.map((item, index) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      const id =
        item && typeof item === "object" && "id" in item ? String((item as { id: unknown }).id) : `#${index}`;
      throw new Error(`Invalid record in ${label} (${id}): ${issues}`);
    }
    return result.data;
  });
}

function loadEvents(): WorkforceEvent[] {
  const eventsDir = path.join(DATA_DIR, "events");
  const files = fs
    .readdirSync(eventsDir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const all: WorkforceEvent[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(eventsDir, file), "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Invalid JSON in data/events/${file}: ${(error as Error).message}`);
    }
    all.push(...parseArray(eventSchema, parsed, `events/${file}`));
  }
  return all;
}

let cached: Dataset | null = null;

/**
 * Loads and shape-validates the entire dataset. Any schema failure throws, which
 * fails the build — a broken dataset must never reach production.
 */
export function loadDataset(): Dataset {
  if (cached) return cached;

  const meta = readJson("methodology.json") as Dataset["meta"];

  const dataset: Dataset = {
    industries: parseArray(industrySchema, readJson("industries.json"), "industries.json"),
    companies: parseArray(companySchema, readJson("companies.json"), "companies.json"),
    events: loadEvents(),
    sources: parseArray(sourceSchema, readJson("sources.json"), "sources.json"),
    investments: parseArray(investmentSchema, readJson("investments.json"), "investments.json"),
    corrections: parseArray(correctionSchema, readJson("corrections.json"), "corrections.json"),
    wageReference: wageReferenceSchema.parse(readJson("reference/wage-reference.json")),
    householdReference: householdReferenceSchema.parse(readJson("reference/household.json")),
    geographicReference: geographicReferenceSchema.parse(
      readJson("reference/geographic-reference.json"),
    ),
    externalBenchmarks: externalBenchmarksFileSchema.parse(
      readJson("reference/external-benchmarks.json"),
    ).benchmarks,
    meta,
  };

  cached = dataset;
  return dataset;
}

// Convenience lookups ------------------------------------------------------

export function getCompany(dataset: Dataset, id: string): Company | undefined {
  return dataset.companies.find((c) => c.id === id);
}

export function getIndustry(dataset: Dataset, id: string): Industry | undefined {
  return dataset.industries.find((i) => i.id === id);
}

export function getSourcesForEvent(dataset: Dataset, eventId: string): Source[] {
  return dataset.sources.filter((s) => s.eventId === eventId);
}

export function getPublishedEvents(dataset: Dataset): WorkforceEvent[] {
  return dataset.events.filter((e) => e.published);
}
