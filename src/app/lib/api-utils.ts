import { NextResponse } from 'next/server';
import { GasSession } from '@/app/models/GasSession';
import type { SessionEntry, TimerState, UsageSummary } from './types';

/** Max sessions returned in one list. Totals always cover the whole range. */
export const SESSION_LIST_LIMIT = 500;

export function jsonError(error: string, status: number, extra?: object) {
  return NextResponse.json({ error, ...extra }, { status });
}

export const unauthorized = () => jsonError('Please sign in again.', 401);

type StartTimeRange = { $gte?: Date; $lt?: Date };

/**
 * Reads the optional `from` (inclusive) and `to` (exclusive) ISO timestamps.
 * The browser computes them in the viewer's timezone, so day and month
 * boundaries are always local to the person looking at the data.
 */
export function parseRange(params: URLSearchParams): { error: string } | { startTime?: StartTimeRange } {
  const startTime: StartTimeRange = {};
  for (const [name, operator] of [['from', '$gte'], ['to', '$lt']] as const) {
    const value = params.get(name);
    if (!value) continue;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { error: `Invalid "${name}" date` };
    startTime[operator] = date;
  }
  return Object.keys(startTime).length > 0 ? { startTime } : {};
}

/** Total duration and number of sessions matching a filter. */
export async function sumUsage(match: Record<string, unknown>): Promise<UsageSummary> {
  const [summary] = await GasSession.aggregate<UsageSummary>([
    { $match: match },
    { $group: { _id: null, totalSeconds: { $sum: '$durationInSeconds' }, count: { $sum: 1 } } },
    { $project: { _id: 0, totalSeconds: 1, count: 1 } },
  ]);
  return summary ?? { totalSeconds: 0, count: 0 };
}

export function timerState(running: { _id: unknown; startTime: Date } | null): TimerState {
  return {
    activeSession: running
      ? { _id: String(running._id), startTime: running.startTime.toISOString() }
      : null,
    serverTime: Date.now(),
  };
}

type StoredSession = {
  _id: unknown;
  startTime: Date;
  endTime?: Date | null;
  durationInSeconds?: number | null;
  userEmail?: string | null;
};

export function toSessionEntry(session: StoredSession): SessionEntry {
  return {
    _id: String(session._id),
    startTime: session.startTime.toISOString(),
    endTime: (session.endTime ?? session.startTime).toISOString(),
    durationInSeconds: session.durationInSeconds ?? 0,
    ...(session.userEmail && { userEmail: session.userEmail }),
  };
}

export function isDuplicateKeyError(error: unknown) {
  return (error as { code?: unknown } | null)?.code === 11000;
}
