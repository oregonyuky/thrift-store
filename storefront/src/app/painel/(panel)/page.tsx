import type { Metadata } from "next";
import Link from "next/link";
import { ChevronIcon, BoxIcon, ClockIcon, ChatIcon } from "@/components/painel/icons";
import { StatusBadge } from "@/components/painel/StatusBadge";
import { getBags, getBalance, getDrops, getOrders, getProducts, getUnreadMessages, type OrderRow } from "@/lib/painel/data";
import { dayKey, greeting, money, moneyShort, relative, todayLong } from "@/lib/painel/format";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Visão geral" };
export const dynamic = "force-dynamic";

const PERIODS = [7, 30, 90] as const;
const DAY = 86400000;

function sumPaid(orders: OrderRow[], from: number, to: number) {
  const list = orders.filter((o) => o.stage >= 1 && o.orderDate && new Date(o.orderDate).getTime() >= from && new Date(o.orderDate).getTime() < to);
  return { list, total: list.reduce((s, o) => s + o.total, 0) };
}

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const session = await requireSession();
  const { periodo } = await searchParams;
  const days = PERIODS.find((p) => String(p) === periodo) ?? 30;

  const [orders, bags, products, drops, balance, unread] = await Promise.all([
    getOrders(session).catch(() => null),
    getBags(session).catch(() => null),
    getProducts(session).catch(() => null),
    getDrops(session),
    getBalance(session),
    getUnreadMessages(session),
  ]);

  const now = Date.now();
  const current = sumPaid(orders ?? [], now - days * DAY, now + DAY);
  const previous = sumPaid(orders ?? [], now - 2 * days * DAY, now - days * DAY);
  const delta = previous.total > 0 ? Math.round(((current.total - previous.total) / previous.total) * 100) : null;
  const ticket = current.list.length ? current.total / current.list.length : 0;

  // Bars: one per day (7 and 30 days) or per week (90 days).
  const bucketDays = days === 90 ? 7 : 1;
  const bucketCount = Math.ceil(days / bucketDays);
  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const end = now - (bucketCount - 1 - i) * bucketDays * DAY;
    const start = end - bucketDays * DAY;
    const keys = new Set(Array.from({ length: bucketDays }, (_, k) => dayKey(new Date(end - k * DAY))));
    const value = current.list.filter((o) => keys.has(dayKey(o.orderDate!))).reduce((s, o) => s + o.total, 0);
    return { value, label: bucketDays === 1 ? dayKey(new Date(end)).slice(8, 10) + "/" + dayKey(new Date(end)).slice(5, 7) : `semana até ${dayKey(new Date(end)).slice(8, 10)}/${dayKey(new Date(end)).slice(5, 7)}`, start };
  });
  const max = Math.max(...buckets.map((b) => b.value), 1);
  const niceMax = (() => {
    const pow = 10 ** Math.floor(Math.log10(max));
    return Math.ceil(max / pow) * pow;
  })();

  const today = dayKey(new Date());
  const openBags = (bags ?? []).filter((b) => b.status === "Active");
  const closingToday = openBags.filter((b) => b.expirationDate && dayKey(b.expirationDate) <= today);
  const toLabel = (orders ?? []).filter((o) => o.stage === 1 || o.stage === 2);
  const forSale = (products ?? []).filter((p) => p.available && !p.isSold);
  const soldTotal = (products ?? []).filter((p) => p.isSold).length;

  const activeDrop = drops.find((d) => d.ativo);
  const dropProducts = activeDrop ? (products ?? []).filter((p) => p.dropConfigId === activeDrop.id) : [];
  const dropSold = dropProducts.filter((p) => p.isSold);
  const dropPct = dropProducts.length ? Math.round((dropSold.length / dropProducts.length) * 100) : 0;

  const tasks: Array<{ href: string; external?: boolean; title: string; sub: string; tone: string; icon: React.ReactNode }> = [];
  if (toLabel.length)
    tasks.push({ href: "/painel/pedidos?etapa=enviar", title: `${toLabel.length} ${toLabel.length === 1 ? "pedido pago" : "pedidos pagos"} sem etiqueta`, sub: "Gerar etiquetas no Melhor Envio", tone: "bg-info-bg text-info-fg", icon: <BoxIcon /> });
  if (closingToday.length)
    tasks.push({ href: "/painel/sacolinhas", title: `${closingToday.length} ${closingToday.length === 1 ? "sacolinha fecha" : "sacolinhas fecham"} hoje`, sub: "Prorrogar ou preparar envio", tone: "bg-warn-bg text-warn-fg", icon: <ClockIcon /> });
  if (unread)
    tasks.push({ href: "/painel/mensagens", title: `${unread} ${unread === 1 ? "mensagem nova" : "mensagens novas"}`, sub: "Fale conosco", tone: "bg-sand text-[#6b4a2e]", icon: <ChatIcon /> });

  const kpi = "panel flex flex-col gap-2 p-5";
  const loadError = !orders || !bags || !products;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[34px] font-normal tracking-tight">{greeting()}, {session.name.split(" ")[0]}</h1>
          <span className="text-sm text-muted">{todayLong()}</span>
        </div>
        <nav aria-label="Período" className="flex rounded-[10px] bg-sand p-[3px]">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`/painel?periodo=${p}`}
              aria-current={p === days ? "page" : undefined}
              className={`flex h-9 items-center rounded-lg px-3.5 text-[13px] ${p === days ? "bg-card font-bold shadow-[0_1px_4px_rgba(42,31,30,0.1)]" : "font-medium text-muted hover:text-ink"}`}
            >
              {p} dias
            </Link>
          ))}
        </nav>
      </div>

      {loadError && <p role="alert" className="rounded-xl bg-bad-bg px-4 py-3 text-sm text-bad-fg">Parte dos dados não carregou da API. Os números abaixo podem estar incompletos.</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={kpi}>
          <span className="text-[13px] text-muted">Vendas em pedidos</span>
          <span className="num text-3xl font-bold tracking-tight">{money(current.total)}</span>
          <span className={`text-[13px] font-medium ${delta === null ? "text-muted" : delta >= 0 ? "text-ok-fg" : "text-bad-fg"}`}>
            {delta === null ? `últimos ${days} dias` : `${delta >= 0 ? "+" : ""}${delta}% vs. ${days} dias anteriores`}
          </span>
        </div>
        <div className={kpi}>
          <span className="text-[13px] text-muted">Pedidos pagos</span>
          <span className="num text-3xl font-bold tracking-tight">{current.list.length}</span>
          <span className="text-[13px] text-muted">ticket médio {money(ticket)}</span>
        </div>
        <div className={kpi}>
          <span className="text-[13px] text-muted">Sacolinhas abertas</span>
          <span className="num text-3xl font-bold tracking-tight">{openBags.length}</span>
          <span className={`text-[13px] font-medium ${closingToday.length ? "text-warn-fg" : "text-muted"}`}>
            {closingToday.length ? `${closingToday.length} fecham hoje` : `${money(openBags.reduce((s, b) => s + b.totalItemsValue, 0))} guardados`}
          </span>
        </div>
        <div className={kpi}>
          <span className="text-[13px] text-muted">Peças à venda</span>
          <span className="num text-3xl font-bold tracking-tight">{forSale.length}</span>
          <span className="text-[13px] text-muted">{soldTotal} vendidas no total</span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="panel flex min-w-0 flex-col gap-[18px] p-[22px] xl:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-base font-bold">Vendas em pedidos por {bucketDays === 1 ? "dia" : "semana"}</h2>
            <span className="text-[13px] text-muted">passe o mouse nas barras</span>
          </div>
          <div className="flex h-[220px] gap-3">
            <div className="num flex flex-col justify-between pb-[22px] text-right text-[11px] text-muted">
              <span>{moneyShort(niceMax)}</span>
              <span>{moneyShort(niceMax / 2)}</span>
              <span>0</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-1 items-end gap-1 border-b border-line bg-[linear-gradient(#efe6da_1px,transparent_1px)] bg-[length:100%_50%]" role="img" aria-label={`Gráfico de vendas: total ${money(current.total)} nos últimos ${days} dias`}>
                {buckets.map((b, i) => (
                  <div
                    key={i}
                    title={`${b.label}: ${money(b.value)}`}
                    className={`min-w-0 flex-1 rounded-t-[4px] transition-colors hover:bg-terra ${i === buckets.length - 1 ? "bg-terra" : "bg-[#d9b8ac]"}`}
                    style={{ height: `${Math.max((b.value / niceMax) * 100, b.value > 0 ? 2 : 0)}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-muted">
                <span>{days} dias atrás</span>
                <span>hoje</span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel flex flex-col gap-3.5 p-[22px]">
          <h2 className="text-base font-bold">Para fazer hoje</h2>
          {tasks.length === 0 && <p className="rounded-xl bg-ok-bg px-3.5 py-3 text-sm text-ok-fg">Tudo em dia por aqui.</p>}
          {tasks.map((t) => {
            const inner = (
              <>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${t.tone}`}>{t.icon}</span>
                <span className="flex flex-1 flex-col text-sm">
                  <strong>{t.title}</strong>
                  <span className="text-[13px] text-muted">{t.sub}</span>
                </span>
                <ChevronIcon size={16} className="text-muted" />
              </>
            );
            const cls = "flex items-center gap-3 rounded-xl border border-line p-3 hover:bg-[#faf6f0]";
            return t.external ? (
              <a key={t.title} href={t.href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
            ) : (
              <Link key={t.title} href={t.href} className={cls}>{inner}</Link>
            );
          })}
          {balance !== null && (
            <div className={`mt-auto flex items-center justify-between gap-2 rounded-xl px-3.5 py-3 text-sm ${balance < 30 ? "bg-bad-bg text-bad-fg" : "bg-[#f4efe8]"}`}>
              <span className="flex flex-col">
                <strong>{balance < 30 ? "Saldo Melhor Envio baixo" : "Saldo Melhor Envio"}</strong>
                <span className="num text-[13px]">{money(balance)}</span>
              </span>
              <Link href="/painel/pedidos?recarga=1" className="py-2 text-[13px] font-bold underline-offset-4 hover:underline">
                Recarregar
              </Link>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="panel flex min-w-0 flex-col gap-2.5 pb-2 pt-[22px] xl:col-span-2">
          <div className="flex items-baseline justify-between px-[22px]">
            <h2 className="text-base font-bold">Pedidos recentes</h2>
            <Link href="/painel/pedidos" className="text-sm font-medium hover:text-terra">Ver todos</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="rtable w-full md:min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted">
                  <th className="px-[22px] py-2.5 font-medium">Pedido</th>
                  <th className="px-2 py-2.5 font-medium">Cliente</th>
                  <th className="px-2 py-2.5 font-medium">Peças</th>
                  <th className="px-2 py-2.5 text-right font-medium">Total</th>
                  <th className="px-[22px] py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(orders ?? []).slice(0, 6).map((o) => (
                  <tr key={o.id} className="border-t border-sand hover:bg-[#faf6f0]">
                    <td className="num px-[22px] py-3 font-bold">
                      <Link href={`/painel/pedidos?id=${o.id}`} className="hover:text-terra">#{o.id.slice(0, 8)}</Link>
                    </td>
                    <td className="px-2 py-3">
                      {o.customerName ?? "—"}
                      <div className="text-xs text-muted">{relative(o.orderDate)}</div>
                    </td>
                    <td className="num px-2 py-3">{o.itemCount}</td>
                    <td className="num px-2 py-3 text-right font-medium">{money(o.total)}</td>
                    <td className="px-[22px] py-3"><StatusBadge stage={o.stage} /></td>
                  </tr>
                ))}
                {orders && orders.length === 0 && (
                  <tr><td colSpan={5} className="px-[22px] py-8 text-center text-muted">Nenhum pedido ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col gap-3.5 rounded-2xl bg-ink p-[22px] text-paper">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-blush">Drop ativo</span>
          {activeDrop ? (
            <>
              <h2 className="font-display text-[28px] font-normal">{activeDrop.name}</h2>
              <div className="flex justify-between text-sm">
                <span className="text-[#d9ccc2]">Vendidas</span>
                <span className="num font-bold">{dropSold.length} de {dropProducts.length}</span>
              </div>
              <div role="progressbar" aria-valuenow={dropPct} aria-valuemin={0} aria-valuemax={100} aria-label="Peças vendidas do drop" className="h-2 rounded bg-[#4a3b38]">
                <div className="h-full rounded bg-blush" style={{ width: `${dropPct}%` }} />
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-ink-2 p-3">
                  <div className="text-xs text-[#d9ccc2]">Faturado</div>
                  <div className="num text-lg font-bold">{money(dropSold.reduce((s, p) => s + p.price, 0))}</div>
                </div>
                <div className="rounded-xl bg-ink-2 p-3">
                  <div className="text-xs text-[#d9ccc2]">À venda</div>
                  <div className="num text-lg font-bold">{dropProducts.length - dropSold.length}</div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#d9ccc2]">Nenhum drop ativo no momento.</p>
          )}
          <Link href="/painel/drops" className="mt-auto py-1.5 text-sm font-bold text-blush hover:underline">
            Configurar drops
          </Link>
        </section>
      </div>
    </div>
  );
}
