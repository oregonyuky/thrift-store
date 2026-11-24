import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookieOptions, SESSION_COOKIE, seal, unseal, type AdminSession } from "./seal";

export type { AdminSession };

export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const session = unseal<AdminSession>(store.get(SESSION_COOKIE)?.value);
  if (!session?.token) return null;
  if (session.exp && session.exp * 1000 <= Date.now()) return null;
  return session;
}

/** For pages and actions: the signed-in staff member, or a redirect to the login page. */
export async function requireSession(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function setSession(session: AdminSession) {
  const store = await cookies();
  store.set(SESSION_COOKIE, seal(session), cookieOptions);
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
