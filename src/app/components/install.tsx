"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInstallPrompt } from "@/app/hooks/use-install-prompt";
import { APP_NAME } from "@/app/lib/brand";
import { AppMark } from "./brand";
import { PlusSquareIcon, ShareIcon, XIcon } from "./icons";

const DISMISSED_KEY = "gasmate:install-banner-dismissed";

/** Invites the user to install the app, unless it's installed or they said no. */
export function InstallBanner() {
  const { canPrompt, needsManualInstall, install } = useInstallPrompt();
  const [helpOpen, setHelpOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Storage unavailable (e.g. private mode): it just shows again next time.
    }
  }

  if (dismissed || (!canPrompt && !needsManualInstall)) return null;

  return (
    <div className="flex animate-enter items-center gap-3 rounded-2xl border border-brand/25 bg-brand/[0.07] py-3 pl-3 pr-2">
      <AppMark size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">Install {APP_NAME}</p>
        <p className="text-xs text-ink-muted">Open it from your home screen, like any app.</p>
      </div>
      <button
        type="button"
        onClick={() => (canPrompt ? install() : setHelpOpen(true))}
        className="h-9 shrink-0 rounded-full bg-brand px-4 text-sm font-semibold text-canvas transition-colors hover:bg-brand-strong"
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="grid size-9 shrink-0 place-items-center rounded-full text-ink-subtle transition-colors hover:bg-white/5 hover:text-ink"
      >
        <XIcon size={18} />
      </button>
      <InstallHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

function Step({ number, children }: { number: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">
        {number}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

const Key = ({ children }: { children: ReactNode }) => (
  <strong className="inline-flex items-center gap-1 font-semibold text-ink">{children}</strong>
);

/** Add to Home Screen instructions for iPhone and iPad, which have no install prompt. */
export function InstallHelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click on the dialog element itself is a click on the backdrop.
      onClick={(event) => event.target === event.currentTarget && onClose()}
      aria-labelledby="install-help-title"
      className="mx-auto mb-0 mt-auto w-full max-w-md rounded-t-3xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm sm:mb-auto sm:rounded-3xl"
    >
      <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6">
        <div className="flex items-center gap-3">
          <AppMark size={44} />
          <h2 id="install-help-title" className="font-display text-lg font-bold">
            Add {APP_NAME} to your Home Screen
          </h2>
        </div>
        <ol className="mt-5 space-y-4 text-sm text-ink-muted">
          <Step number={1}>
            In Safari, tap <Key><ShareIcon size={16} /> Share</Key>. If you don&apos;t see it, tap{" "}
            <Key>•••</Key> first.
          </Step>
          <Step number={2}>
            Scroll down and choose <Key><PlusSquareIcon size={16} /> Add to Home Screen</Key>.
          </Step>
          <Step number={3}>
            Tap <Key>Add</Key>. {APP_NAME} now opens full screen from your Home Screen.
          </Step>
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-12 w-full rounded-2xl bg-surface-raised text-sm font-semibold text-ink ring-1 ring-line-strong transition-colors hover:bg-line"
        >
          Got it
        </button>
      </div>
    </dialog>
  );
}
