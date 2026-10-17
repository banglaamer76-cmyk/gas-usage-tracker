"use client";

import { useSession } from "next-auth/react";
import { Suspense, useEffect } from "react";
import useSWR from "swr";
import { Dashboard } from "./components/dashboard/dashboard";
import { OfflineScreen, SplashScreen } from "./components/screens";
import { SignInScreen } from "./components/sign-in-screen";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") return <SplashScreen />;

  const email = session?.user?.email;
  if (!email) return <SignedOut />;

  return <Dashboard user={{ ...session.user, email }} />;
}

/**
 * NextAuth also reports "unauthenticated" when it simply couldn't reach the server
 * (offline, flaky network, server down). Check before asking someone who is already
 * signed in to sign in again, which matters most when the installed app is opened offline.
 */
function SignedOut() {
  const { data, error } = useSWR<{ user?: unknown }>("/api/auth/session");
  const signedIn = !!data?.user;

  useEffect(() => {
    // The server was only briefly unreachable and the session is fine: start over.
    if (signedIn) window.location.reload();
  }, [signedIn]);

  if (error && !data) return <OfflineScreen />;
  if (!data || signedIn) return <SplashScreen />;
  return (
    <Suspense fallback={<SplashScreen />}>
      <SignInScreen />
    </Suspense>
  );
}
