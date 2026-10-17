"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { AppMark, Wordmark } from "@/app/components/brand";
import { WifiOffIcon } from "@/app/components/icons";
import { InstallBanner } from "@/app/components/install";
import { useToast } from "@/app/components/toast";
import { useOnline } from "@/app/hooks/use-online";
import { useTodayStart } from "@/app/hooks/use-today";
import { ApiError, apiFetch } from "@/app/lib/api-client";
import { formatDuration } from "@/app/lib/format";
import { rangeSearch } from "@/app/lib/periods";
import type { SessionEntry, SessionUser, StatusResponse, TimerActionResponse } from "@/app/lib/types";
import { TimerCard, type TimerStatus } from "./timer-card";
import { UsagePanel } from "./usage-panel";
import { UserMenu } from "./user-menu";

async function fetchStatus(url: string): Promise<TimerStatus> {
  const status = await apiFetch<StatusResponse>(url);
  return { ...status, clockOffset: status.serverTime - Date.now() };
}

const isGasApiKey = (key: unknown) => typeof key === "string" && key.startsWith("/api/gas");

export function Dashboard({ user }: { user: SessionUser }) {
  const showToast = useToast();
  const online = useOnline();
  const todayStart = useTodayStart();
  const today = useMemo(() => new Date(todayStart), [todayStart]);
  const { mutate } = useSWRConfig();
  const [pending, setPending] = useState(false);

  const {
    data: status,
    error: statusError,
    mutate: mutateStatus,
  } = useSWR(`/api/gas/active${rangeSearch({ from: today })}`, fetchStatus);

  async function toggleTimer() {
    if (!status || pending) return;
    const action = status.activeSession ? "STOP" : "START";
    navigator.vibrate?.(15);
    setPending(true);

    let saved: SessionEntry | undefined;
    let refreshAll = action === "STOP";
    try {
      // Flip the UI immediately; roll back if the server says no.
      await mutateStatus(
        async (current = status) => {
          const result = await apiFetch<TimerActionResponse>("/api/gas", {
            method: "POST",
            body: JSON.stringify({ action }),
          });
          saved = result.session;
          return { ...current, activeSession: result.activeSession, clockOffset: result.serverTime - Date.now() };
        },
        {
          optimisticData: (current = status) => ({
            ...current,
            activeSession:
              action === "START"
                ? { _id: "pending", startTime: new Date(Date.now() + current.clockOffset).toISOString() }
                : null,
          }),
          rollbackOnError: true,
          revalidate: false,
        }
      );
      if (saved) showToast("success", `Saved a ${formatDuration(saved.durationInSeconds)} session.`);
    } catch (error) {
      refreshAll = true;
      if (error instanceof ApiError && error.status === 409) {
        // Changed from another device or tab: show the real state instead.
        showToast(
          "info",
          action === "START" ? "Your timer was already running." : "Your timer had already been stopped."
        );
      } else {
        showToast("error", error instanceof Error ? error.message : "Something went wrong. Please try again.");
      }
    } finally {
      setPending(false);
    }

    // Stopping changes today's total and the session lists.
    if (refreshAll) mutate(isGasApiKey);
  }

  return (
    <div className="min-h-dvh pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
          <div className="flex items-center gap-2.5">
            <AppMark size={30} />
            <h1 className="text-lg leading-none">
              <Wordmark />
            </h1>
          </div>
          <UserMenu user={user} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg space-y-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-4">
        {!online && (
          <p
            role="status"
            className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted"
          >
            <WifiOffIcon size={18} className="shrink-0 text-ink-subtle" />
            You&apos;re offline. The timer will work again once you reconnect.
          </p>
        )}
        <InstallBanner />
        <TimerCard
          status={status}
          failed={!!statusError}
          pending={pending}
          disabled={!online}
          onToggle={toggleTimer}
          onRetry={() => mutateStatus()}
        />
        <UsagePanel user={user} today={today} />
      </main>
    </div>
  );
}
