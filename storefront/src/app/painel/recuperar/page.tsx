import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/painel/AuthShell";
import { apiRequest } from "@/lib/api";

export const metadata: Metadata = { title: "Ativar senha temporária", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Opened from the "forgot password" e-mail: activates the temporary password it carries. */
export default async function ResetConfirmPage({ searchParams }: { searchParams: Promise<{ email?: string; code?: string; tempPassword?: string }> }) {
  const { email, code, tempPassword } = await searchParams;
  let ok = false;
  if (email && code && tempPassword) {
    const qs = new URLSearchParams({ email, code, tempPassword });
    try {
      await apiRequest(`api/Security/ForgotPasswordConfirmation?${qs}`);
      ok = true;
    } catch (error) {
      console.error("[painel] reset confirmation", error);
    }
  }

  return ok ? (
    <AuthShell subtitle="Pronto, a senha temporária foi ativada.">
      <p className="mb-4 text-sm leading-relaxed">
        Entre com o seu e-mail e a <strong>senha temporária</strong> que chegou na mensagem. Depois, vá em <strong>Meu perfil</strong> (no rodapé do menu) e troque por uma senha sua.
      </p>
      <Link href="/painel/login" className="btn-primary !min-h-12 w-full">Ir para o login</Link>
    </AuthShell>
  ) : (
    <AuthShell subtitle="Não deu para ativar a senha temporária.">
      <p className="mb-4 text-sm leading-relaxed">O link pode ter expirado ou já ter sido usado. Peça uma nova senha temporária.</p>
      <Link href="/painel/esqueci" className="btn-primary !min-h-12 w-full">Pedir nova senha</Link>
    </AuthShell>
  );
}
