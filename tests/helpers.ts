import type { Dataset } from "@/lib/data";
import type { Company, Source, WorkforceEvent } from "@/lib/schemas";
import type { WageReference, HouseholdReference, GeographicReference } from "@/lib/reference";

export function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: "acme",
    slug: "acme",
    name: "Acme",
    ticker: null,
    industryId: "technology",
    website: null,
    headquarters: null,
    latestKnownWorkforce: null,
    workforceAsOf: null,
    description: "Test company.",
    ...overrides,
  };
}

export function makeEvent(overrides: Partial<WorkforceEvent> = {}): WorkforceEvent {
  return {
    id: "evt-1",
    slug: "evt-1",
    companyId: "acme",
    announcementDate: "2025-01-01",
    effectiveDate: null,
    globalJobsLost: 100,
    usJobsLost: null,
    aiAttributedJobsGlobal: null,
    aiAttributedJobsUS: null,
    reductionMechanism: "UNKNOWN",
    jobsEstimated: false,
    percentageWorkforce: null,
    attributionLevel: "A",
    confidence: "HIGH",
    status: "executed",
    summary: "Test event.",
    whyClassified: "Test rationale.",
    whatWeKnow: [],
    whatWeDontKnow: ["Unknown."],
    aiInvestmentContext: null,
    locations: [],
    occupations: [],
    sourceIds: ["src-1"],
    investmentRelationship: "UNCONFIRMED",
    relatedInvestmentIds: [],
    knownAnnualCompensationPerWorker: null,
    parentEventId: null,
    programId: null,
    published: true,
    lastReviewedAt: "2025-01-01",
    notes: null,
    ...overrides,
  };
}

export function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: "src-1",
    eventId: "evt-1",
    url: "https://example.com/report",
    title: "Report",
    publisher: "Example",
    publishedAt: null,
    retrievedAt: "2025-01-01",
    sourceType: "financial_press",
    primarySource: false,
    supportsHeadcount: true,
    supportsAIAttribution: true,
    supportsLocation: false,
    supportsInvestmentRelationship: false,
    evidenceNote: "Supports AI attribution.",
    ...overrides,
  };
}

const wageReference: WageReference = {
  source: "Test",
  sourceUrl: "https://example.com",
  sourceYear: 2023,
  note: "Test wages.",
  nationalMedianAnnualWage: 50000,
  byIndustry: [{ industryId: "technology", medianAnnualWage: 100000 }],
};

const householdReference: HouseholdReference = {
  averageHouseholdSize: 2.5,
  source: "Test",
  sourceUrl: "https://example.com",
  year: 2023,
  note: "Test household size.",
};

const geographicReference: GeographicReference = {
  states: [{ abbr: "WA", name: "Washington", region: "West", tileRow: 0, tileCol: 0 }],
};

export function makeDataset(overrides: Partial<Dataset> = {}): Dataset {
  return {
    industries: [
      { id: "technology", slug: "technology", name: "Technology", description: "Tech." },
    ],
    companies: [makeCompany()],
    events: [],
    sources: [],
    investments: [],
    corrections: [],
    wageReference,
    householdReference,
    geographicReference,
    externalBenchmarks: [],
    meta: {
      dataThrough: "2025-01-01",
      lastDatasetUpdate: "2025-01-01",
      methodologyVersion: "1.0.0",
    },
    ...overrides,
  };
}
