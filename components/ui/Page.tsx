import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";

export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
}) {
  return (
    <div className="border-b border-rule">
      <Container className="py-10 sm:py-12">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {intro && <div className="mt-3 max-w-prose text-base leading-relaxed text-muted">{intro}</div>}
      </Container>
    </div>
  );
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{children}</h2>
  );
}
