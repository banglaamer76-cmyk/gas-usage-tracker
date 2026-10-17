"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import useSWR from "swr";
import { Avatar } from "@/app/components/avatar";
import { CylinderIcon, LockIcon, RefreshIcon, Spinner, UserIcon, UsersIcon, XIcon } from "@/app/components/icons";
import { useToast } from "@/app/components/toast";
import { apiFetch } from "@/app/lib/api-client";
import { cx } from "@/app/lib/cx";
import { formatDay, formatDuration, formatPercent, plural } from "@/app/lib/format";
import {
  describeRange,
  getPeriodRange,
  parseDateInput,
  PERIODS,
  rangeSearch,
  toDateInput,
  type CustomRange,
  type PeriodId,
} from "@/app/lib/periods";
import type {
  CylinderResponse,
  HouseholdResponse,
  MemberSummary,
  MySessionsResponse,
  SessionUser,
} from "@/app/lib/types";
import { firstName, SessionList } from "./session-list";

type View = "mine" | "household";

const VIEWS = [
  { id: "mine", label: "My usage", Icon: UserIcon },
  { id: "household", label: "Household", Icon: UsersIcon },
] as const;

const CYLINDER_URL = "/api/gas/cylinder";

/** When the current gas cylinder was connected, and whether the viewer may change that. */
const useCylinder = () => useSWR<CylinderResponse>(CYLINDER_URL);

export function UsagePanel({ user, today }: { user: SessionUser; today: Date }) {
  const [view, setView] = useState<View>("mine");
  const [period, setPeriod] = useState<PeriodId>("cylinder");
  const [custom, setCustom] = useState<CustomRange>(() => ({
    from: toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: toDateInput(today),
  }));
  // The day the cylinder period counts up to. Null follows today.
  const [cylinderEnd, setCylinderEnd] = useState<string | null>(null);
  const [member, setMember] = useState<string | null>(null);

  const cylinder = useCylinder();
  const changedOn = cylinder.data?.changedOn ?? "";
  const range = useMemo(
    () => getPeriodRange(period, today, custom, { from: changedOn, to: cylinderEnd ?? "" }),
    [period, today, custom, changedOn, cylinderEnd]
  );
  // Null until the range is known (the cylinder period needs its change date first).
  const search = range && rangeSearch(range);
  const rangeLabel = range ? describeRange(period, range, today) : "";
  const cylinderUnset = period === "cylinder" && cylinder.data?.changedOn === null;

  // Only the visible view is fetched. Old results stay on screen (dimmed) while a new period loads,
  // but not while the range is unknown, where they would sit under the wrong period.
  const options = { keepPreviousData: search !== null };
  const mine = useSWR<MySessionsResponse>(view === "mine" && search !== null ? `/api/gas${search}` : null, options);
  const household = useSWR<HouseholdResponse>(
    view === "household" && search !== null ? `/api/gas/team${search}` : null,
    options
  );

  const people = useMemo(
    () => new Map(household.data?.members.map((person) => [person.userEmail, person])),
    [household.data]
  );
  const householdSessions = useMemo(
    () =>
      member
        ? household.data?.sessions.filter((session) => session.userEmail === member)
        : household.data?.sessions,
    [household.data, member]
  );

  function selectView(next: View) {
    setView(next);
    setMember(null);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = view === "mine" ? "household" : "mine";
    selectView(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  const listKey = `${view}|${search}|${member ?? ""}`;
  let householdTitle = "Everyone's sessions";
  if (member === user.email) householdTitle = "Your sessions";
  else if (member) householdTitle = `${firstName(people.get(member)?.userName ?? member.split("@")[0])}'s sessions`;

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Whose usage" className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1">
        {VIEWS.map(({ id, label, Icon }) => {
          const selected = view === id;
          return (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="usage-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => selectView(id)}
              onKeyDown={onTabKeyDown}
              className={cx(
                "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors",
                selected ? "bg-surface-raised text-ink shadow-sm ring-1 ring-line-strong" : "text-ink-muted hover:text-ink"
              )}
            >
              <Icon size={17} />
              {label}
            </button>
          );
        })}
      </div>

      <div id="usage-panel" role="tabpanel" aria-labelledby={`tab-${view}`} className="space-y-4">
        <PeriodPicker
          period={period}
          onPeriodChange={setPeriod}
          custom={custom}
          onCustomChange={setCustom}
          cylinderEnd={cylinderEnd}
          onCylinderEndChange={setCylinderEnd}
          currentUserEmail={user.email}
          today={today}
        />

        {cylinderUnset ? (
          <CylinderNotSet canEdit={!!cylinder.data?.canEdit} />
        ) : view === "mine" ? (
          <>
            <MySummary data={mine.data} rangeLabel={rangeLabel} stale={mine.isLoading && !!mine.data} />
            <SessionList
              key={listKey}
              title="Sessions"
              sessions={mine.data?.sessions}
              stale={mine.isLoading && !!mine.data}
              error={mine.error}
              onRetry={() => mine.mutate()}
              truncatedFrom={mine.data?.truncated ? mine.data.summary.count : undefined}
              currentUserEmail={user.email}
              emptyMessage="Sessions you time in this period will show up here."
              today={today}
            />
          </>
        ) : (
          <>
            <HouseholdSummary
              data={household.data}
              rangeLabel={rangeLabel}
              stale={household.isLoading && !!household.data}
              currentUserEmail={user.email}
              selected={member}
              onSelect={(email) => setMember((current) => (current === email ? null : email))}
            />
            <SessionList
              key={listKey}
              title={householdTitle}
              action={
                member && (
                  <button
                    type="button"
                    onClick={() => setMember(null)}
                    className="flex h-8 items-center gap-1.5 rounded-full bg-white/5 pl-3 pr-2.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-white/10 hover:text-ink"
                  >
                    Show everyone <XIcon size={14} />
                  </button>
                )
              }
              sessions={householdSessions}
              stale={household.isLoading && !!household.data}
              error={household.error}
              onRetry={() => household.mutate()}
              truncatedFrom={household.data?.truncated ? household.data.summary.count : undefined}
              people={people}
              currentUserEmail={user.email}
              emptyMessage={
                member === user.email
                  ? "You haven't used the stove in this period."
                  : member
                    ? "They haven't used the stove in this period."
                    : "Nobody has used the stove in this period."
              }
              today={today}
            />
          </>
        )}
      </div>
    </div>
  );
}

function PeriodPicker({
  period,
  onPeriodChange,
  custom,
  onCustomChange,
  cylinderEnd,
  onCylinderEndChange,
  currentUserEmail,
  today,
}: {
  period: PeriodId;
  onPeriodChange: (period: PeriodId) => void;
  custom: CustomRange;
  onCustomChange: (custom: CustomRange) => void;
  cylinderEnd: string | null;
  onCylinderEndChange: (end: string | null) => void;
  currentUserEmail: string;
  today: Date;
}) {
  const todayValue = toDateInput(today);
  return (
    <div className="space-y-3">
      <div role="group" aria-label="Time period" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {PERIODS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={period === id}
            onClick={() => onPeriodChange(id)}
            className={cx(
              "h-9 shrink-0 rounded-full px-4 text-sm font-medium ring-1 ring-inset transition-colors",
              period === id
                ? "bg-brand/15 text-brand ring-brand/40"
                : "text-ink-muted ring-line hover:text-ink hover:ring-line-strong"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {period === "cylinder" && (
        <CylinderFields
          end={cylinderEnd}
          onEndChange={onCylinderEndChange}
          currentUserEmail={currentUserEmail}
          today={today}
        />
      )}
      {period === "custom" && (
        <div className="grid animate-enter grid-cols-2 gap-3">
          <DateField
            label="From"
            value={custom.from}
            max={custom.to || todayValue}
            onChange={(from) => onCustomChange({ ...custom, from })}
          />
          <DateField
            label="To"
            value={custom.to}
            min={custom.from}
            max={todayValue}
            onChange={(to) => onCustomChange({ ...custom, to })}
          />
        </div>
      )}
    </div>
  );
}

/**
 * The cylinder period's fields: the day the current cylinder was connected,
 * which only some accounts can change, and the day to count up to, which
 * anyone can move to check usage up to then.
 */
function CylinderFields({
  end,
  onEndChange,
  currentUserEmail,
  today,
}: {
  /** Null means today. */
  end: string | null;
  onEndChange: (end: string | null) => void;
  currentUserEmail: string;
  today: Date;
}) {
  const cylinder = useCylinder();
  const showToast = useToast();
  // A new change date the editor hasn't saved yet.
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!cylinder.data) {
    return cylinder.error ? (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface py-2 pl-4 pr-2">
        <p className="text-sm text-ink-muted">Couldn&apos;t load the cylinder date.</p>
        <button
          type="button"
          onClick={() => cylinder.mutate()}
          className="flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-semibold text-brand transition-colors hover:bg-white/5"
        >
          <RefreshIcon size={16} /> Try again
        </button>
      </div>
    ) : (
      <div aria-hidden="true" className="grid grid-cols-2 gap-3">
        {[0, 1].map((field) => (
          <div key={field}>
            <div className="mb-1.5 h-4 w-20 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="h-11 animate-pulse rounded-xl bg-white/[0.06]" />
          </div>
        ))}
      </div>
    );
  }

  const { changedOn, setBy, canEdit } = cylinder.data;
  const todayValue = toDateInput(today);
  const first = changedOn ? parseDateInput(changedOn) : undefined;
  const unsaved = draft !== null && draft !== (changedOn ?? "");

  let hint = "";
  if (first) {
    const last = (end && parseDateInput(end)) || today;
    // Calendar days in the period, counting both ends.
    const days = Math.round((Math.max(last.getTime(), first.getTime()) - first.getTime()) / 86_400_000) + 1;
    hint = plural(days, "day");
    if (setBy) hint += ` · set by ${setBy.email === currentUserEmail ? "you" : firstName(setBy.name)}`;
  }

  async function save() {
    setSaving(true);
    try {
      const saved = await apiFetch<CylinderResponse>(CYLINDER_URL, {
        method: "PUT",
        body: JSON.stringify({ changedOn: draft }),
      });
      await cylinder.mutate(saved, { revalidate: false });
      setDraft(null);
      showToast("success", "Cylinder change date saved.");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-enter space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {canEdit ? (
          <DateField label="Cylinder changed" value={draft ?? changedOn ?? ""} max={todayValue} onChange={setDraft} />
        ) : (
          <ReadOnlyField label="Cylinder changed" value={first ? formatDay(first, today) : "Not set yet"} />
        )}
        <DateField
          label="Up to"
          value={end ?? todayValue}
          min={changedOn ?? undefined}
          max={todayValue}
          disabled={!changedOn}
          onChange={(value) => onEndChange(value === todayValue ? null : value)}
        />
      </div>
      {unsaved ? (
        <div className="flex animate-enter items-center gap-2 rounded-2xl border border-brand/25 bg-brand/[0.07] py-2 pl-4 pr-2">
          <p className="min-w-0 flex-1 text-sm text-ink">Save for everyone?</p>
          <button
            type="button"
            onClick={() => setDraft(null)}
            disabled={saving}
            className="h-9 shrink-0 rounded-full px-3 text-sm font-semibold text-ink-muted transition-colors enabled:hover:bg-white/5 enabled:hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!draft || saving}
            aria-busy={saving}
            className="grid h-9 min-w-18 shrink-0 place-items-center rounded-full bg-brand px-4 text-sm font-semibold text-canvas transition-colors enabled:hover:bg-brand-strong disabled:opacity-50"
          >
            {saving ? <Spinner /> : "Save"}
          </button>
        </div>
      ) : (
        hint && <p className="text-xs text-ink-subtle">{hint}</p>
      )}
    </div>
  );
}

function DateField({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-muted">{label}</span>
      {/* 16px text stops iOS from zooming the page when the field is focused. */}
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-line bg-surface px-3 text-base text-ink outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/25 disabled:opacity-50 [&::-webkit-date-and-time-value]:text-left"
      />
    </label>
  );
}

/** Shaped like a field, for a value the viewer can see but not change. */
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-ink-muted">{label}</span>
      <p className="flex h-11 items-center justify-between gap-2 rounded-xl border border-line px-3 text-base text-ink">
        <span className="truncate">{value}</span>
        <LockIcon size={16} className="shrink-0 text-ink-subtle" />
      </p>
    </div>
  );
}

function CylinderNotSet({ canEdit }: { canEdit: boolean }) {
  return (
    <section className="flex flex-col items-center rounded-3xl border border-line bg-surface px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-white/5 text-ink-subtle">
        <CylinderIcon size={22} />
      </span>
      <h2 className="mt-3 text-sm font-semibold text-ink">No cylinder change date yet</h2>
      <p className="mt-1 max-w-64 text-sm text-ink-muted">
        {canEdit
          ? "Set the day the current cylinder was connected to see its usage."
          : "Usage for the current cylinder will show up here once its change date is set."}
      </p>
    </section>
  );
}

function CardHeader({ title, rangeLabel }: { title: string; rangeLabel: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-medium text-ink-muted">{title}</h2>
      <p className="truncate text-xs text-ink-subtle">{rangeLabel}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-subtle">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-ink">{value}</dd>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mt-3 h-9 w-32 animate-pulse rounded-xl bg-white/[0.06]" />
      <div className="mt-5 h-4 w-48 animate-pulse rounded-full bg-white/[0.06]" />
    </div>
  );
}

function MySummary({ data, rangeLabel, stale }: { data?: MySessionsResponse; rangeLabel: string; stale: boolean }) {
  const summary = data?.summary;
  return (
    <section aria-busy={!summary || stale} className="rounded-3xl border border-line bg-surface p-5">
      <CardHeader title="Your usage" rangeLabel={rangeLabel} />
      {summary ? (
        <div className={cx("transition-opacity duration-200", stale && "opacity-50")}>
          <p className="mt-1.5 text-4xl font-semibold tracking-tight text-ink">{formatDuration(summary.totalSeconds)}</p>
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
            <Stat label="Sessions" value={String(summary.count)} />
            <Stat
              label="Average session"
              value={summary.count ? formatDuration(summary.totalSeconds / summary.count) : "–"}
            />
          </dl>
        </div>
      ) : (
        <SummarySkeleton />
      )}
    </section>
  );
}

function HouseholdSummary({
  data,
  rangeLabel,
  stale,
  currentUserEmail,
  selected,
  onSelect,
}: {
  data?: HouseholdResponse;
  rangeLabel: string;
  stale: boolean;
  currentUserEmail: string;
  selected: string | null;
  onSelect: (email: string) => void;
}) {
  const summary = data?.summary;
  return (
    <section aria-busy={!summary || stale} className="rounded-3xl border border-line bg-surface p-5">
      <CardHeader title="Household" rangeLabel={rangeLabel} />
      {data && summary ? (
        <div className={cx("transition-opacity duration-200", stale && "opacity-50")}>
          <p className="mt-1.5 text-4xl font-semibold tracking-tight text-ink">{formatDuration(summary.totalSeconds)}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {plural(data.members.length, "person", "people")} · {plural(summary.count, "session")}
          </p>
          {data.members.length > 0 && (
            <>
              <ol className="-mx-2 mt-4 space-y-1">
                {data.members.map((person, index) => (
                  <MemberRow
                    key={person.userEmail}
                    rank={index + 1}
                    person={person}
                    share={summary.totalSeconds ? person.totalSeconds / summary.totalSeconds : 0}
                    isMe={person.userEmail === currentUserEmail}
                    selected={selected === person.userEmail}
                    onSelect={() => onSelect(person.userEmail)}
                  />
                ))}
              </ol>
              <p className="mt-3 text-xs text-ink-subtle">Tap a person to see only their sessions.</p>
            </>
          )}
        </div>
      ) : (
        <SummarySkeleton />
      )}
    </section>
  );
}

function MemberRow({
  rank,
  person,
  share,
  isMe,
  selected,
  onSelect,
}: {
  rank: number;
  person: MemberSummary;
  share: number;
  isMe: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={cx(
          "w-full rounded-2xl px-2 py-2.5 text-left transition-colors",
          selected ? "bg-brand/10 ring-1 ring-inset ring-brand/30" : "hover:bg-white/[0.03]"
        )}
      >
        <span className="flex items-center gap-3">
          <span className="w-5 shrink-0 text-center text-sm font-medium text-ink-subtle">{rank}</span>
          <Avatar src={person.userImage} name={person.userName} size={36} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">
              {person.userName}
              {isMe && <span className="font-normal text-ink-subtle"> (you)</span>}
            </span>
            <span className="block text-xs text-ink-subtle">{plural(person.count, "session")}</span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-sm font-semibold text-ink">{formatDuration(person.totalSeconds)}</span>
            <span className="block text-xs text-ink-subtle">{formatPercent(share)} of total</span>
          </span>
        </span>
        {/* Share-of-total meter; the same values are written out above. */}
        <span aria-hidden="true" className="ml-8 mt-2.5 block h-1.5 overflow-hidden rounded-full bg-brand/15">
          <span className="block h-full rounded-full bg-brand" style={{ width: `${share * 100}%` }} />
        </span>
      </button>
    </li>
  );
}
