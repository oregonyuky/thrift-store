import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/painel/AuthShell";
import { ForgotForm } from "@/components/painel/ForgotForm";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell subtitle="Enviamos uma senha temporária para o seu e-mail. Depois de entrar, troque por uma nova em Meu perfil.">
      <ForgotForm />
      <Link href="/painel/login" className="mt-4 block text-center text-sm font-medium text-muted hover:text-terra">
        Voltar para o login
      </Link>
    </AuthShell>
  );
}
