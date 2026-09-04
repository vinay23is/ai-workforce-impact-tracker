/**
 * Generates the static, machine-readable dataset under public/generated/.
 * These files are the project's simple public API — no serverless code required.
 * They are produced at build time (prebuild) and must not be edited by hand.
 */
import fs from "node:fs";
import path from "node:path";
import { loadDataset, getSourcesForEvent } from "../lib/data";
import { getSiteStats } from "../lib/stats";
import {
  getAllAILinkedEvents,
  getConfirmedEvents,
  getCountableEvents,
  getTimeline,
} from "../lib/aggregations";
import { estimateEventWage } from "../lib/estimates";

const OUT_DIR = path.join(process.cwd(), "public", "generated");

function write(file: string, data: unknown) {
  fs.writeFileSync(path.join(OUT_DIR, file), JSON.stringify(data, null, 2));
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dataset = loadDataset();
  const generatedAt = new Date().toISOString();
  const meta = {
    generatedAt,
    methodologyVersion: dataset.meta.methodologyVersion,
    dataThrough: dataset.meta.dataThrough,
    lastDatasetUpdate: dataset.meta.lastDatasetUpdate,
  };

  write("stats.json", { ...meta, ...getSiteStats(dataset) });

  const events = getCountableEvents(dataset.events).map((event) => {
    const company = dataset.companies.find((c) => c.id === event.companyId);
    const industry = company
      ? dataset.industries.find((i) => i.id === company.industryId)
      : undefined;
    const wage = estimateEventWage(event, company, dataset.wageReference);
    return {
      id: event.id,
      slug: event.slug,
      companyId: event.companyId,
      companyName: company?.name ?? event.companyId,
      industryId: company?.industryId ?? null,
      industryName: industry?.name ?? null,
      announcementDate: event.announcementDate,
      effectiveDate: event.effectiveDate,
      globalJobsLost: event.globalJobsLost,
      usJobsLost: event.usJobsLost,
      jobsEstimated: event.jobsEstimated,
      percentageWorkforce: event.percentageWorkforce,
      attributionLevel: event.attributionLevel,
      confidence: event.confidence,
      status: event.status,
      investmentRelationship: event.investmentRelationship,
      summary: event.summary,
      locations: event.locations,
      estimatedAnnualWage: wage?.estimatedAnnualWage ?? null,
      wageMethod: wage?.method ?? null,
      sources: getSourcesForEvent(dataset, event.id).map((s) => ({
        url: s.url,
        title: s.title,
        publisher: s.publisher,
        primarySource: s.primarySource,
      })),
    };
  });
  write("events.json", { ...meta, count: events.length, events });

  write("companies.json", { ...meta, companies: dataset.companies });
  write("industries.json", { ...meta, industries: dataset.industries });
  write("investments.json", { ...meta, investments: dataset.investments });
  write("corrections.json", { ...meta, corrections: dataset.corrections });

  write("timeline.json", {
    ...meta,
    confirmed: getTimeline(getConfirmedEvents(dataset), dataset, "global"),
    allAILinked: getTimeline(getAllAILinkedEvents(dataset), dataset, "global"),
  });

  console.log(`Generated public data in public/generated (${events.length} events).`);
}

main();
