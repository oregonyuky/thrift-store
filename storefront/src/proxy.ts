import { NextResponse, type NextRequest } from "next/server";

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

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const url = request.nextUrl.clone();

  if (pathname === "/Products/Details" || pathname.startsWith("/Products/Details/")) {
    const id = searchParams.get("id") ?? pathname.split("/")[3];
    url.pathname = id ? `/produto/${encodeURIComponent(id)}` : "/";
    url.search = "";
    return NextResponse.redirect(url, 308);
  }

  const target = legacy[pathname];
  if (target) {
    url.pathname = target;
    const returnUrl = searchParams.get("ReturnUrl");
    if (returnUrl) {
      url.searchParams.delete("ReturnUrl");
      url.searchParams.set("returnUrl", returnUrl);
    }
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  // Only capitalised paths can be legacy ones.
  matcher: ["/(Index|Cart|Checkout|Account|Orders|Ajuda|Obrigado|Payment|Products)/:path*", "/(Index|Cart|Checkout|Account|Orders|Obrigado)"],
};
