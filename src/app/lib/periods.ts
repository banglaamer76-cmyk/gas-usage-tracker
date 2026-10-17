import { addDays, startOfDay } from "./format";

export type PeriodId = "cylinder" | "today" | "week" | "month" | "lastMonth" | "all" | "custom";

export const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "cylinder", label: "This cylinder" },
  { id: "today", label: "Today" },
  { id: "week", label: "7 days" },
  { id: "month", label: "This month" },
  { id: "lastMonth", label: "Last month" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom" },
];

/** Raw "YYYY-MM-DD" values from a pair of date fields. */
export interface CustomRange {
  from: string;
  to: string;
}

/** A span of time in the viewer's timezone. `to` is exclusive; missing bounds are open. */
export interface DateRange {
  from?: Date;
  to?: Date;
}

/** Local midnight for a date input value. (`new Date("2026-10-16")` would be UTC midnight.) */
export function parseDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function toDateInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The span a period covers. `cylinder` holds the day the current cylinder was
 * connected and the day to count up to (empty for today). Returns null while
 * that change date isn't known.
 */
export function getPeriodRange(
  period: PeriodId,
  today: Date,
  custom: CustomRange,
  cylinder: CustomRange
): DateRange | null {
  const year = today.getFullYear();
  const month = today.getMonth();
  switch (period) {
    case "cylinder": {
      const first = parseDateInput(cylinder.from);
      if (!first) return null;
      const last = parseDateInput(cylinder.to);
      // An end day before the change date (say, after the date was moved) counts just that day.
      return { from: first, to: last && addDays(last < first ? first : last, 1) };
    }
    case "today":
      return { from: startOfDay(today) };
    case "week":
      return { from: addDays(startOfDay(today), -6) };
    case "month":
      return { from: new Date(year, month, 1) };
    case "lastMonth":
      return { from: new Date(year, month - 1, 1), to: new Date(year, month, 1) };
    case "all":
      return {};
    case "custom": {
      let first = parseDateInput(custom.from);
      let last = parseDateInput(custom.to);
      if (first && last && first > last) [first, last] = [last, first];
      return { from: first, to: last && addDays(last, 1) };
    }
  }
}

const monthFormat = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
const spanFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });

/** Human label for a range, e.g. "October 2026" or "10 – 16 Oct 2026". */
export function describeRange(period: PeriodId, range: DateRange, today: Date) {
  if (period === "all") return "All time";
  if (period === "month" || period === "lastMonth") return monthFormat.format(range.from!);
  const first = range.from;
  const last = range.to ? addDays(range.to, -1) : today;
  if (!first) return `Up to ${spanFormat.format(last)}`;
  return spanFormat.formatRange(first, last);
}

/** Query string for the API: the range as absolute ISO instants. */
export function rangeSearch(range: DateRange) {
  const params = new URLSearchParams();
  if (range.from) params.set("from", range.from.toISOString());
  if (range.to) params.set("to", range.to.toISOString());
  const query = params.toString();
  return query ? `?${query}` : "";
}
