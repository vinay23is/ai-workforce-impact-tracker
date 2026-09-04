import Link from "next/link";
import { loadDataset } from "@/lib/data";
import { formatDate } from "@/lib/formatting";
import { SITE_NAME } from "@/lib/site";
import { Container } from "./Container";

const FOOTER_LINKS = [
  { href: "/events", label: "Tracker" },
  { href: "/companies", label: "Companies" },
  { href: "/industries", label: "Industries" },
  { href: "/map", label: "Map" },
  { href: "/ai-investment", label: "AI Investment" },
  { href: "/methodology", label: "Methodology" },
  { href: "/corrections", label: "Corrections" },
  { href: "/resources", label: "Worker Resources" },
  { href: "/data", label: "Download Data" },
];

export function SiteFooter() {
  const { meta } = loadDataset();
  return (
    <footer className="mt-20 border-t border-rule">
      <Container className="py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          <div className="max-w-prose">
            <p className="font-serif text-base font-semibold">{SITE_NAME}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              An open, version-controlled dataset. Every figure links to its sources, and the
              methodology is public. Numbers are only as good as the evidence behind them — where
              evidence is thin, we say so.
            </p>
            <p className="mt-4 text-xs text-faint">
              Data through {formatDate(meta.dataThrough)} · Last update{" "}
              {formatDate(meta.lastDatasetUpdate)} · Methodology v{meta.methodologyVersion}
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {FOOTER_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-ink-soft hover:text-accent">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="mt-8 border-t border-rule pt-6 text-xs text-faint">
          This project reports evidence and does not offer investment or legal advice. Company names
          and trademarks belong to their owners.
        </p>
      </Container>
    </footer>
  );
}
