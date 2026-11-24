import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "thrift_session";
const CART_COOKIE = "thrift_cart";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

export interface CustomerSession {
  token: string;
  refreshToken?: string;
  userId: string;
  email: string;
  name: string;
  /** Access token expiry, epoch seconds. */
  exp?: number;
}

let devSecret: string | undefined;

function secret(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set (32+ characters) in production.");
  }
  devSecret ??= randomBytes(32).toString("hex");
  return devSecret;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function seal(value: unknown): string {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function unseal<T>(sealed: string | undefined): T | null {
  if (!sealed) return null;
  const [payload, signature] = sealed.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function jwtExpiry(token: string): number | undefined {
  try {
    const part = token.split(".")[1];
    const claims = JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as { exp?: number };
    return typeof claims.exp === "number" ? claims.exp : undefined;
  } catch {
    return undefined;
  }
}

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function getSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  const session = unseal<CustomerSession>(store.get(SESSION_COOKIE)?.value);
  if (!session?.token) return null;
  if (session.exp && session.exp * 1000 <= Date.now()) return null;
  return session;
}

/** Only callable from server actions and route handlers. */
export async function setSession(session: CustomerSession, remember: boolean) {
  const store = await cookies();
  const maxAge = session.exp ? Math.max(60, session.exp - Math.floor(Date.now() / 1000)) : SEVEN_DAYS;
  // The cart picked before signing in is kept, so "Entrar para finalizar" leads straight to checkout.
  // Logging out clears it (clearSession), so the next person on a shared device starts empty.
  store.set(SESSION_COOKIE, seal(session), { ...baseCookie, maxAge: remember ? maxAge : undefined });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(CART_COOKIE);
}

export async function getCartIds(): Promise<string[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string" && id.length < 100).slice(0, 50) : [];
  } catch {
    return [];
  }
}

export async function saveCartIds(ids: string[]) {
  const store = await cookies();
  const unique = Array.from(new Set(ids)).slice(0, 50);
  if (unique.length === 0) store.delete(CART_COOKIE);
  else store.set(CART_COOKIE, JSON.stringify(unique), { ...baseCookie, maxAge: SEVEN_DAYS });
}
