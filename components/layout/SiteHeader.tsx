"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV, SITE_NAME } from "@/lib/site";
import { Container } from "./Container";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="border-b border-rule bg-paper/95 sticky top-0 z-40 backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="group flex flex-col leading-none" onClick={() => setOpen(false)}>
            <span className="font-serif text-lg font-semibold tracking-tight">{SITE_NAME}</span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Public dataset
            </span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] uppercase tracking-[0.08em] transition-colors hover:text-accent ${
                  isActive(item.href) ? "text-accent" : "text-ink-soft"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </Container>

      {open && (
        <nav className="border-t border-rule lg:hidden" aria-label="Primary mobile">
          <Container>
            <ul className="flex flex-col py-2">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block py-2 text-sm uppercase tracking-[0.08em] ${
                      isActive(item.href) ? "text-accent" : "text-ink-soft"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </nav>
      )}
    </header>
  );
}
