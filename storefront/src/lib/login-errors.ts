import "server-only";
import { ApiError } from "./api";

/**
 * Turns a failed sign-in into a message that says what actually went wrong,
 * and logs the cause (never the password) so it shows up in the Render logs.
 */
export function loginFailure(error: unknown, area: "loja" | "painel"): string {
  const where = area === "painel" ? "[painel/login]" : "[loja/entrar]";

  if (!(error instanceof ApiError)) {
    console.error(where, "erro no servidor do site:", error);
    const text = error instanceof Error ? error.message : String(error);
    if (text.includes("SESSION_SECRET")) {
      return "O site está sem a variável SESSION_SECRET (32+ caracteres) no Render. Configure-a e faça um novo deploy.";
    }
    return "Erro no servidor do site ao entrar. Veja os logs do serviço no Render.";
  }

  console.error(where, `a API respondeu ${error.status}:`, error.message, error.detail ?? "");
  if (error.detail) {
    // The request never reached the API (wrong URL, API down, DNS...).
    return `O site não conseguiu falar com a API (${error.detail}). Confira a variável ThriftStoreApi__BaseUrl no Render e se o serviço da API está no ar.`;
  }
  if (error.status === 503 || error.status === 502 || error.status === 504) {
    return `A API respondeu erro ${error.status} (fora do ar ou reiniciando). Confira o serviço thrift-store-admin no Render.`;
  }
  if (error.status === 404) {
    return "Endereço da API incorreto: confira a variável ThriftStoreApi__BaseUrl no Render.";
  }
  if (area === "painel" && error.status === 500) {
    // The API answers wrong credentials (and blocked users) with a generic 500.
    return "E-mail ou senha inválidos, ou usuário bloqueado. Conta de cliente? Entre pela loja.";
  }
  return error.message || "Não foi possível entrar. Tente novamente.";
}
