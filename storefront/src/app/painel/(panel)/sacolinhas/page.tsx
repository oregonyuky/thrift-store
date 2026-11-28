import type { Metadata } from "next";
import { BagActions } from "@/components/painel/BagActions";
import Link from "next/link";
import { saveBagSettings } from "@/app/painel/manage-actions";
import { Field, Select, SidePanel } from "@/components/painel/Fields";
import { FormShell } from "@/components/painel/FormShell";
import { getBagDetail, getBags, getBagSettings, type BagDetail, type BagItem, type BagRow } from "@/lib/painel/data";
import { getBagSettingsFull } from "@/lib/painel/manage";
import { dateTime, dayKey, money } from "@/lib/painel/format";
import { durationLabel, fromApiDuration, unitOptions } from "@/lib/painel/duration";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Sacolinhas" };
export const dynamic = "force-dynamic";

const columns: Array<{ title: string; statuses: string[]; color: string }> = [
  { title: "Abertas", statuses: ["Active"], color: "bg-terra" },
  { title: "Prontas para envio", statuses: ["Closed", "ReadyToShip"], color: "bg-info-fg" },
  { title: "Enviadas", statuses: ["Shipped"], color: "bg-ok-fg" },
  { title: "Expiradas", statuses: ["Expired", "Abandoned"], color: "bg-muted" },
];

function deadline(bag: BagRow) {
  if (!bag.expirationDate) return { text: "Sem prazo definido", pct: 0, urgent: false };
  const end = new Date(bag.expirationDate).getTime();
  const start = bag.createdAt ? new Date(bag.createdAt).getTime() : end - 30 * 86400000;
  const now = Date.now();
  const pct = Math.min(100, Math.max(0, Math.round(((now - start) / Math.max(end - start, 1)) * 100)));
  const today = dayKey(new Date());
  const day = dayKey(bag.expirationDate);
  if (end <= now) return { text: `Venceu em ${dateTime(bag.expirationDate)}`, pct: 100, urgent: true };
  if (end - now < 3600000) {
    const mins = Math.max(1, Math.ceil((end - now) / 60000));
    return { text: `Fecha em ${mins} ${mins === 1 ? "minuto" : "minutos"}`, pct, urgent: true };
  }
  if (day === today) return { text: `Fecha hoje às ${new Date(end).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}`, pct, urgent: true };
  const daysLeft = Math.ceil((end - now) / 86400000);
  return { text: `Fecha em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`, pct, urgent: daysLeft <= 1 };
}

function itemState(item: BagItem): { label: string; cls: string } {
  if (item.isPaid) return { label: "Paga", cls: "bg-ok-bg text-ok-fg" };
  if (item.isReserved && item.reservationExpiresAt) return { label: `Reservada até ${dateTime(item.reservationExpiresAt)}`, cls: "bg-warn-bg text-warn-fg" };
  return { label: "Aguardando pagamento", cls: "bg-warn-bg text-warn-fg" };
}

function BagDetailView({ bag }: { bag: BagDetail }) {
  const paid = bag.items.filter((i) => i.isPaid);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
        <span>Aberta em {bag.createdAt ? dateTime(bag.createdAt) : "—"}</span>
        {bag.expirationDate && <span>Prazo: {dateTime(bag.expirationDate)}</span>}
        {bag.customerId && (
          <Link href={`/painel/clientes?id=${bag.customerId}`} className="font-bold text-ink hover:text-terra">Ver cliente →</Link>
        )}
      </div>

      {bag.items.length === 0 ? (
        <p className="rounded-xl bg-[#f4efe8] p-4 text-sm text-muted">Nenhuma peça nesta sacolinha.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-sand">
          {bag.items.map((item) => {
            const st = itemState(item);
            return (
              <li key={item.id} className="flex items-center gap-3 py-2.5">
                <span className="h-[64px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-sand">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  {item.productId ? (
                    <Link href={`/painel/produtos?editar=${item.productId}`} className="truncate text-sm font-medium hover:text-terra">
                      {item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ""}
                    </Link>
                  ) : (
                    <span className="truncate text-sm font-medium">{item.name}</span>
                  )}
                  <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                  {item.addedAt && <span className="text-xs text-muted">Entrou em {dateTime(item.addedAt)}</span>}
                </span>
                <span className="num text-sm font-medium">{money(item.price * item.quantity)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <dl className="num flex flex-col gap-1.5 border-t border-sand pt-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Peças pagas</dt><dd>{paid.length} de {bag.items.length}</dd></div>
        {bag.totalWeight ? <div className="flex justify-between"><dt className="text-muted">Peso</dt><dd>{bag.totalWeight.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg</dd></div> : null}
        {bag.shippingCost !== undefined && <div className="flex justify-between"><dt className="text-muted">Frete</dt><dd>{money(bag.shippingCost)}</dd></div>}
        <div className="flex justify-between font-bold"><dt>Total das peças</dt><dd>{money(bag.totalItemsValue)}</dd></div>
      </dl>

      {bag.history.length > 0 && (
        <details className="text-[13px]">
          <summary className="cursor-pointer font-bold">Prorrogações ({bag.history.length})</summary>
          <ul className="mt-2 flex flex-col gap-1 text-muted">
            {bag.history.slice(0, 8).map((h) => (
              <li key={h.id}>
                {h.changedAt ? dateTime(h.changedAt) : ""}: {h.oldDate ? dateTime(h.oldDate) : "?"} → {h.newDate ? dateTime(h.newDate) : "?"}
                {h.note ? ` · ${h.note}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
      {bag.notes && <p className="rounded-xl bg-[#f4efe8] p-3 text-[13px]">{bag.notes}</p>}
    </div>
  );
}

export default async function BagsPage({ searchParams }: { searchParams: Promise<{ config?: string; id?: string }> }) {
  const session = await requireSession();
  const { config, id } = await searchParams;
  const [bags, settings, full, detail] = await Promise.all([
    getBags(session).catch(() => null),
    getBagSettings(session),
    config ? getBagSettingsFull(session) : Promise.resolve(null),
    id ? getBagDetail(session, id).catch(() => undefined) : Promise.resolve(null),
  ]);
  const extendLabel = `Prorrogar ${durationLabel(settings?.extensionDurationValue ?? 7, settings?.extensionDurationUnit ?? "days")}`;

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[34px] font-normal tracking-tight">Sacolinhas</h1>
          <span className="text-sm text-muted">Compras pagas que esperam o prazo para viajar juntas.</span>
        </div>
        <Link href={config ? "/painel/sacolinhas" : "/painel/sacolinhas?config=1"} className="btn-ghost">
          Prazos e configurações
        </Link>
      </div>

      {config && (
        <div className="max-w-2xl">
        <SidePanel title="Prazos da sacolinha" closeHref="/painel/sacolinhas">
          {full ? (
            <FormShell action={saveBagSettings}>
              <p className="text-sm text-muted">Valem para as próximas sacolinhas abertas e prorrogações. O mínimo é 1 minuto.</p>
              <div className="grid grid-cols-[1fr_1.2fr] gap-3">
                <Field label="Duração padrão" name="defaultDurationValue" type="number" min={1} defaultValue={fromApiDuration(full.defaultDurationValue, full.defaultDurationUnit).value} />
                <Select label="Unidade" name="defaultDurationUnit" defaultValue={fromApiDuration(full.defaultDurationValue, full.defaultDurationUnit).unit} options={unitOptions} />
                <Field label="Cada prorrogação" name="extensionDurationValue" type="number" min={1} defaultValue={fromApiDuration(full.extensionDurationValue, full.extensionDurationUnit).value} />
                <Select label="Unidade" name="extensionDurationUnit" defaultValue={fromApiDuration(full.extensionDurationValue, full.extensionDurationUnit).unit} options={unitOptions} />
                <Field label="Prazo para responder o e-mail de prorrogação" name="extensionResponseDeadlineValue" type="number" min={1} defaultValue={fromApiDuration(full.extensionResponseDeadlineValue, full.extensionResponseDeadlineUnit).value} />
                <Select label="Unidade" name="extensionResponseDeadlineUnit" defaultValue={fromApiDuration(full.extensionResponseDeadlineValue, full.extensionResponseDeadlineUnit).unit} options={unitOptions} />
              </div>
            </FormShell>
          ) : (
            <p className="text-sm text-bad-fg">Não foi possível carregar os prazos atuais.</p>
          )}
        </SidePanel>
        </div>
      )}
      {id && (
        <div className="max-w-2xl">
          <SidePanel title={detail ? `Sacolinha de ${detail.customerName ?? "cliente"}` : "Sacolinha"} closeHref="/painel/sacolinhas">
            {detail === undefined && <p className="text-sm text-bad-fg">Não foi possível carregar esta sacolinha.</p>}
            {detail === null && <p className="text-sm text-muted">Sacolinha não encontrada.</p>}
            {detail && <BagDetailView bag={detail} />}
          </SidePanel>
        </div>
      )}
      {!bags && <p role="alert" className="rounded-xl bg-bad-bg px-4 py-3 text-sm text-bad-fg">Não foi possível carregar as sacolinhas da API.</p>}

      <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => {
          const cards = (bags ?? [])
            .filter((b) => col.statuses.includes(b.status))
            .sort((a, b) => new Date(a.expirationDate ?? 0).getTime() - new Date(b.expirationDate ?? 0).getTime());
          return (
            <section key={col.title} aria-label={col.title} className="flex flex-col gap-3 rounded-2xl bg-sand p-3.5">
              <div className="flex items-center justify-between px-1 pt-0.5">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <span className={`h-2 w-2 rounded-full ${col.color}`} />
                  {col.title}
                </h2>
                <span className="num text-[13px] text-muted">{cards.length}</span>
              </div>
              {cards.length === 0 && <p className="px-1 pb-2 text-[13px] text-muted">Nenhuma por aqui.</p>}
              {cards.map((bag) => {
                const d = deadline(bag);
                const isOpen = bag.status === "Active";
                return (
                  <article key={bag.id} className={`flex flex-col gap-2.5 rounded-xl border bg-card p-3.5 ${bag.id === id ? "border-terra" : "border-line"}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <strong className="text-[15px]">{bag.customerName ?? "Cliente"}</strong>
                      <span className="num text-sm font-medium">{money(bag.totalItemsValue)}</span>
                    </div>
                    <span className="text-[13px] text-muted">
                      {bag.itemCount} {bag.itemCount === 1 ? "peça" : "peças"}
                      {bag.totalWeight ? ` · ${bag.totalWeight.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg` : ""}
                      {!bag.allItemsPaid && isOpen ? " · pagamento pendente" : ""}
                    </span>
                    {isOpen ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="h-1.5 rounded-sm bg-sand">
                          <div className={`h-full rounded-sm ${d.urgent ? "bg-[#c26a1e]" : "bg-terra"}`} style={{ width: `${d.pct}%` }} />
                        </div>
                        <span className={`text-xs ${d.urgent ? "font-bold text-warn-fg" : "text-muted"}`}>{d.text}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">
                        {bag.status === "Shipped"
                          ? `Fechada ${bag.closedAt ? `em ${dateTime(bag.closedAt)}` : ""}`
                          : bag.closedAt
                            ? `Fechada em ${dateTime(bag.closedAt)}`
                            : bag.expirationDate
                              ? `Prazo: ${dateTime(bag.expirationDate)}`
                              : ""}
                        {bag.shippingCost ? ` · frete ${money(bag.shippingCost)}` : ""}
                      </span>
                    )}
                    <Link
                      href={`/painel/sacolinhas?id=${bag.id}`}
                      scroll={false}
                      aria-current={bag.id === id ? "true" : undefined}
                      className={`text-[13px] font-bold hover:text-terra ${bag.id === id ? "text-terra" : ""}`}
                    >
                      Ver {bag.itemCount === 1 ? "a peça" : `as ${bag.itemCount} peças`} →
                    </Link>
                    <BagActions
                      bagId={bag.id}
                      customer={bag.customerName ?? "cliente"}
                      canExtend={isOpen}
                      canClose={isOpen && bag.allItemsPaid}
                      extendLabel={extendLabel}
                    />
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
