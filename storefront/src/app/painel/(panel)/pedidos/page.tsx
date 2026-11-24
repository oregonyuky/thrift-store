import type { Metadata } from "next";
import Link from "next/link";
import { LabelActions } from "@/components/painel/LabelActions";
import { StatusBadge } from "@/components/painel/StatusBadge";
import { getBalance, getOrder, getOrders, type OrderRow, type Stage } from "@/lib/painel/data";
import { BalanceRecharge, OrderStatusForm } from "@/components/painel/OrderTools";
import { SidePanel } from "@/components/painel/Fields";
import { dateTime, money } from "@/lib/painel/format";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Pedidos" };
export const dynamic = "force-dynamic";

const groups: Array<{ key: string; label: string; stages: Stage[] | null }> = [
  { key: "todos", label: "Todos", stages: null },
  { key: "pagamento", label: "Aguardando pagamento", stages: [0] },
  { key: "enviar", label: "A enviar", stages: [1, 2, 3] },
  { key: "transporte", label: "Em transporte", stages: [4, 5] },
  { key: "entregues", label: "Entregues", stages: [6] },
  { key: "cancelados", label: "Cancelados", stages: [-1] },
];

const timeline = ["Pedido", "Pago", "Embalado", "Enviado", "Entregue"];
const timelineIndex = (stage: Stage) => (stage < 0 ? -1 : stage === 0 ? 0 : stage === 1 ? 1 : stage <= 3 ? 2 : stage <= 5 ? 3 : 4);

function matches(o: OrderRow, q: string) {
  const s = q.toLowerCase();
  return o.id.toLowerCase().includes(s) || (o.customerName ?? "").toLowerCase().includes(s) || (o.city ?? "").toLowerCase().includes(s);
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ etapa?: string; id?: string; q?: string; recarga?: string }> }) {
  const session = await requireSession();
  const params = await searchParams;
  const group = groups.find((g) => g.key === params.etapa) ?? groups[0];
  const q = (params.q ?? "").trim();

  const [all, balance] = await Promise.all([getOrders(session).catch(() => null), getBalance(session)]);
  const orders = all ?? [];
  const rows = orders.filter((o) => (!group.stages || group.stages.includes(o.stage)) && (!q || matches(o, q)));
  const selectedId = params.id ?? rows[0]?.id;
  const selected = selectedId ? await getOrder(session, selectedId).catch(() => null) : null;

  const href = (extra: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { etapa: group.key === "todos" ? undefined : group.key, q: q || undefined, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `/painel/pedidos?${s}` : "/painel/pedidos";
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-[34px] font-normal tracking-tight">Pedidos</h1>
        <form action="/painel/pedidos" className="flex gap-2.5">
          {group.key !== "todos" && <input type="hidden" name="etapa" value={group.key} />}
          <label className="sr-only" htmlFor="q">Buscar pedidos</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Nº do pedido, cliente ou cidade" className="field w-[280px] max-w-full" />
        </form>
      </div>

      <nav aria-label="Etapa do pedido" className="flex flex-wrap gap-1.5 border-b border-line">
        {groups.map((g) => {
          const active = g.key === group.key;
          const count = g.stages ? orders.filter((o) => g.stages!.includes(o.stage)).length : orders.length;
          return (
            <Link
              key={g.key}
              href={g.key === "todos" ? "/painel/pedidos" : `/painel/pedidos?etapa=${g.key}`}
              aria-current={active ? "page" : undefined}
              className={`-mb-px flex h-11 items-center gap-2 border-b-2 px-3.5 text-sm ${active ? "border-terra font-bold text-ink" : "border-transparent font-medium text-muted hover:text-ink"}`}
            >
              {g.label}
              <span className={`rounded-full px-2 py-px text-xs ${active ? "bg-terra text-card" : "bg-sand text-muted"}`}>{count}</span>
            </Link>
          );
        })}
      </nav>

      {!all && <p role="alert" className="rounded-xl bg-bad-bg px-4 py-3 text-sm text-bad-fg">Não foi possível carregar os pedidos da API.</p>}

      <div className="flex flex-wrap items-start gap-5">
        <section className="panel min-w-0 flex-[999_1_520px] overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted">
                <th className="px-5 py-3.5 font-medium">Pedido</th>
                <th className="px-2 py-3.5 font-medium">Cliente</th>
                <th className="px-2 py-3.5 font-medium">Data</th>
                <th className="px-2 py-3.5 text-right font-medium">Total</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const isSel = o.id === selected?.id;
                return (
                  <tr key={o.id} className={`border-t border-sand ${isSel ? "bg-[#fbf3ec]" : "hover:bg-[#faf6f0]"}`}>
                    <td className="num px-5 py-3.5 font-bold">
                      <Link href={href({ id: o.id })} aria-current={isSel ? "true" : undefined} className="hover:text-terra">#{o.id.slice(0, 8)}</Link>
                    </td>
                    <td className="px-2 py-3.5">
                      <Link href={href({ id: o.id })} className="block">
                        {o.customerName ?? "—"}
                        <span className="block text-xs text-muted">{[o.city, o.state].filter(Boolean).join(", ")}</span>
                      </Link>
                    </td>
                    <td className="num px-2 py-3.5 text-muted">{dateTime(o.orderDate)}</td>
                    <td className="num px-2 py-3.5 text-right font-medium">{money(o.total)}</td>
                    <td className="px-5 py-3.5"><StatusBadge stage={o.stage} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-10 text-center text-sm text-muted">Nenhum pedido nesta etapa.</p>}
        </section>

        {params.recarga && (
          <SidePanel title="Recarregar saldo do Melhor Envio" closeHref={href({ id: params.id })}>
            <p className="text-sm text-muted">Saldo atual: <strong className="num text-ink">{balance === null ? "indisponível" : money(balance)}</strong>. As etiquetas são pagas com esse saldo.</p>
            <BalanceRecharge />
          </SidePanel>
        )}

        {selected && !params.recarga && (
          <aside aria-label="Detalhes do pedido" className="panel flex flex-[1_1_340px] flex-col gap-[18px] p-[22px]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="num text-[13px] text-muted">Pedido #{selected.id.slice(0, 8)} · {dateTime(selected.orderDate)}</span>
                <h2 className="text-xl font-bold">{selected.customerName ?? selected.shipping?.name ?? "Cliente"}</h2>
              </div>
              <StatusBadge stage={selected.stage} />
            </div>

            {selected.stage >= 0 && (
              <ol aria-label="Andamento" className="flex gap-1">
                {timeline.map((label, i) => {
                  const idx = timelineIndex(selected.stage);
                  const done = idx >= i;
                  return (
                    <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className={`h-1 rounded-sm ${done ? "bg-terra" : "bg-line"}`} />
                      <span className={`text-[11px] ${done ? "text-ink" : "text-muted"} ${idx === i ? "font-bold" : ""}`}>{label}</span>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="flex flex-col gap-2.5">
              {selected.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="h-[54px] w-11 shrink-0 overflow-hidden rounded-lg bg-sand">
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="flex-1 text-sm">{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</span>
                  <span className="num text-sm font-medium">{money(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>

            <dl className="num grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-t border-sand pt-3.5 text-sm">
              <dt className="text-muted">Peças</dt>
              <dd className="text-right">{money(selected.itemsTotal)}</dd>
              {selected.shippingCost !== undefined && (
                <>
                  <dt className="text-muted">Frete</dt>
                  <dd className="text-right">{money(selected.shippingCost)}</dd>
                </>
              )}
              <dt className="font-bold">Total</dt>
              <dd className="text-right font-bold">{money(selected.total)}</dd>
              {selected.payment && (
                <>
                  <dt className="text-muted">Pagamento</dt>
                  <dd className="text-right">{[selected.payment.method, selected.payment.provider].filter(Boolean).join(" · ") || "—"}</dd>
                </>
              )}
            </dl>

            {selected.shipping && (
              <div className="border-t border-sand pt-3.5 text-sm leading-relaxed">
                <div className="mb-1.5 text-xs uppercase tracking-[0.06em] text-muted">Entrega</div>
                {selected.shipping.name}
                <br />
                {[selected.shipping.street, selected.shipping.number].filter(Boolean).join(", ")}
                {selected.shipping.complement ? ` · ${selected.shipping.complement}` : ""}
                {selected.shipping.neighborhood ? ` · ${selected.shipping.neighborhood}` : ""}
                <br />
                {[selected.shipping.city, selected.shipping.state].filter(Boolean).join(" / ")}
                {selected.shipping.postCode ? ` · CEP ${selected.shipping.postCode}` : ""}
                {(selected.shipping.phone || selected.shipping.email) && (
                  <span className="block text-muted">{[selected.shipping.phone, selected.shipping.email].filter(Boolean).join(" · ")}</span>
                )}
                {selected.packageName && <span className="mt-1 block text-muted">Embalagem: {selected.packageName}</span>}
              </div>
            )}

            {selected.notes && <p className="rounded-xl bg-[#f4efe8] px-3.5 py-3 text-sm"><strong>Observação:</strong> {selected.notes}</p>}

            <LabelActions
              key={`${selected.id}-${selected.stage}-${selected.meCheckedOut}-${selected.meGenerated}`}
              orderId={selected.id}
              stage={selected.stage}
              cartId={selected.meCartId}
              cartAdded={selected.meCartAdded}
              checkedOut={selected.meCheckedOut}
              generated={selected.meGenerated}
              balance={balance === null ? null : money(balance)}
            />

            <OrderStatusForm key={`s-${selected.id}-${selected.status}`} orderId={selected.id} status={selected.status} />
            <Link href={href({ id: selected.id, recarga: "1" })} className="text-[13px] font-medium text-muted hover:text-ink">Recarregar saldo do Melhor Envio</Link>
          </aside>
        )}
      </div>
    </div>
  );
}
