"use client";

import { useEffect } from "react";
import { Flame } from "@/app/components/brand";
import { PlayIcon, RefreshIcon, Spinner, StopIcon } from "@/app/components/icons";
import { useNow } from "@/app/hooks/use-now";
import { APP_NAME } from "@/app/lib/brand";
import { cx } from "@/app/lib/cx";
import { formatClock, formatDuration, formatDurationLong, formatTime } from "@/app/lib/format";
import type { StatusResponse } from "@/app/lib/types";

export interface TimerStatus extends StatusResponse {
  /** Server clock minus device clock (ms), so a wrong phone clock can't skew the timer. */
  clockOffset: number;
}

interface TimerCardProps {
  status: TimerStatus | undefined;
  failed: boolean;
  pending: boolean;
  disabled: boolean;
  onToggle: () => void;
  onRetry: () => void;
}

export function TimerCard({ status, failed, pending, disabled, onToggle, onRetry }: TimerCardProps) {
  const active = status?.activeSession ?? null;
  const running = active !== null;
  const now = useNow(running);
  const elapsed = active
    ? Math.max(0, (now + (status?.clockOffset ?? 0) - Date.parse(active.startTime)) / 1000)
    : 0;
  const todaySeconds = (status?.today.totalSeconds ?? 0) + elapsed;

  // Show the running time in the browser tab, too.
  const title = running ? `${formatClock(elapsed)} · ${APP_NAME}` : APP_NAME;
  useEffect(() => {
    document.title = title;
  }, [title]);

  let hint = "Start the timer when you light the stove.";
  if (active) hint = `Started at ${formatTime(active.startTime)}`;
  else if (failed && !status) hint = "Couldn't load your timer.";
  else if (!status) hint = "Loading…";

  return (
    <section
      aria-label="Stove timer"
      className={cx(
        "relative overflow-hidden rounded-3xl border bg-surface transition-colors duration-500",
        running ? "border-brand/30" : "border-line"
      )}
    >
      {running && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-glow bg-[radial-gradient(ellipse_75%_55%_at_50%_100%,rgb(251_146_60/0.16),transparent_70%)]"
        />
      )}

      <div className="relative px-5 pb-5 pt-4">
        <div className="flex items-center justify-between gap-3">
          <span
            className={cx(
              "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider",
              running ? "bg-live/10 text-live" : "bg-white/5 text-ink-subtle"
            )}
          >
            <span
              className={cx(
                "size-2 rounded-full",
                running ? "animate-blink bg-live shadow-[0_0_8px_var(--color-live)]" : "bg-ink-subtle/70"
              )}
            />
            {running ? "Running" : "Ready"}
          </span>
          <p className="text-sm text-ink-muted">
            Today{" "}
            <span className="font-semibold text-ink">{status ? formatDuration(todaySeconds) : "–"}</span>
          </p>
        </div>

        <div className="mt-5 flex flex-col items-center text-center">
          <Flame
            lit={running}
            className={cx(
              "size-14 transition-[filter] duration-500",
              running && "drop-shadow-[0_0_14px_rgba(251,146,60,0.65)]"
            )}
          />
          <p
            role="timer"
            aria-label={running ? `Running for ${formatDurationLong(elapsed)}` : "Timer stopped"}
            className={cx(
              "mt-3 text-[clamp(3.75rem,20vw,6rem)] font-semibold leading-none tracking-tight tabular-nums transition-colors duration-500",
              running ? "text-brand [text-shadow:0_0_40px_rgb(251_146_60/0.35)]" : status ? "text-ink" : "text-ink-subtle"
            )}
          >
            {formatClock(elapsed)}
          </p>
          <p className="mt-3 min-h-5 text-sm text-ink-muted">{hint}</p>
        </div>

        {failed && !status ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-surface-raised text-base font-semibold text-ink ring-1 ring-line-strong transition-colors hover:bg-line"
          >
            <RefreshIcon size={20} /> Try again
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            disabled={!status || pending || disabled}
            aria-busy={pending}
            className={cx(
              "mt-5 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-lg font-bold text-white shadow-lg transition duration-150 enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
              running
                ? "bg-linear-to-b from-red-600 to-red-700 shadow-red-950/50"
                : "bg-linear-to-b from-brand-deep to-brand-deeper shadow-orange-950/50"
            )}
          >
            {pending ? <Spinner /> : running ? <StopIcon size={22} /> : <PlayIcon size={22} />}
            {running ? "Stop timer" : "Start timer"}
          </button>
        )}
      </div>
    </section>
  );
}
