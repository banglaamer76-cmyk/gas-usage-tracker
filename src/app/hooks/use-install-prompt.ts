import { useCallback, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  // Listen as soon as this module loads, so an early event isn't missed.
  window.addEventListener("beforeinstallprompt", (event) => {
    // Keep the browser's own banner from appearing; the app shows an Install button instead.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

function subscribePrompt(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribeDisplayMode(onChange: () => void) {
  const query = window.matchMedia(STANDALONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isStandalone = () =>
  window.matchMedia(STANDALONE_QUERY).matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPadOS reports itself as a Mac, so also check for a touch screen.
const isIOS = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);

const subscribeNever = () => () => {};

export function useInstallPrompt() {
  const prompt = useSyncExternalStore(subscribePrompt, () => deferredPrompt, () => null);
  const installed = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => false);
  const ios = useSyncExternalStore(subscribeNever, isIOS, () => false);

  /** Shows the browser's install dialog. Resolves to true if the user installed. */
  const install = useCallback(async () => {
    const event = deferredPrompt;
    if (!event) return false;
    // Each prompt event can only be used once.
    deferredPrompt = null;
    notify();
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome === "accepted";
  }, []);

  return {
    /** Running as an installed app. */
    installed,
    /** The browser supports one-tap install (Chrome, Edge, Samsung Internet, …). */
    canPrompt: !installed && prompt !== null,
    /** iOS has no install prompt: users add the app via Share › Add to Home Screen. */
    needsManualInstall: !installed && prompt === null && ios,
    install,
  };
}
