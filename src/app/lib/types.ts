// Response shapes shared by the /api/gas route handlers and the client.

/** The signed-in user, as the client's NextAuth session describes them. */
export interface SessionUser {
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface ActiveSession {
  _id: string;
  startTime: string;
}

export interface UsageSummary {
  totalSeconds: number;
  count: number;
}

export interface SessionEntry {
  _id: string;
  startTime: string;
  endTime: string;
  durationInSeconds: number;
  /** Only present on household (team) lists. */
  userEmail?: string;
}

export interface MemberSummary extends UsageSummary {
  userEmail: string;
  userName: string;
  userImage?: string | null;
}

/** GET /api/gas/active, plus the shape returned by POST /api/gas. */
export interface TimerState {
  activeSession: ActiveSession | null;
  /** Server clock (ms) so the client can correct for device clock skew. */
  serverTime: number;
}

export interface StatusResponse extends TimerState {
  /** Completed usage in the requested range (the client asks for its local day). */
  today: UsageSummary;
}

export interface TimerActionResponse extends TimerState {
  /** The session that was just completed (STOP only). */
  session?: SessionEntry;
}

export interface MySessionsResponse {
  sessions: SessionEntry[];
  summary: UsageSummary;
  /** True when the range has more sessions than the list returns. */
  truncated: boolean;
}

export interface HouseholdResponse extends MySessionsResponse {
  members: MemberSummary[];
}

/** GET and PUT /api/gas/cylinder. */
export interface CylinderResponse {
  /** The day the current gas cylinder was connected ("YYYY-MM-DD"), or null if it was never set. */
  changedOn: string | null;
  /** Who last set the date. */
  setBy: { email: string; name: string } | null;
  /** Whether the signed-in user may change the date. */
  canEdit: boolean;
}
