import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import { dateTime, money } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getActiveBag } from "@/lib/store";

export const metadata: Metadata = { title: "Minha conta" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/entrar?returnUrl=/conta");
  const bag = await getActiveBag(session);

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-7 px-5 pb-24 pt-10 md:px-8">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Minha conta</span>
        <h1 className="font-display text-[40px] font-normal tracking-tight">Olá, {session.name.split(" ")[0]}</h1>
        <p className="text-[15px] text-muted">{session.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/minhas-compras" className="flex flex-col gap-1 rounded-[18px] border border-line bg-card p-6 hover:border-ink">
          <span className="text-lg font-bold">Minhas compras</span>
          <span className="text-sm text-muted">Pedidos, pagamentos e envios.</span>
        </Link>
        <Link href="/carrinho?aba=sacolinha" className="flex flex-col gap-1 rounded-[18px] border border-line bg-card p-6 hover:border-ink">
          <span className="text-lg font-bold">Minha sacolinha</span>
          <span className="text-sm text-muted">
            {bag
              ? `${bag.itemCount} ${bag.itemCount === 1 ? "peça" : "peças"} · ${money(bag.totalItemsValue)}${bag.expirationDate ? ` · fecha em ${dateTime(bag.expirationDate)}` : ""}`
              : "Nenhuma sacolinha aberta."}
          </span>
        </Link>
      </div>

      <form action={logout}>
        <button type="submit" className="btn-ghost">Sair da conta</button>
      </form>
    </div>
  );
}
