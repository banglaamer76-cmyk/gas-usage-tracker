import Link from "next/link";
import { AppMark } from "./components/brand";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-xs">
        <AppMark size={56} className="mx-auto" />
        <h1 className="mt-5 font-display text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-ink-muted">There&apos;s nothing at this address.</p>
        <Link
          href="/"
          className="mx-auto mt-6 inline-flex h-11 items-center rounded-full bg-surface-raised px-5 text-sm font-semibold text-ink ring-1 ring-line-strong transition-colors hover:bg-line"
        >
          Back to the timer
        </Link>
      </div>
    </main>
  );
}
