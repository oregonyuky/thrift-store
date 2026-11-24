import { apiBaseUrl } from "@/lib/api-base";

export const dynamic = "force-dynamic";

/** Always 200 for Render's health check; the extra fields help spot configuration problems. */
export function GET() {
  const secret = process.env.SESSION_SECRET ?? "";
  let api = "";
  try {
    api = new URL(apiBaseUrl()).origin;
  } catch {
    api = "invalida";
  }
  return Response.json({ status: "ok", sessionSecret: secret.length >= 32 ? "ok" : "faltando", api });
}
