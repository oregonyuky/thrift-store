import { apiBaseUrl } from "@/lib/api-base";
import { networkDetail } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Always 200 for Render's health check; the extra fields help spot configuration problems. */
export async function GET(request: Request) {
  const secret = process.env.SESSION_SECRET ?? "";
  const body: Record<string, string | number> = {
    status: "ok",
    sessionSecret: secret.length >= 32 ? "ok" : "faltando",
    apiUrl: apiBaseUrl(),
    apiUrlVariavel: process.env.THRIFT_API_URL
      ? "THRIFT_API_URL"
      : process.env.ThriftStoreApi__BaseUrl
        ? "ThriftStoreApi__BaseUrl"
        : process.env.AlieBrechoApi__BaseUrl
          ? "AlieBrechoApi__BaseUrl"
          : "nenhuma (usando localhost)",
  };
  // ?api=1 also checks that the API answers (kept out of Render's health check).
  if (new URL(request.url).searchParams.get("api")) {
    try {
      const started = Date.now();
      const response = await fetch(new URL("api/Category/GetCategoryList", apiBaseUrl()), { cache: "no-store", signal: AbortSignal.timeout(10000) });
      body.api = `HTTP ${response.status} em ${Date.now() - started} ms`;
    } catch (error) {
      body.api = `sem resposta: ${networkDetail(error)}`;
    }
  }
  return Response.json(body);
}
