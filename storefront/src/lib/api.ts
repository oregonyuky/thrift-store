import "server-only";
import { apiBaseUrl } from "./api-base";

/**
 * Server-side client for the ThriftStore .NET API (admin/).
 * Tokens never reach the browser: pages and server actions call the API from here.
 */

export class ApiError extends Error {
  constructor(message: string, public status: number, public detail?: string) {
    super(message);
    this.name = "ApiError";
  }
}

export { apiBaseUrl };

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pick(obj: Json, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in obj) return obj[key];
  }
  return undefined;
}

/** The API answers {content:{data}}, {content}, {data} or the bare value. */
export function unwrap<T>(body: unknown): T {
  let current = body;
  if (isObject(current)) {
    const content = pick(current, "content", "Content");
    if (content !== undefined && content !== null) current = content;
  }
  if (isObject(current)) {
    const data = pick(current, "data", "Data");
    if (data !== undefined && data !== null) current = data;
  }
  return current as T;
}

export function findMessage(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const parts = value.map(findMessage).filter(Boolean);
    return parts.length ? parts.join(" ") : undefined;
  }
  if (isObject(value)) {
    for (const key of ["message", "Message", "detail", "Detail", "title", "Title"]) {
      if (typeof value[key] === "string" && value[key]) return value[key] as string;
    }
    for (const key of ["error", "Error", "errors", "Errors", "content", "Content"]) {
      if (key in value) {
        const nested = findMessage(value[key]);
        if (nested) return nested;
      }
    }
  }
  return undefined;
}

/** "ECONNREFUSED", "ENOTFOUND", "tempo esgotado"... from a failed fetch. */
export function networkDetail(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") return "tempo esgotado (65 s)";
    const cause = (error as Error & { cause?: { code?: string; message?: string } }).cause;
    return cause?.code || cause?.message || error.message;
  }
  return String(error);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
  /** Return 404 as null instead of throwing. */
  allowNotFound?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, allowNotFound } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(new URL(path, apiBaseUrl()), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(65000),
    });
  } catch (error) {
    throw new ApiError(
      "Não foi possível falar com o servidor da loja. Tente novamente em instantes.",
      503,
      `${networkDetail(error)} ao chamar ${new URL(path, apiBaseUrl()).origin}`,
    );
  }

  const text = await response.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    if (allowNotFound && response.status === 404) return null as T;
    const message =
      findMessage(parsed) ||
      (typeof parsed === "string" && parsed.length < 300 ? parsed : undefined) ||
      `A API retornou erro ${response.status}.`;
    throw new ApiError(message, response.status);
  }

  return unwrap<T>(parsed);
}

/** Multipart upload (FileImage/UploadImage). */
export async function apiUpload<T>(path: string, form: FormData, token: string): Promise<T> {
  const response = await fetch(new URL(path, apiBaseUrl()), {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    body: form,
    cache: "no-store",
    signal: AbortSignal.timeout(60000),
  }).catch(() => {
    throw new ApiError("Não foi possível enviar a imagem. Tente novamente.", 503);
  });
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    /* plain text */
  }
  if (!response.ok) {
    throw new ApiError(findMessage(parsed) || (typeof parsed === "string" && parsed) || `Erro ${response.status} ao enviar a imagem.`, response.status);
  }
  return unwrap<T>(parsed);
}

/** Raw response for binary downloads (shipping label PDF). */
export async function apiBinary(path: string, token: string): Promise<Response> {
  const response = await fetch(new URL(path, apiBaseUrl()), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* plain text */
    }
    throw new ApiError(findMessage(parsed) || `Erro ${response.status} ao baixar o arquivo.`, response.status);
  }
  return response;
}

/** Same rule as the Razor store: a bare file name is served by FileImage/GetImage. */
export function resolveImageUrl(value?: string | null): string | null {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const normalized = trimmed.replace(/\\/g, "/");
  const name = normalized.split("/").pop() ?? "";
  if (name && /\.[a-z0-9]+$/i.test(name)) {
    return new URL(`api/FileImage/GetImage?imageName=${encodeURIComponent(name)}`, apiBaseUrl()).toString();
  }
  return new URL(normalized.replace(/^\/+/, ""), apiBaseUrl()).toString();
}
