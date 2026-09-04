/**
 * Adds an event (and optionally its sources) to the dataset from a JSON file, with
 * the same checks the site relies on, then re-runs full validation.
 *
 *   npm run add:event -- path/to/new-event.json
 *
 * The file is either an event object, or { "event": {...}, "sources": [...] }.
 * Nothing is written unless every check passes.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { eventSchema, sourceSchema } from "../lib/schemas";
import { loadDataset } from "../lib/data";

function die(message: string): never {
  console.error(`add:event failed — ${message}`);
  process.exit(1);
}

const inputPath = process.argv[2];
if (!inputPath) die("provide a path to a JSON file: npm run add:event -- path/to/event.json");

const raw = fs.readFileSync(inputPath, "utf8");
let payload: unknown;
try {
  payload = JSON.parse(raw);
} catch (error) {
  die(`could not parse JSON: ${(error as Error).message}`);
}

const container =
  payload && typeof payload === "object" && "event" in payload
    ? (payload as { event: unknown; sources?: unknown[] })
    : { event: payload, sources: [] as unknown[] };

const eventResult = eventSchema.safeParse(container.event);
if (!eventResult.success) {
  die(`event is invalid:\n${eventResult.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")}`);
}
const event = eventResult.data;

const newSources = (container.sources ?? []).map((s, i) => {
  const parsed = sourceSchema.safeParse(s);
  if (!parsed.success) die(`source #${i} is invalid: ${parsed.error.issues.map((x) => x.message).join(", ")}`);
  return parsed.data;
});

const dataset = loadDataset();

if (dataset.events.some((e) => e.id === event.id)) die(`event id "${event.id}" already exists`);
if (dataset.events.some((e) => e.slug === event.slug)) die(`event slug "${event.slug}" already exists`);
if (!dataset.companies.some((c) => c.id === event.companyId)) {
  die(`company "${event.companyId}" does not exist in companies.json`);
}

const existingSourceIds = new Set([...dataset.sources.map((s) => s.id), ...newSources.map((s) => s.id)]);
for (const sid of event.sourceIds) {
  if (!existingSourceIds.has(sid)) die(`event references source "${sid}" that does not exist and was not supplied`);
}

const dupes = dataset.events.filter(
  (e) => e.companyId === event.companyId && e.announcementDate === event.announcementDate,
);
if (dupes.length) {
  console.warn(
    `Warning: existing event(s) for ${event.companyId} on ${event.announcementDate}: ${dupes
      .map((e) => e.id)
      .join(", ")}. Continuing — confirm this is not a duplicate.`,
  );
}

// Insert into the year file, keeping events sorted by announcement date.
const year = event.announcementDate.slice(0, 4);
const eventsDir = path.join(process.cwd(), "data", "events");
const yearFile = path.join(eventsDir, `${year}.json`);
const yearEvents: unknown[] = fs.existsSync(yearFile)
  ? JSON.parse(fs.readFileSync(yearFile, "utf8"))
  : [];
yearEvents.push(container.event);
yearEvents.sort((a, b) =>
  String((a as { announcementDate: string }).announcementDate).localeCompare(
    String((b as { announcementDate: string }).announcementDate),
  ),
);
fs.writeFileSync(yearFile, `${JSON.stringify(yearEvents, null, 2)}\n`);

if (newSources.length) {
  const sourcesFile = path.join(process.cwd(), "data", "sources.json");
  const sources: unknown[] = JSON.parse(fs.readFileSync(sourcesFile, "utf8"));
  sources.push(...(container.sources ?? []));
  fs.writeFileSync(sourcesFile, `${JSON.stringify(sources, null, 2)}\n`);
}

console.log(`Added event "${event.id}" to data/events/${year}.json.`);
console.log("Running full dataset validation...");
execFileSync("npx", ["tsx", "scripts/validate-data.ts"], { stdio: "inherit" });
