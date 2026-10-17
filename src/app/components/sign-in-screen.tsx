"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useOnline } from "@/app/hooks/use-online";
import { APP_NAME, APP_TAGLINE } from "@/app/lib/brand";
import { AppMark, Wordmark } from "./brand";
import { AlertIcon, GoogleIcon, PhoneIcon, PieIcon, Spinner, TimerIcon } from "./icons";

// Error codes NextAuth appends as ?error= when sign-in fails.
function errorMessage(code: string) {
  if (code === "AccessDenied") {
    return `This Google account doesn't have access to ${APP_NAME}. Ask whoever set it up to add your email.`;
  }
  if (code === "Configuration") return "Sign-in isn't set up correctly on the server.";
  return "Sign-in didn't finish. Please try again.";
}

function Feature({ icon: Icon, title, children }: { icon: ComponentType<{ size?: number }>; title: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon size={20} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-sm text-ink-muted">{children}</span>
      </span>
    </li>
  );
}

export function SignInScreen() {
  const error = useSearchParams().get("error");
  const online = useOnline();
  const [redirecting, setRedirecting] = useState(false);

  // Coming back from Google with the Back button restores this page from cache; re-enable the button.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => event.persisted && setRedirecting(false);
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] pt-[calc(env(safe-area-inset-top)+2.5rem)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[30%] size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-3xl"
      />

      <div className="relative flex w-full max-w-sm animate-enter flex-col items-center text-center">
        <AppMark size={88} className="drop-shadow-[0_14px_36px_rgba(234,88,12,0.45)]" />
        <h1 className="mt-6 text-[clamp(2.25rem,11vw,2.75rem)] leading-none">
          <Wordmark />
        </h1>
        <p className="mt-3 text-base text-ink-muted">{APP_TAGLINE}</p>

        {(error || !online) && (
          <p
            role="alert"
            className="mt-6 flex w-full items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-left text-sm text-ink"
          >
            <AlertIcon size={18} className="mt-px shrink-0 text-danger" />
            {online ? errorMessage(error!) : "You're offline. Connect to the internet to sign in."}
          </p>
        )}

        <button
          type="button"
          disabled={redirecting || !online}
          onClick={() => {
            setRedirecting(true);
            signIn("google", { callbackUrl: "/" });
          }}
          className="mt-8 flex h-13 w-full items-center justify-center gap-3 rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-[#1f1f1f] shadow-lg shadow-black/30 transition enabled:hover:bg-[#f2f2f2] enabled:active:scale-[0.98] disabled:opacity-60"
        >
          {redirecting ? <Spinner className="text-[#1f1f1f]" /> : <GoogleIcon />}
          {redirecting ? "Opening Google…" : "Continue with Google"}
        </button>

        <ul className="mt-12 w-full space-y-5 text-left">
          <Feature icon={TimerIcon} title="One-tap timer">
            Start it when the burner goes on, stop it when it&apos;s off.
          </Feature>
          <Feature icon={PieIcon} title="Fair shares">
            See everyone&apos;s share of the gas used, for any period.
          </Feature>
          <Feature icon={PhoneIcon} title="Works like an app">
            Install it on your phone&apos;s home screen for instant access.
          </Feature>
        </ul>
      </div>
    </main>
  );
}
