import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/AuthForms";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Criar conta" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnUrl?: string }> }) {
  const { returnUrl: raw } = await searchParams;
  const returnUrl = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  if (await getSession()) redirect(returnUrl);
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-7 px-5 pb-24 pt-14">
      <div className="flex flex-col gap-2 text-center">
        <span className="eyebrow">Criar conta</span>
        <h1 className="font-display text-[40px] font-normal tracking-tight">Bem-vinda à Thrift</h1>
        <p className="text-[15px] text-muted">Com a conta você paga no Pix, guarda peças na sacolinha e acompanha seus envios.</p>
      </div>
      <div className="rounded-[18px] border border-line bg-card p-6">
        <RegisterForm returnUrl={returnUrl} />
      </div>
    </div>
  );
}
