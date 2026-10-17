import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const emailList = (value: string | undefined) =>
  new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );

// Optional allow-list: set ALLOWED_EMAILS="a@gmail.com,b@gmail.com" to limit
// who can use the app. When unset, any Google account can sign in.
const allowedEmails = emailList(process.env.ALLOWED_EMAILS);

// Accounts that can change the cylinder change date; everyone else can only
// see it. Unlike ALLOWED_EMAILS, leaving this unset means nobody can change it.
const cylinderEditors = emailList(process.env.CYLINDER_EDITORS);

function isAllowed(email: string) {
  return allowedEmails.size === 0 || allowedEmails.has(email.toLowerCase());
}

export function canEditCylinder(email: string) {
  return cylinderEditors.has(email.toLowerCase());
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // The home page renders the sign-in screen and shows any ?error= code.
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    signIn({ user }) {
      return !!user.email && isAllowed(user.email);
    },
  },
};

export type CurrentUser = {
  email: string;
  name: string;
  image?: string;
};

/** The signed-in user making the current request, or null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email || !isAllowed(email)) return null;

  return {
    email,
    name: session.user?.name?.trim() || email.split("@")[0],
    image: session.user?.image ?? undefined,
  };
}
