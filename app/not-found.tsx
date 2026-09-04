import Link from "next/link";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="font-serif text-5xl font-semibold text-accent">404</p>
      <h1 className="mt-4 text-lg font-medium">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The page you asked for does not exist.</p>
      <div className="mt-6 flex justify-center gap-4 text-sm">
        <Link href="/" className="text-accent hover:underline">
          Home
        </Link>
        <Link href="/events" className="text-accent hover:underline">
          Tracker
        </Link>
        <Link href="/methodology" className="text-accent hover:underline">
          Methodology
        </Link>
      </div>
    </Container>
  );
}
