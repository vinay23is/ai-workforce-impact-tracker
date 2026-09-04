/**
 * Validates the full dataset beyond per-record shape checks. Shape validation
 * happens in loadDataset() (Zod); this adds referential integrity and the
 * methodology rules that keep totals trustworthy. Any error exits non-zero,
 * which fails `npm run build`.
 */
import { loadDataset } from "../lib/data";
import { ATTRIBUTION_RULES, confidenceMeetsThreshold } from "../lib/attribution";
import { COVERAGE_LAG_WARN_DAYS } from "../lib/site";

const errors: string[] = [];
const warnings: string[] = [];

function fail(msg: string) {
  errors.push(msg);
}
function warn(msg: string) {
  warnings.push(msg);
}

function requireUnique(ids: string[], label: string) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) fail(`Duplicate ${label} id: ${id}`);
    seen.add(id);
  }
}

function main() {
  const dataset = loadDataset();
  const {
    events,
    companies,
    industries,
    sources,
    investments,
    corrections,
    geographicReference,
  } = dataset;

  const companyIds = new Set(companies.map((c) => c.id));
  const industryIds = new Set(industries.map((i) => i.id));
  const eventIds = new Set(events.map((e) => e.id));
  const sourceIds = new Set(sources.map((s) => s.id));
  const investmentIds = new Set(investments.map((i) => i.id));
  const stateCodes = new Set(geographicReference.states.map((s) => s.abbr));

  requireUnique(events.map((e) => e.id), "event");
  requireUnique(events.map((e) => e.slug), "event slug");
  requireUnique(companies.map((c) => c.id), "company");
  requireUnique(companies.map((c) => c.slug), "company slug");
  requireUnique(industries.map((i) => i.id), "industry");
  requireUnique(sources.map((s) => s.id), "source");
  requireUnique(investments.map((i) => i.id), "investment");
  requireUnique(corrections.map((c) => c.id), "correction");

  for (const company of companies) {
    if (!industryIds.has(company.industryId)) {
      fail(`Company ${company.id} references unknown industry ${company.industryId}`);
    }
  }

  const sourcesByEvent = new Map<string, typeof sources>();
  for (const source of sources) {
    if (!eventIds.has(source.eventId)) {
      fail(`Source ${source.id} references unknown event ${source.eventId}`);
    }
    const list = sourcesByEvent.get(source.eventId) ?? [];
    list.push(source);
    sourcesByEvent.set(source.eventId, list);
  }

  for (const event of events) {
    if (!companyIds.has(event.companyId)) {
      fail(`Event ${event.id} references unknown company ${event.companyId}`);
    }

    for (const sid of event.sourceIds) {
      if (!sourceIds.has(sid)) fail(`Event ${event.id} references unknown source ${sid}`);
    }
    for (const iid of event.relatedInvestmentIds) {
      if (!investmentIds.has(iid)) fail(`Event ${event.id} references unknown investment ${iid}`);
    }
    if (event.parentEventId && !eventIds.has(event.parentEventId)) {
      fail(`Event ${event.id} references unknown parent event ${event.parentEventId}`);
    }

    // Zero and unknown are different: a layoff event with a literal 0 headcount is
    // almost certainly meant to be null (unknown).
    if (event.globalJobsLost === 0) fail(`Event ${event.id} has globalJobsLost = 0; use null for unknown`);
    if (event.usJobsLost === 0) fail(`Event ${event.id} has usJobsLost = 0; use null for unknown`);

    for (const loc of event.locations) {
      if (loc.state && !stateCodes.has(loc.state)) {
        fail(`Event ${event.id} references unknown US state code ${loc.state}`);
      }
    }

    if (event.published) {
      const eventSources = sourcesByEvent.get(event.id) ?? [];
      const referenced = eventSources.filter((s) => event.sourceIds.includes(s.id));
      if (referenced.length === 0) {
        fail(`Published event ${event.id} has no linked sources`);
      }

      const isConfirmedCandidate =
        ATTRIBUTION_RULES.confirmedLevels.includes(event.attributionLevel) &&
        (event.status === "executed" || event.status === "in_progress") &&
        confidenceMeetsThreshold(event.confidence, ATTRIBUTION_RULES.confirmedMinConfidence);

      if (isConfirmedCandidate) {
        const hasAI = referenced.some((s) => s.supportsAIAttribution);
        if (!hasAI) {
          fail(
            `Event ${event.id} would count as confirmed AI-attributed but has no source with supportsAIAttribution`,
          );
        }
      }
    }
  }

  for (const investment of investments) {
    if (!companyIds.has(investment.companyId)) {
      fail(`Investment ${investment.id} references unknown company ${investment.companyId}`);
    }
    for (const sid of investment.sourceIds) {
      if (!sourceIds.has(sid)) fail(`Investment ${investment.id} references unknown source ${sid}`);
    }
  }

  for (const correction of corrections) {
    if (correction.eventId && !eventIds.has(correction.eventId)) {
      fail(`Correction ${correction.id} references unknown event ${correction.eventId}`);
    }
  }

  // Coverage dating: dataThrough must not predate the newest published event, or the
  // site would claim coverage it does not have.
  const publishedDates = events.filter((e) => e.published).map((e) => e.announcementDate).sort();
  const newestEvent = publishedDates[publishedDates.length - 1];
  if (newestEvent && dataset.meta.dataThrough < newestEvent) {
    fail(
      `methodology.json dataThrough (${dataset.meta.dataThrough}) is earlier than the newest published event (${newestEvent})`,
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const lagDays = Math.round(
    (Date.parse(today) - Date.parse(dataset.meta.dataThrough)) / (1000 * 60 * 60 * 24),
  );
  if (lagDays > COVERAGE_LAG_WARN_DAYS) {
    warn(
      `DATA COVERAGE LAG: research coverage (dataThrough ${dataset.meta.dataThrough}) is ${lagDays} days behind today. Refresh the dataset.`,
    );
  }

  // Likely-duplicate detection: same company and announcement date.
  const byKey = new Map<string, string[]>();
  for (const event of events) {
    const key = `${event.companyId}:${event.announcementDate}`;
    const list = byKey.get(key) ?? [];
    list.push(event.id);
    byKey.set(key, list);
  }
  for (const [key, ids] of byKey) {
    if (ids.length > 1) {
      warn(`Possible duplicate events for ${key}: ${ids.join(", ")}`);
    }
  }

  if (warnings.length) {
    console.warn(`\nWarnings (${warnings.length}):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }

  if (errors.length) {
    console.error(`\nData validation FAILED with ${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(
    `Data validation passed: ${events.length} events, ${companies.length} companies, ` +
      `${sources.length} sources, ${investments.length} investments, ${corrections.length} corrections.`,
  );
}

main();
