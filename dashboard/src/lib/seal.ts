import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "thrift_admin";

export interface AdminSession {
  token: string;
  refreshToken?: string;
  userId: string;
  email: string;
  name: string;
  roles: string[];
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

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

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
    const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { exp?: number };
    return typeof claims.exp === "number" ? claims.exp : undefined;
  } catch {
    return undefined;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

interface TokenPayload {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

export function sessionFromTokens(data: TokenPayload, fallbackEmail = ""): AdminSession | null {
  if (!data.accessToken || !data.userId) return null;
  return {
    token: data.accessToken,
    refreshToken: data.refreshToken,
    userId: data.userId,
    email: data.email || fallbackEmail,
    name: [data.firstName, data.lastName].filter(Boolean).join(" ") || data.email || fallbackEmail,
    roles: data.roles ?? [],
    exp: jwtExpiry(data.accessToken),
  };
}
