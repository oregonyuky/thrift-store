import type { Metadata } from "next";
import Link from "next/link";
import { deletePaymentType, savePaymentType } from "@/app/painel/manage-actions";
import { Check, Field, LoadError, PageHeader, rowCls, SidePanel, td, TextArea, th } from "@/components/painel/Fields";
import { ActionButton, FormShell } from "@/components/painel/FormShell";
import { EditIcon, PlusIcon } from "@/components/painel/icons";
import { getPaymentTypes } from "@/lib/painel/manage";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Formas de pagamento" };
export const dynamic = "force-dynamic";

export default async function PaymentTypesPage({ searchParams }: { searchParams: Promise<{ editar?: string; nova?: string }> }) {
  const session = await requireSession();
  const { editar, nova } = await searchParams;
  const types = await getPaymentTypes(session).catch(() => null);
  const selected = editar ? (types ?? []).find((p) => p.id === editar) : undefined;
  const showForm = !!selected || !!nova;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Formas de pagamento"
        subtitle="Aparecem no registro de cada pedido. Hoje a loja recebe pelo Pix do Mercado Pago."
        action={<Link href="/painel/pagamentos?nova=1" className="btn-primary"><PlusIcon size={16} /> Nova forma</Link>}
      />
      <LoadError show={!types} what="as formas de pagamento" />
      <div className="flex flex-wrap items-start gap-5">
        <section className="panel min-w-0 flex-[999_1_480px] overflow-x-auto">
          <table className="rtable w-full md:min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted">
                <th className="px-5 py-3.5 font-medium">Forma</th>
                <th className={th}>Situação</th>
                <th className="px-5 py-3.5"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {(types ?? []).map((p) => (
                <tr key={p.id} className={rowCls(p.id === selected?.id)}>
                  <td className="px-5 py-3">
                    <span className="font-medium">{p.typeName}</span>
                    {p.description && <span className="block text-xs text-muted">{p.description}</span>}
                  </td>
                  <td className={td}>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.isActive ? "bg-ok-bg text-ok-fg" : "bg-sand text-muted"}`}>{p.isActive ? "Ativa" : "Inativa"}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/painel/pagamentos?editar=${p.id}`} aria-label={`Editar ${p.typeName}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-sand"><EditIcon size={16} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {types && types.length === 0 && <p className="p-10 text-center text-sm text-muted">Nenhuma forma de pagamento cadastrada.</p>}
        </section>

        {showForm && (
          <SidePanel title={selected ? "Editar forma de pagamento" : "Nova forma de pagamento"} closeHref="/painel/pagamentos">
            <FormShell action={savePaymentType} key={selected?.id ?? "nova"} resetOnSuccess={!selected}>
              {selected && <input type="hidden" name="id" value={selected.id} />}
              <Field label="Nome" name="typeName" defaultValue={selected?.typeName} required placeholder="Ex.: Pix" />
              <TextArea label="Descrição (opcional)" name="description" defaultValue={selected?.description} />
              <Check label="Ativa" name="isActive" defaultChecked={selected?.isActive ?? true} />
            </FormShell>
            {selected && (
              <div className="border-t border-sand pt-3">
                <ActionButton action={deletePaymentType.bind(null, selected.id)} label="Excluir forma de pagamento" pendingLabel="Excluindo..." confirm={`Excluir ${selected.typeName}? Pedidos antigos continuam mostrando o nome.`} className="text-sm font-medium text-bad-fg hover:underline" />
              </div>
            )}
          </SidePanel>
        )}
      </div>
    </div>
  );
}
