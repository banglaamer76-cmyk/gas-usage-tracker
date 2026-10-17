"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { useSWRConfig } from "swr";
import { RefreshIcon } from "./components/icons";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    console.error(error);
  }, [error]);

  function tryAgain() {
    // The app's data lives in SWR's cache; drop it so a bad response is fetched afresh.
    mutate(() => true, undefined, { revalidate: false });
    retry();
  }

  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-xs">
        <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-muted">
          An unexpected error stopped this screen from loading. Your timer data is safe.
        </p>
        <button
          type="button"
          onClick={tryAgain}
          className="mx-auto mt-6 flex h-11 items-center gap-2 rounded-full bg-surface-raised px-5 text-sm font-semibold text-ink ring-1 ring-line-strong transition-colors hover:bg-line"
        >
          <RefreshIcon size={18} /> Try again
        </button>
      </div>
    </main>
  );
}
