"use client";

import { useEffect } from "react";
import { useOnline } from "@/app/hooks/use-online";
import { APP_NAME, SPLASH_LOGO_SIZE } from "@/app/lib/brand";
import { AppMark } from "./brand";
import { RefreshIcon, WifiOffIcon } from "./icons";

/** Same layout as the iOS launch images, so starting the app has no visible jump. */
export function SplashScreen() {
  return (
    <div role="status" aria-label="Loading" className="fixed inset-0 grid place-items-center bg-canvas">
      <AppMark size={SPLASH_LOGO_SIZE} />
    </div>
  );
}

/** Shown when the server can't be reached, so the session can't be checked. */
export function OfflineScreen() {
  const online = useOnline();

  useEffect(() => {
    const reload = () => window.location.reload();
    window.addEventListener("online", reload);
    return () => window.removeEventListener("online", reload);
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-xs animate-enter">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/5 text-ink-muted">
          <WifiOffIcon size={26} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold">
          {online ? `Can't reach ${APP_NAME}` : "You're offline"}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {APP_NAME} needs a connection to sync your timer. It will reconnect on its own as soon as it can.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mx-auto mt-6 flex h-11 items-center gap-2 rounded-full bg-surface-raised px-5 text-sm font-semibold text-ink ring-1 ring-line-strong transition-colors hover:bg-line"
        >
          <RefreshIcon size={18} /> Try again
        </button>
      </div>
    </main>
  );
}
