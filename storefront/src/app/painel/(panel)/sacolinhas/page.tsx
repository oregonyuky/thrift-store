import type { Metadata } from "next";
import { BagActions } from "@/components/painel/BagActions";
import Link from "next/link";
import { saveBagSettings } from "@/app/painel/manage-actions";
import { Field, Select, SidePanel } from "@/components/painel/Fields";
import { FormShell } from "@/components/painel/FormShell";
import { getBags, getBagSettings, type BagRow } from "@/lib/painel/data";
import { getBagSettingsFull } from "@/lib/painel/manage";
import { dateTime, dayKey, money } from "@/lib/painel/format";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Sacolinhas" };
export const dynamic = "force-dynamic";

const unitLabel: Record<string, [string, string]> = {
  minutes: ["minuto", "minutos"],
  hours: ["hora", "horas"],
  days: ["dia", "dias"],
  weeks: ["semana", "semanas"],
  months: ["mês", "meses"],
};

const unitOptions: Array<[string, string]> = [["hours", "horas"], ["days", "dias"], ["weeks", "semanas"], ["months", "meses"]];

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
  if (day === today) return { text: `Fecha hoje às ${new Date(end).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}`, pct, urgent: true };
  const daysLeft = Math.ceil((end - now) / 86400000);
  return { text: `Fecha em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`, pct, urgent: daysLeft <= 1 };
}

export default async function BagsPage({ searchParams }: { searchParams: Promise<{ config?: string }> }) {
  const session = await requireSession();
  const { config } = await searchParams;
  const [bags, settings, full] = await Promise.all([getBags(session).catch(() => null), getBagSettings(session), config ? getBagSettingsFull(session) : Promise.resolve(null)]);
  const units = unitLabel[settings?.extensionDurationUnit ?? "days"] ?? ["dia", "dias"];
  const ext = settings?.extensionDurationValue ?? 7;
  const extendLabel = `Prorrogar ${ext} ${ext === 1 ? units[0] : units[1]}`;

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
              <p className="text-sm text-muted">Valem para as próximas sacolinhas abertas e prorrogações.</p>
              <div className="grid grid-cols-[1fr_1.2fr] gap-3">
                <Field label="Duração padrão" name="defaultDurationValue" type="number" min={1} defaultValue={full.defaultDurationValue} />
                <Select label="Unidade" name="defaultDurationUnit" defaultValue={full.defaultDurationUnit} options={unitOptions} />
                <Field label="Cada prorrogação" name="extensionDurationValue" type="number" min={1} defaultValue={full.extensionDurationValue} />
                <Select label="Unidade" name="extensionDurationUnit" defaultValue={full.extensionDurationUnit} options={unitOptions} />
                <Field label="Prazo para responder o e-mail de prorrogação" name="extensionResponseDeadlineValue" type="number" min={1} defaultValue={full.extensionResponseDeadlineValue} />
                <Select label="Unidade" name="extensionResponseDeadlineUnit" defaultValue={full.extensionResponseDeadlineUnit} options={unitOptions} />
              </div>
            </FormShell>
          ) : (
            <p className="text-sm text-bad-fg">Não foi possível carregar os prazos atuais.</p>
          )}
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
                  <article key={bag.id} className="flex flex-col gap-2.5 rounded-xl border border-line bg-card p-3.5">
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
