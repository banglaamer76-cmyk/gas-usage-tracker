"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { Avatar } from "@/app/components/avatar";
import { ClockIcon, RefreshIcon } from "@/app/components/icons";
import { cx } from "@/app/lib/cx";
import { formatDay, formatDuration, formatTime, plural, startOfDay } from "@/app/lib/format";
import type { MemberSummary, SessionEntry } from "@/app/lib/types";

const PAGE_SIZE = 30;

type DayGroup = { key: string; date: Date; totalSeconds: number; sessions: SessionEntry[] };

/** Sessions arrive newest first, so each day's sessions are consecutive. */
function groupByDay(sessions: SessionEntry[]) {
  const groups: DayGroup[] = [];
  for (const session of sessions) {
    const date = startOfDay(new Date(session.startTime));
    const key = date.toDateString();
    let group = groups.at(-1);
    if (group?.key !== key) {
      group = { key, date, totalSeconds: 0, sessions: [] };
      groups.push(group);
    }
    group.sessions.push(session);
    group.totalSeconds += session.durationInSeconds;
  }
  return groups;
}

export const firstName = (name: string) => name.split(/\s+/)[0] || name;

interface SessionListProps {
  title: string;
  /** Extra header content, e.g. a "clear filter" button. */
  action?: ReactNode;
  sessions: SessionEntry[] | undefined;
  /** Previous results shown while new ones load. */
  stale: boolean;
  error: unknown;
  onRetry: () => void;
  /** Total sessions in the range, when the server returned only the latest ones. */
  truncatedFrom?: number;
  /** For household lists: who each session belongs to. */
  people?: Map<string, MemberSummary>;
  currentUserEmail: string;
  emptyMessage: string;
  today: Date;
}

export function SessionList(props: SessionListProps) {
  const { title, action, sessions, stale, error, onRetry, truncatedFrom, people, currentUserEmail, emptyMessage, today } = props;
  const headingId = useId();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const groups = useMemo(() => groupByDay(sessions ?? []), [sessions]);

  let content: ReactNode;
  if (!sessions && error) {
    content = (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <p className="text-sm text-ink-muted">Couldn&apos;t load sessions.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-brand transition-colors hover:bg-white/5"
        >
          <RefreshIcon size={16} /> Try again
        </button>
      </div>
    );
  } else if (!sessions) {
    content = (
      <div className="space-y-1 px-3 py-3">
        <span className="sr-only">Loading sessions</span>
        {[0, 1, 2, 3].map((row) => (
          <div key={row} aria-hidden="true" className="flex items-center justify-between py-2.5">
            <div className="h-3.5 w-40 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="h-3.5 w-12 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
        ))}
      </div>
    );
  } else if (sessions.length === 0) {
    content = (
      <div className="flex flex-col items-center px-6 pb-10 pt-6 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-white/5 text-ink-subtle">
          <ClockIcon size={22} />
        </span>
        <p className="mt-3 text-sm font-semibold text-ink">No sessions in this period</p>
        <p className="mt-1 max-w-64 text-sm text-ink-muted">{emptyMessage}</p>
      </div>
    );
  } else {
    // Show the first `visibleCount` sessions, keeping their day headings.
    const visibleGroups: DayGroup[] = [];
    let remaining = visibleCount;
    for (const group of groups) {
      if (remaining <= 0) break;
      visibleGroups.push({ ...group, sessions: group.sessions.slice(0, remaining) });
      remaining -= group.sessions.length;
    }

    content = (
      <>
        {visibleGroups.map((group) => (
          <div key={group.key} className="pt-1">
            <div className="flex items-baseline justify-between px-3 pb-1 pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                {formatDay(group.date, today)}
              </h3>
              <span className="text-xs font-medium tabular-nums text-ink-subtle">{formatDuration(group.totalSeconds)}</span>
            </div>
            <ul>
              {group.sessions.map((session) => {
                const person = people && session.userEmail ? people.get(session.userEmail) : undefined;
                const isMe = session.userEmail === currentUserEmail;
                return (
                  <li key={session._id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
                    {people && (
                      <Avatar src={person?.userImage} name={person?.userName ?? session.userEmail} size={32} />
                    )}
                    <div className="min-w-0 flex-1">
                      {people && (
                        <p className="truncate text-sm font-medium text-ink">
                          {isMe ? "You" : firstName(person?.userName ?? session.userEmail ?? "Unknown")}
                        </p>
                      )}
                      <p className={cx("tabular-nums", people ? "text-xs text-ink-subtle" : "text-sm text-ink-muted")}>
                        {formatTime(session.startTime)} – {formatTime(session.endTime)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-ink">
                      {formatDuration(session.durationInSeconds)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {visibleCount < sessions.length ? (
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="mt-1 h-11 w-full rounded-2xl text-sm font-semibold text-brand transition-colors hover:bg-white/[0.03]"
          >
            Show more
          </button>
        ) : (
          truncatedFrom !== undefined && (
            <p className="px-3 pb-2 pt-3 text-center text-xs text-ink-subtle">
              Showing the latest {plural(sessions.length, "session")} of {truncatedFrom}. Totals above include them
              all.
            </p>
          )
        )}
      </>
    );
  }

  return (
    <section aria-labelledby={headingId} className="rounded-3xl border border-line bg-surface">
      <div className="flex min-h-14 items-center justify-between gap-3 px-5 pt-4">
        <h2 id={headingId} className="font-display text-base font-bold text-ink">
          {title}
        </h2>
        {action}
      </div>
      <div aria-busy={stale} className={cx("px-2 pb-2 transition-opacity duration-200", stale && "opacity-50")}>
        {content}
      </div>
    </section>
  );
}
