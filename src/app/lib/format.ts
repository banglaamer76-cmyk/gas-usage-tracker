const pad = (n: number) => String(n).padStart(2, "0");

const toParts = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
};

/** Stopwatch display: 75 → "01:15", 3725 → "1:02:05". */
export function formatClock(totalSeconds: number) {
  const { h, m, s } = toParts(totalSeconds);
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Compact duration: 45 → "45s", 330 → "5m 30s", 3725 → "1h 2m". */
export function formatDuration(totalSeconds: number) {
  const { h, m, s } = toParts(totalSeconds);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

/** Spoken duration for screen readers: 3725 → "1 hour 2 minutes". */
export function formatDurationLong(totalSeconds: number) {
  const { h, m, s } = toParts(totalSeconds);
  const parts = [
    h && `${h} ${h === 1 ? "hour" : "hours"}`,
    m && `${m} ${m === 1 ? "minute" : "minutes"}`,
    !h && (s || !m) && `${s} ${s === 1 ? "second" : "seconds"}`,
  ];
  return parts.filter(Boolean).join(" ");
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });
const dayWithYearFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const percentFormat = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 0 });

export const formatTime = (date: Date | string) => timeFormat.format(new Date(date));

export const formatPercent = (fraction: number) => percentFormat.format(fraction);

/** "Today", "Yesterday", "Mon, 13 Oct" or, for other years, "13 Oct 2025". */
export function formatDay(date: Date, today: Date) {
  const days = Math.round((startOfDay(today).getTime() - startOfDay(date).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.getFullYear() === today.getFullYear()
    ? dayFormat.format(date)
    : dayWithYearFormat.format(date);
}

export function startOfDay(date: Date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}
