import { useSyncExternalStore } from "react";
import { addDays, startOfDay } from "@/app/lib/format";

function subscribe(onChange: () => void) {
  let timeout: ReturnType<typeof setTimeout>;
  const scheduleMidnight = () => {
    const msUntilMidnight = addDays(startOfDay(new Date()), 1).getTime() - Date.now();
    timeout = setTimeout(() => {
      onChange();
      scheduleMidnight();
    }, msUntilMidnight + 1000);
  };
  scheduleMidnight();
  // Timers are paused while a phone sleeps, so also re-check when the app returns.
  document.addEventListener("visibilitychange", onChange);
  return () => {
    clearTimeout(timeout);
    document.removeEventListener("visibilitychange", onChange);
  };
}

const getToday = () => startOfDay(new Date()).getTime();
const getServerToday = () => 0;

/**
 * Local midnight (ms) of the current day. Updates when the date rolls over,
 * including when an installed app is reopened the next morning.
 */
export function useTodayStart() {
  return useSyncExternalStore(subscribe, getToday, getServerToday);
}
