import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = {
  title: "Worker resources",
  description:
    "Neutral links to public programs for workers affected by layoffs: job centers, unemployment, retraining, and job search.",
};

const RESOURCES: Array<{ title: string; url: string; description: string }> = [
  {
    title: "CareerOneStop — American Job Centers",
    url: "https://www.careeronestop.org/LocalHelp/local-help.aspx",
    description:
      "Find your nearest American Job Center for in-person help with job search, training, and benefits. Run by the U.S. Department of Labor.",
  },
  {
    title: "CareerOneStop — Worker Layoff and Rapid Response",
    url: "https://www.careeronestop.org/WorkerReEmployment/worker-reemployment.aspx",
    description: "Guidance for workers after a layoff, including immediate next steps and support programs.",
  },
  {
    title: "Unemployment Benefits Finder",
    url: "https://www.careeronestop.org/LocalHelp/UnemploymentBenefits/find-unemployment-benefits.aspx",
    description: "Locate your state's unemployment insurance office and understand eligibility.",
  },
  {
    title: "USAGov — Unemployment help",
    url: "https://www.usa.gov/unemployment-benefits",
    description: "Official plain-language overview of unemployment benefits and how to apply.",
  },
  {
    title: "CareerOneStop — Training finder",
    url: "https://www.careeronestop.org/FindTraining/find-training.aspx",
    description: "Search local training programs, including options funded through public workforce programs.",
  },
  {
    title: "Dislocated Worker Program (WIOA)",
    url: "https://www.dol.gov/agencies/eta/dislocated-workers",
    description: "Federal program offering reemployment services and retraining for workers who lost jobs through no fault of their own.",
  },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Worker Resources"
        title="If you've been affected"
        intro="Neutral links to legitimate public programs. No affiliate links, no paid training products, no bootcamp promotions."
      />
      <Container className="py-8">
        <ul className="grid max-w-3xl gap-4 sm:grid-cols-2">
          {RESOURCES.map((r) => (
            <li key={r.url} className="border border-rule bg-surface p-4">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium hover:text-accent"
              >
                {r.title}
                <ExternalLink size={13} aria-hidden />
              </a>
              <p className="mt-2 text-sm text-muted">{r.description}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-prose text-xs text-faint">
          These links point to US government and public workforce resources. This site does not
          provide legal or financial advice, and it earns nothing from these links.
        </p>
      </Container>
    </>
  );
}
