import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Entrar" };

function safe(url?: string) {
  return url && url.startsWith("/") && !url.startsWith("//") ? url : "/";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnUrl?: string; ReturnUrl?: string; cadastro?: string }> }) {
  const params = await searchParams;
  const returnUrl = safe(params.returnUrl ?? params.ReturnUrl);
  if (await getSession()) redirect(returnUrl);
  return (
    <div className="mx-auto flex max-w-md flex-col gap-7 px-5 pb-24 pt-14">
      <div className="flex flex-col gap-2 text-center">
        <span className="eyebrow">Minha conta</span>
        <h1 className="font-display text-[40px] font-normal tracking-tight">Que bom te ver</h1>
        <p className="text-[15px] text-muted">Entre para pagar no Pix e acompanhar sua sacolinha.</p>
      </div>
      <div className="rounded-[18px] border border-line bg-card p-6">
        <LoginForm returnUrl={returnUrl} notice={params.cadastro ? "Conta criada! Agora é só entrar." : undefined} />
      </div>
    </div>
  );
}
