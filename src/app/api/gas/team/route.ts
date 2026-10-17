import { NextResponse } from 'next/server';
import {
  jsonError,
  parseRange,
  SESSION_LIST_LIMIT,
  toSessionEntry,
  unauthorized,
} from '@/app/lib/api-utils';
import { getCurrentUser } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import type { HouseholdResponse, MemberSummary } from '@/app/lib/types';
import { GasSession } from '@/app/models/GasSession';

// Everyone's completed sessions in the requested range, with per-member totals.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const range = parseRange(new URL(req.url).searchParams);
  if ('error' in range) return jsonError(range.error, 400);

  await connectToDatabase();
  const match = { endTime: { $ne: null }, ...range };
  const [sessions, members] = await Promise.all([
    GasSession.find(match)
      .sort({ startTime: -1 })
      .limit(SESSION_LIST_LIMIT)
      .select('userEmail startTime endTime durationInSeconds')
      .lean(),
    GasSession.aggregate<MemberSummary>([
      { $match: match },
      // Newest first, so $first picks each member's current name and photo.
      { $sort: { startTime: -1 } },
      {
        $group: {
          _id: '$userEmail',
          userName: { $first: '$userName' },
          userImage: { $first: '$userImage' },
          totalSeconds: { $sum: '$durationInSeconds' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalSeconds: -1, _id: 1 } },
      { $project: { _id: 0, userEmail: '$_id', userName: 1, userImage: 1, totalSeconds: 1, count: 1 } },
    ]),
  ]);

  const summary = members.reduce(
    (total, member) => ({
      totalSeconds: total.totalSeconds + member.totalSeconds,
      count: total.count + member.count,
    }),
    { totalSeconds: 0, count: 0 }
  );

  return NextResponse.json<HouseholdResponse>({
    sessions: sessions.map(toSessionEntry),
    members,
    summary,
    truncated: summary.count > sessions.length,
  });
}
