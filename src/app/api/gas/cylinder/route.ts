import { NextResponse } from 'next/server';
import { jsonError, unauthorized } from '@/app/lib/api-utils';
import { canEditCylinder, getCurrentUser, type CurrentUser } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import type { CylinderResponse } from '@/app/lib/types';
import { CURRENT_CYLINDER, Cylinder, type CylinderFields } from '@/app/models/Cylinder';

// UTC+14 is the furthest-ahead timezone, so a day has begun somewhere once its
// UTC midnight is less than this far away.
const MAX_UTC_OFFSET_MS = 14 * 60 * 60 * 1000;

/** UTC midnight of a real "YYYY-MM-DD" date, the format a date input submits. */
function parseDay(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  // Also rejects days that don't exist, like 2026-02-30.
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) ? date : undefined;
}

type StoredCylinder = Pick<CylinderFields, 'changedOn' | 'updatedByEmail' | 'updatedByName'>;

function toResponse(cylinder: StoredCylinder | null, user: CurrentUser): CylinderResponse {
  return {
    changedOn: cylinder?.changedOn ?? null,
    setBy: cylinder ? { email: cylinder.updatedByEmail, name: cylinder.updatedByName } : null,
    canEdit: canEditCylinder(user.email),
  };
}

// When the household's current gas cylinder was connected. Everyone can see
// it; only the accounts in CYLINDER_EDITORS can change it.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  await connectToDatabase();
  const cylinder = await Cylinder.findById(CURRENT_CYLINDER).lean();
  return NextResponse.json<CylinderResponse>(toResponse(cylinder, user));
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!canEditCylinder(user.email)) return jsonError("You don't have permission to change the cylinder date.", 403);

  const body = await req.json().catch(() => null);
  const changedOn = body?.changedOn;
  const day = parseDay(changedOn);
  if (!day) return jsonError('Invalid date', 400);
  if (day.getTime() - MAX_UTC_OFFSET_MS > Date.now()) {
    return jsonError("The cylinder change date can't be in the future.", 400);
  }

  await connectToDatabase();
  const cylinder = await Cylinder.findByIdAndUpdate(
    CURRENT_CYLINDER,
    { changedOn, updatedByEmail: user.email, updatedByName: user.name },
    { upsert: true, returnDocument: 'after', lean: true }
  );
  return NextResponse.json<CylinderResponse>(toResponse(cylinder, user));
}
