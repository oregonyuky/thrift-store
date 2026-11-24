import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/ProductCard";
import { money, statusInfo, toneClass } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getOrder } from "@/lib/store";

export const metadata: Metadata = { title: "Obrigada pela compra" };
export const dynamic = "force-dynamic";

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const { pedido } = await searchParams;
  const session = await getSession();
  const order = pedido ? await getOrder(pedido, session) : null;
  const info = statusInfo(order?.status);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-5 pb-24 pt-16 text-center">
      <span className="eyebrow">Compra confirmada</span>
      <h1 className="font-display text-[44px] font-normal leading-tight tracking-tight">Obrigada pela sua <em className="text-terra">compra</em>!</h1>
      <p className="text-[15px] leading-relaxed text-muted">
        Sua peça já tem dona. A gente prepara tudo com carinho e avisa quando sair para entrega.
      </p>
      {order && (
        <div className="flex w-full flex-col gap-4 rounded-[18px] border border-line bg-card p-5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Pedido #{order.id.slice(0, 8)}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${toneClass[info.tone]}`}>{info.label}</span>
          </div>
          {order.items.map((item, i) => (
            <div key={`${item.productId}-${i}`} className="flex items-center gap-3">
              <span className="h-[60px] w-[48px] shrink-0 overflow-hidden rounded-lg"><ProductImage product={{ imageUrl: item.imageUrl, name: item.name }} index={i} /></span>
              <span className="flex-1 text-sm">{item.name}</span>
              <span className="num text-sm font-medium">{money(item.unitPrice)}</span>
            </div>
          ))}
          {order.totalAmount !== undefined && (
            <div className="num flex justify-between border-t border-line pt-3 font-bold">
              <span>Total</span>
              <span>{money(order.totalAmount)}</span>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/minhas-compras" className="btn-primary">Acompanhar minhas compras</Link>
        <Link href="/" className="btn-ghost">Voltar para a loja</Link>
      </div>
    </div>
  );
}
