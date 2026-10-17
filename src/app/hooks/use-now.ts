import { useSyncExternalStore } from "react";

// One shared once-a-second clock for everything that shows a live time.
let now = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function tick() {
  now = Date.now();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(tick, 1000);
    // Catch up immediately when a backgrounded app comes back.
    document.addEventListener("visibilitychange", tick);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
      document.removeEventListener("visibilitychange", tick);
    }
  };
}

const subscribeNever = () => () => {};
const getNow = () => now;

/** The current time in ms, re-rendering every second while `live` is true. */
export function useNow(live = true) {
  return useSyncExternalStore(live ? subscribe : subscribeNever, getNow, getNow);
}
