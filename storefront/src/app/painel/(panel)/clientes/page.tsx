import type { Metadata } from "next";
import Link from "next/link";
import { deleteCustomer, saveCustomer } from "@/app/painel/manage-actions";
import { Field, LoadError, PageHeader, rowCls, Select, SidePanel, td, TextArea, th } from "@/components/painel/Fields";
import { ActionButton, FormShell } from "@/components/painel/FormShell";
import { StatusBadge } from "@/components/painel/StatusBadge";
import { getOrders } from "@/lib/painel/data";
import { money, shortDate } from "@/lib/painel/format";
import { getCustomers } from "@/lib/painel/manage";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; id?: string }> }) {
  const session = await requireSession();
  const { q = "", id } = await searchParams;
  const [customers, orders] = await Promise.all([getCustomers(session).catch(() => null), getOrders(session).catch(() => [])]);
  const term = q.trim().toLowerCase();
  const rows = (customers ?? []).filter(
    (c) => !term || [c.name, c.emailAddress, c.phoneNumber, c.instagram, c.city].some((v) => v?.toLowerCase().includes(term)),
  );
  const selected = id ? (customers ?? []).find((c) => c.id === id) : undefined;
  const href = (extra?: string) => `/painel/clientes?${new URLSearchParams({ ...(q ? { q } : {}), ...(extra ? { id: extra } : {}) })}`;
  const spent = (cid: string) => orders.filter((o) => o.customerId === cid && o.stage >= 1).reduce((s, o) => s + o.total, 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Clientes" subtitle={customers ? `${customers.length} cadastradas` : undefined} />
      <form action="/painel/clientes" className="flex gap-2.5">
        <label className="sr-only" htmlFor="cq">Buscar clientes</label>
        <input id="cq" name="q" type="search" defaultValue={q} placeholder="Nome, e-mail, telefone, Instagram ou cidade" className="field w-[360px] max-w-full" />
        <button type="submit" className="btn-ghost">Buscar</button>
      </form>
      <LoadError show={!customers} what="as clientes" />

      <div className="flex flex-wrap items-start gap-5">
        <section className="panel min-w-0 flex-[999_1_520px] overflow-x-auto">
          <table className="rtable w-full md:min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted">
                <th className="px-5 py-3.5 font-medium">Cliente</th>
                <th className={th}>Contato</th>
                <th className={th}>Cidade</th>
                <th className={`${th} text-right`}>Comprou</th>
                <th className="px-5 py-3.5 font-medium">Desde</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className={rowCls(c.id === selected?.id)}>
                  <td className="px-5 py-3">
                    <Link href={href(c.id)} className="font-medium hover:text-terra">{c.name || "Sem nome"}</Link>
                    {c.customerStatus && c.customerStatus !== "Active" && <span className="ml-2 rounded-full bg-sand px-2 py-0.5 text-[11px] text-muted">{c.customerStatus}</span>}
                    {c.instagram && <span className="block text-xs text-muted">{c.instagram}</span>}
                  </td>
                  <td className={`${td} text-muted`}>
                    {c.emailAddress}
                    {c.phoneNumber && <span className="block text-xs">{c.phoneNumber}</span>}
                  </td>
                  <td className={`${td} text-muted`}>{[c.city, c.state].filter(Boolean).join(" / ") || "—"}</td>
                  <td className={`${td} num text-right`}>{money(spent(c.id))}</td>
                  <td className="num px-5 py-3 text-muted">{shortDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers && rows.length === 0 && <p className="p-10 text-center text-sm text-muted">Nenhuma cliente encontrada.</p>}
        </section>

        {selected && (
          <SidePanel title={selected.name || "Cliente"} closeHref={href()}>
            {(() => {
              const list = orders.filter((o) => o.customerId === selected.id).slice(0, 6);
              return list.length > 0 ? (
                <div className="flex flex-col gap-2 rounded-xl bg-[#f4efe8] p-3.5">
                  <span className="text-[13px] font-bold">Últimos pedidos</span>
                  {list.map((o) => (
                    <Link key={o.id} href={`/painel/pedidos?id=${o.id}`} className="flex items-center justify-between gap-2 text-sm hover:text-terra">
                      <span className="num">#{o.id.slice(0, 8)} · {money(o.total)}</span>
                      <StatusBadge stage={o.stage} />
                    </Link>
                  ))}
                </div>
              ) : null;
            })()}
            <FormShell action={saveCustomer} key={selected.id}>
              <input type="hidden" name="id" value={selected.id} />
              <Field label="Nome" name="name" defaultValue={selected.name} required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="E-mail" name="emailAddress" type="email" defaultValue={selected.emailAddress} />
                <Field label="Telefone" name="phoneNumber" defaultValue={selected.phoneNumber} />
                <Field label="CPF" name="cpf" defaultValue={selected.cpf} />
                <Field label="Instagram" name="instagram" defaultValue={selected.instagram} />
                <Field label="CEP" name="postalCode" defaultValue={selected.postalCode} />
                <Field label="Número" name="number" defaultValue={selected.number} />
              </div>
              <Field label="Rua" name="street" defaultValue={selected.street} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Complemento" name="complement" defaultValue={selected.complement} />
                <Field label="Bairro" name="neighborhood" defaultValue={selected.neighborhood} />
                <Field label="Cidade" name="city" defaultValue={selected.city} />
                <Field label="UF" name="state" maxLength={2} defaultValue={selected.state} />
              </div>
              <Select
                label="Situação"
                name="customerStatus"
                defaultValue={selected.customerStatus ?? "Active"}
                options={[["Active", "Ativa"], ["Inactive", "Inativa"], ...(selected.customerStatus && !["Active", "Inactive"].includes(selected.customerStatus) ? [[selected.customerStatus, selected.customerStatus] as [string, string]] : [])]}
              />
              <TextArea label="Observações" name="description" defaultValue={selected.description} />
            </FormShell>
            <div className="border-t border-sand pt-3">
              <ActionButton
                action={deleteCustomer.bind(null, selected.id)}
                label="Excluir cliente"
                pendingLabel="Excluindo..."
                confirm={`Excluir ${selected.name || "esta cliente"}? Os pedidos dela continuam no sistema.`}
                className="text-sm font-medium text-bad-fg hover:underline"
              />
            </div>
          </SidePanel>
        )}
      </div>
    </div>
  );
}
