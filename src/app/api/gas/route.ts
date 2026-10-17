import { NextResponse } from 'next/server';
import {
  isDuplicateKeyError,
  jsonError,
  parseRange,
  SESSION_LIST_LIMIT,
  sumUsage,
  timerState,
  toSessionEntry,
  unauthorized,
} from '@/app/lib/api-utils';
import { getCurrentUser } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import type { MySessionsResponse, TimerActionResponse } from '@/app/lib/types';
import { GasSession } from '@/app/models/GasSession';

// Start or stop the signed-in user's timer. Who the user is always comes from
// the session cookie, never from the request body.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action !== 'START' && action !== 'STOP') return jsonError('Invalid action', 400);

  await connectToDatabase();
  const running = await GasSession.findOne({ userEmail: user.email, endTime: null });

  if (action === 'START') {
    if (running) return jsonError('A timer is already running.', 409, timerState(running));
    try {
      const session = await GasSession.create({
        userEmail: user.email,
        userName: user.name,
        userImage: user.image,
        startTime: new Date(),
      });
      return NextResponse.json<TimerActionResponse>(timerState(session), { status: 201 });
    } catch (error) {
      // Lost a race against a simultaneous start (see the unique index on the model).
      if (!isDuplicateKeyError(error)) throw error;
      const winner = await GasSession.findOne({ userEmail: user.email, endTime: null });
      return jsonError('A timer is already running.', 409, timerState(winner));
    }
  }

  if (!running) return jsonError('No timer is running.', 409, timerState(null));

  const endTime = new Date();
  running.endTime = endTime;
  running.durationInSeconds = Math.max(0, Math.floor((endTime.getTime() - running.startTime.getTime()) / 1000));
  await running.save();

  return NextResponse.json<TimerActionResponse>({ ...timerState(null), session: toSessionEntry(running) });
}

// The signed-in user's completed sessions in the requested range.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const range = parseRange(new URL(req.url).searchParams);
  if ('error' in range) return jsonError(range.error, 400);

  await connectToDatabase();
  const match = { userEmail: user.email, endTime: { $ne: null }, ...range };
  const [sessions, summary] = await Promise.all([
    GasSession.find(match)
      .sort({ startTime: -1 })
      .limit(SESSION_LIST_LIMIT)
      .select('startTime endTime durationInSeconds')
      .lean(),
    sumUsage(match),
  ]);

  return NextResponse.json<MySessionsResponse>({
    sessions: sessions.map(toSessionEntry),
    summary,
    truncated: summary.count > sessions.length,
  });
}
