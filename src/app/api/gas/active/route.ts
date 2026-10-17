import { NextResponse } from 'next/server';
import { jsonError, parseRange, sumUsage, timerState, unauthorized } from '@/app/lib/api-utils';
import { getCurrentUser } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import type { StatusResponse } from '@/app/lib/types';
import { GasSession } from '@/app/models/GasSession';

// The signed-in user's running timer, plus their completed usage in the
// requested range (the client asks for "since the start of my day").
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const range = parseRange(new URL(req.url).searchParams);
  if ('error' in range) return jsonError(range.error, 400);

  await connectToDatabase();
  const [running, today] = await Promise.all([
    GasSession.findOne({ userEmail: user.email, endTime: null }).select('startTime').lean(),
    range.startTime
      ? sumUsage({ userEmail: user.email, endTime: { $ne: null }, ...range })
      : { totalSeconds: 0, count: 0 },
  ]);

  return NextResponse.json<StatusResponse>({ ...timerState(running), today });
}
