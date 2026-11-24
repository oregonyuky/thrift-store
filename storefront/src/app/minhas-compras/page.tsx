import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PendingPix } from "@/components/PendingPix";
import { ProductImage } from "@/components/ProductCard";
import { dateTime, money, statusInfo, toneClass } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getOrders, getPurchaseHistory, isPaidStatus, qrImage, type BagItem } from "@/lib/store";

export const metadata: Metadata = { title: "Minhas compras" };
export const dynamic = "force-dynamic";

interface Purchase {
  key: string;
  kind: "order" | "bag";
  id: string;
  status?: string;
  date?: string;
  total?: number;
  shippingCost?: number;
  items: BagItem[];
  pix?: { paymentId?: string; qrImage?: string | null; pixCode?: string; expiresAt?: string };
}

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<{ pago?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/entrar?returnUrl=/minhas-compras");
  const { pago } = await searchParams;

  let failed = false;
  const [orders, bags] = await Promise.all([
    getOrders(session).catch(() => {
      failed = true;
      return [];
    }),
    getPurchaseHistory(session).catch(() => {
      failed = true;
      return [];
    }),
  ]);

  const now = Date.now();
  const purchases: Purchase[] = [
    ...orders.map((o): Purchase => ({
      key: `o-${o.id}`,
      kind: "order",
      id: o.id,
      status: o.status,
      date: o.orderDate,
      total: o.totalAmount,
      shippingCost: o.shippingCost,
      items: o.items,
      pix:
        (o.pixCode || o.pixQrCodeBase64) && !isPaidStatus(o.paymentStatus) && o.status === "Pending" &&
        (!o.paymentExpiresAt || new Date(o.paymentExpiresAt).getTime() > now)
          ? { paymentId: o.paymentId, qrImage: qrImage(o.pixQrCodeBase64), pixCode: o.pixCode, expiresAt: o.paymentExpiresAt }
          : undefined,
    })),
    ...bags.map((b): Purchase => ({
      key: `b-${b.id}`,
      kind: "bag",
      id: b.id,
      status: b.status,
      date: b.paidAt ?? b.expirationDate,
      total: b.totalItemsValue + (b.shippingCost ?? 0),
      shippingCost: b.shippingCost,
      items: b.items,
      pix:
        (b.currentPaymentQrCode || b.currentPaymentQrCodeBase64) &&
        (!b.currentPaymentExpiresAt || new Date(b.currentPaymentExpiresAt).getTime() > now) &&
        b.items.some((i) => !i.isPaid)
          ? { paymentId: b.currentPaymentId, qrImage: qrImage(b.currentPaymentQrCodeBase64), pixCode: b.currentPaymentQrCode, expiresAt: b.currentPaymentExpiresAt }
          : undefined,
    })),
  ].sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-7 px-5 pb-24 pt-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-[40px] font-normal tracking-tight">Minhas compras</h1>
        <Link href="/carrinho?aba=sacolinha" className="text-sm font-medium underline underline-offset-4 hover:text-terra">Ver minha sacolinha</Link>
      </div>
      {pago && <p role="status" className="rounded-xl bg-ok-bg px-4 py-3 text-sm text-ok-fg">Pagamento confirmado! Suas peças estão garantidas.</p>}
      {failed && <p role="alert" className="rounded-xl bg-bad-bg px-4 py-3 text-sm text-bad-fg">Parte do seu histórico não carregou. Atualize a página em instantes.</p>}

      {purchases.length === 0 && !failed ? (
        <div className="flex flex-col items-center gap-4 rounded-[18px] border border-dashed border-line px-6 py-14 text-center">
          <p className="font-display text-2xl italic">Você ainda não fez nenhuma compra.</p>
          <Link href="/#pecas" className="btn-primary">Garimpar peças</Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {purchases.map((p) => {
            const info = statusInfo(p.status);
            return (
              <li key={p.key} className="flex flex-col gap-4 rounded-[18px] border border-line bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] text-muted">
                      {p.kind === "bag" ? "Sacolinha" : "Pedido"} #{p.id.slice(0, 8)}
                      {p.date ? ` · ${dateTime(p.date)}` : ""}
                    </span>
                    <span className="num text-xl font-bold">{money(p.total)}</span>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${toneClass[info.tone]}`}>{info.label}</span>
                </div>
                {p.items.length > 0 && (
                  <ul className="flex flex-wrap gap-3">
                    {p.items.map((item, i) => (
                      <li key={`${item.productId}-${i}`} className="flex w-[220px] items-center gap-3">
                        <span className="h-[60px] w-[48px] shrink-0 overflow-hidden rounded-lg"><ProductImage product={{ imageUrl: item.imageUrl, name: item.name }} index={i} /></span>
                        <span className="flex min-w-0 flex-col text-sm">
                          <span className="truncate">{item.name}</span>
                          <span className="num text-muted">{money(item.unitPrice)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {p.pix && <PendingPix data={{ kind: p.kind, id: p.id, ...p.pix }} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
