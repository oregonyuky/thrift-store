import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/painel/AuthShell";
import { LoginForm } from "@/components/painel/LoginForm";
import { getSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getSession()) redirect("/painel");
  return (
    <AuthShell subtitle="Entre com sua conta da equipe.">
      <LoginForm />
      <Link href="/painel/esqueci" className="mt-4 block text-center text-sm font-medium text-muted hover:text-terra">
        Esqueci minha senha
      </Link>
    </AuthShell>
  );
}
