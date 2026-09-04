/**
 * Promotes a reviewed candidate into the production dataset. This is an explicit
 * HUMAN action: the reviewer must supply a fully-authored WorkforceEvent (and any
 * new sources). Discovery never calls this. Nothing is published automatically —
 * the reviewer's event JSON decides `published`.
 *
 *   npm run promote:candidate -- --candidate <candidateId> --event path/to/event.json
 *
 * The event file is an event object, or { "event": {...}, "sources": [...] }.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { eventSchema, sourceSchema } from "../lib/schemas";
import { loadDataset } from "../lib/data";
import { candidateSchema, listCandidateFiles } from "../lib/candidates";

function die(msg: string): never {
  console.error(`promote:candidate failed — ${msg}`);
  process.exit(1);
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const candidateId = arg("--candidate");
const eventPath = arg("--event");
if (!candidateId || !eventPath) {
  die("usage: npm run promote:candidate -- --candidate <id> --event path/to/event.json");
}

const candidateFile = listCandidateFiles().find((f) => {
  try {
    return JSON.parse(fs.readFileSync(f, "utf8")).candidateId === candidateId;
  } catch {
    return false;
  }
});
if (!candidateFile) die(`candidate "${candidateId}" not found`);
const candidate = candidateSchema.parse(JSON.parse(fs.readFileSync(candidateFile, "utf8")));

const payload = JSON.parse(fs.readFileSync(eventPath, "utf8"));
const container =
  payload && typeof payload === "object" && "event" in payload
    ? (payload as { event: unknown; sources?: unknown[] })
    : { event: payload, sources: [] as unknown[] };

const eventResult = eventSchema.safeParse(container.event);
if (!eventResult.success) {
  die(`event invalid:\n${eventResult.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")}`);
}
const event = eventResult.data;
const newSources = (container.sources ?? []).map((s, i) => {
  const r = sourceSchema.safeParse(s);
  if (!r.success) die(`source #${i} invalid: ${r.error.issues.map((x) => x.message).join(", ")}`);
  return r.data;
});

const dataset = loadDataset();
if (dataset.events.some((e) => e.id === event.id)) die(`event id "${event.id}" already exists`);
if (dataset.events.some((e) => e.slug === event.slug)) die(`event slug "${event.slug}" already exists`);
if (!dataset.companies.some((c) => c.id === event.companyId)) die(`company "${event.companyId}" does not exist`);

const knownSourceIds = new Set([...dataset.sources.map((s) => s.id), ...newSources.map((s) => s.id)]);
for (const sid of event.sourceIds) {
  if (!knownSourceIds.has(sid)) die(`event references source "${sid}" that does not exist and was not supplied`);
}
if (event.published && event.sourceIds.length === 0) die("a published event must reference at least one source");

if (candidate.possibleDuplicateOf.length) {
  console.warn(
    `Warning: candidate was flagged as a possible duplicate of ${candidate.possibleDuplicateOf.join(", ")}. Confirm this is genuinely a distinct event.`,
  );
}
const sameDay = dataset.events.filter(
  (e) => e.companyId === event.companyId && e.announcementDate === event.announcementDate,
);
if (sameDay.length) {
  console.warn(`Warning: existing event(s) for ${event.companyId} on ${event.announcementDate}: ${sameDay.map((e) => e.id).join(", ")}`);
}

// Insert into the year file, kept sorted by announcement date.
const year = event.announcementDate.slice(0, 4);
const yearFile = path.join(process.cwd(), "data", "events", `${year}.json`);
const yearEvents: unknown[] = fs.existsSync(yearFile) ? JSON.parse(fs.readFileSync(yearFile, "utf8")) : [];
yearEvents.push(container.event);
yearEvents.sort((a, b) =>
  String((a as { announcementDate: string }).announcementDate).localeCompare(
    String((b as { announcementDate: string }).announcementDate),
  ),
);
fs.writeFileSync(yearFile, JSON.stringify(yearEvents, null, 2) + "\n");

if (newSources.length) {
  const sourcesFile = path.join(process.cwd(), "data", "sources.json");
  const sources: unknown[] = JSON.parse(fs.readFileSync(sourcesFile, "utf8"));
  sources.push(...(container.sources ?? []));
  fs.writeFileSync(sourcesFile, JSON.stringify(sources, null, 2) + "\n");
}

// Mark the candidate promoted (kept for audit; never deleted automatically).
fs.writeFileSync(candidateFile, JSON.stringify({ ...candidate, status: "PROMOTED" }, null, 2) + "\n");

console.log(`Promoted candidate ${candidateId} -> event ${event.id} in data/events/${year}.json.`);
console.log("Running full dataset validation...");
execFileSync("npx", ["tsx", "scripts/validate-data.ts"], { stdio: "inherit" });
