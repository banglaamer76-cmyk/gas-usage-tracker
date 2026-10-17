"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cx } from "@/app/lib/cx";
import { AlertIcon, CheckIcon, InfoIcon } from "./icons";

type Tone = "success" | "error" | "info";
type ShowToast = (tone: Tone, message: string) => void;

const ToastContext = createContext<ShowToast>(() => {});

export const useToast = () => useContext(ToastContext);

const TONES = {
  success: { Icon: CheckIcon, color: "text-live", duration: 3500 },
  info: { Icon: InfoIcon, color: "text-brand", duration: 4500 },
  error: { Icon: AlertIcon, color: "text-danger", duration: 6000 },
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; tone: Tone; message: string }[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback<ShowToast>(
    (tone, message) => {
      const id = ++nextId;
      setToasts((current) => [...current.slice(-2), { id, tone, message }]);
      setTimeout(() => dismiss(id), TONES[tone].duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      >
        {toasts.map(({ id, tone, message }) => {
          const { Icon, color } = TONES[tone];
          return (
            <button
              key={id}
              type="button"
              onClick={() => dismiss(id)}
              className="pointer-events-auto flex w-full max-w-sm animate-pop items-start gap-3 rounded-2xl border border-line-strong bg-surface-raised/95 px-4 py-3 text-left text-sm text-ink shadow-2xl shadow-black/50 backdrop-blur"
            >
              <Icon size={18} className={cx("mt-px shrink-0", color)} />
              <span className="min-w-0 flex-1">{message}</span>
              <span className="sr-only">Dismiss</span>
            </button>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
