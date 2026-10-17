"use client";

import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { ToastProvider } from "./components/toast";
import { ApiError, apiFetch } from "./lib/api-client";

// Retry network and server errors, but not ones a retry can't fix (signed out, bad request).
const shouldRetryOnError = (error: unknown) =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* Data refreshes when the app regains focus or reconnects, e.g. reopening the installed app. */}
      <SWRConfig value={{ fetcher: apiFetch, shouldRetryOnError, errorRetryCount: 3 }}>
        <ToastProvider>{children}</ToastProvider>
      </SWRConfig>
    </SessionProvider>
  );
}
