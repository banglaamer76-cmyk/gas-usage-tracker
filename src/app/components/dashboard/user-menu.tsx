"use client";

import { signOut } from "next-auth/react";
import { useEffect, useId, useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode } from "react";
import { Avatar } from "@/app/components/avatar";
import { DownloadIcon, LogOutIcon } from "@/app/components/icons";
import { InstallHelpDialog } from "@/app/components/install";
import { useInstallPrompt } from "@/app/hooks/use-install-prompt";
import { cx } from "@/app/lib/cx";
import type { SessionUser } from "@/app/lib/types";

function MenuItem({
  icon: Icon,
  onSelect,
  children,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-ink outline-none transition-colors hover:bg-white/5 focus-visible:bg-white/5"
    >
      <Icon size={18} className="text-ink-muted" />
      {children}
    </button>
  );
}

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const { canPrompt, needsManualInstall, install } = useInstallPrompt();

  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        // Close when keyboard focus leaves the menu.
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Account: ${user.name ?? user.email}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cx(
          "grid size-10 place-items-center rounded-full ring-1 transition",
          open ? "ring-brand/60" : "ring-line hover:ring-line-strong"
        )}
      >
        <Avatar src={user.image} name={user.name} size={32} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-12 z-40 w-64 origin-top-right animate-pop rounded-2xl border border-line-strong bg-surface-raised p-1.5 shadow-2xl shadow-black/60"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar src={user.image} name={user.name} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.name ?? "Signed in"}</p>
              <p className="truncate text-xs text-ink-subtle">{user.email}</p>
            </div>
          </div>
          <div role="separator" className="mx-2 my-1 h-px bg-line" />
          {(canPrompt || needsManualInstall) && (
            <MenuItem
              icon={DownloadIcon}
              onSelect={() => {
                setOpen(false);
                if (canPrompt) install();
                else setInstallHelpOpen(true);
              }}
            >
              Install app
            </MenuItem>
          )}
          <MenuItem icon={LogOutIcon} onSelect={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </MenuItem>
        </div>
      )}

      <InstallHelpDialog open={installHelpOpen} onClose={() => setInstallHelpOpen(false)} />
    </div>
  );
}
