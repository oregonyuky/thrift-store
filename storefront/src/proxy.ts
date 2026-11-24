import { NextResponse, type NextRequest } from "next/server";
import { apiBaseUrl } from "./lib/api-base";
import { cookieOptions, SESSION_COOKIE, seal, sessionFromTokens, unseal, type AdminSession } from "./lib/painel/seal";

// Old Razor Pages addresses keep working (links shared on Instagram, e-mails, bookmarks).
const legacy: Record<string, string> = {
  "/Index": "/",
  "/Cart": "/carrinho",
  "/Cart/Index": "/carrinho",
  "/Checkout": "/checkout",
  "/Checkout/Index": "/checkout",
  "/Checkout/Success": "/minhas-compras",
  "/Account": "/conta",
  "/Account/Index": "/conta",
  "/Account/Login": "/entrar",
  "/Account/Register": "/cadastro",
  "/Orders": "/minhas-compras",
  "/Orders/Index": "/minhas-compras",
  "/Ajuda/DuvidasFrequentes": "/ajuda",
  "/Ajuda/FaleConosco": "/fale-conosco",
  "/Obrigado": "/obrigado",
  "/Payment/Pix": "/minhas-compras",
};

function legacyRedirect(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const url = request.nextUrl.clone();
  if (pathname === "/Products/Details" || pathname.startsWith("/Products/Details/")) {
    const id = searchParams.get("id") ?? pathname.split("/")[3];
    url.pathname = id ? `/produto/${encodeURIComponent(id)}` : "/";
    url.search = "";
    return NextResponse.redirect(url, 308);
  }
  const target = legacy[pathname];
  if (!target) return null;
  url.pathname = target;
  const returnUrl = searchParams.get("ReturnUrl");
  if (returnUrl) {
    url.searchParams.delete("ReturnUrl");
    url.searchParams.set("returnUrl", returnUrl);
  }
  return NextResponse.redirect(url, 308);
}

/**
 * Staff access tokens last ~30 minutes. Before each /painel request, swap an expiring
 * token for a fresh one with the refresh token, so staff are not logged out mid-task.
 */
async function refreshStaffToken(request: NextRequest) {
  const session = unseal<AdminSession>(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session?.refreshToken || !session.exp) return NextResponse.next();
  if (session.exp * 1000 - Date.now() > 2 * 60 * 1000) return NextResponse.next();
  try {
    const response = await fetch(new URL("api/Security/RefreshToken", apiBaseUrl()), {
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

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/painel")) return refreshStaffToken(request);
  return legacyRedirect(request) ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/painel/:path*",
    "/(Index|Cart|Checkout|Account|Orders|Ajuda|Obrigado|Payment|Products)/:path*",
    "/(Index|Cart|Checkout|Account|Orders|Obrigado)",
  ],
};
