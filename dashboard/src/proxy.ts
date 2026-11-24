import { NextResponse, type NextRequest } from "next/server";
import { cookieOptions, SESSION_COOKIE, seal, sessionFromTokens, unseal, type AdminSession } from "./lib/seal";

/**
 * Access tokens from the API last ~30 minutes. Before each request, swap an expiring
 * token for a fresh one with the refresh token, so staff are not logged out mid-task.
 */
export async function proxy(request: NextRequest) {
  const session = unseal<AdminSession>(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session?.refreshToken || !session.exp) return NextResponse.next();
  if (session.exp * 1000 - Date.now() > 2 * 60 * 1000) return NextResponse.next();

  const base = process.env.THRIFT_API_URL || "http://localhost:5000/";
  try {
    const response = await fetch(new URL("api/Security/RefreshToken", base.endsWith("/") ? base : `${base}/`), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return NextResponse.next();
    const body = (await response.json()) as { content?: { data?: Record<string, unknown> }; data?: Record<string, unknown> };
    const data = (body.content?.data ?? body.data ?? {}) as Parameters<typeof sessionFromTokens>[0];
    const fresh = sessionFromTokens(data, session.email);
    if (!fresh) return NextResponse.next();
    const value = seal({ ...fresh, roles: fresh.roles.length ? fresh.roles : session.roles });

    // Hand the new cookie to this request's server code and to the browser.
    request.cookies.set(SESSION_COOKIE, value);
    const next = NextResponse.next({ request: { headers: request.headers } });
    next.cookies.set(SESSION_COOKIE, value, cookieOptions);
    return next;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|healthz).*)"],
};
