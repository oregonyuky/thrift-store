import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getSession()) redirect("/");
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 py-12">
      <div className="w-full max-w-[400px] rounded-[20px] bg-card p-8">
        <div className="mb-6 flex flex-col gap-1">
          <span className="flex items-baseline gap-2">
            <span className="font-display text-[34px] italic">Thrift</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-terra">admin</span>
          </span>
          <p className="text-sm text-muted">Entre com sua conta da equipe.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
