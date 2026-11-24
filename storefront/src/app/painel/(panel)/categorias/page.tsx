import type { Metadata } from "next";
import Link from "next/link";
import { deleteCategory, saveCategory } from "@/app/painel/manage-actions";
import { Check, Field, LoadError, PageHeader, rowCls, SidePanel, td, TextArea, th } from "@/components/painel/Fields";
import { ActionButton, FormShell } from "@/components/painel/FormShell";
import { EditIcon, PlusIcon } from "@/components/painel/icons";
import { getProducts } from "@/lib/painel/data";
import { getCategoriesFull } from "@/lib/painel/manage";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Categorias" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ editar?: string; nova?: string }> }) {
  const session = await requireSession();
  const { editar, nova } = await searchParams;
  const [categories, products] = await Promise.all([getCategoriesFull(session).catch(() => null), getProducts(session).catch(() => [])]);
  const selected = editar ? (categories ?? []).find((c) => c.id === editar) : undefined;
  const count = (id: string) => products.filter((p) => p.categoryId === id && p.available && !p.isSold).length;
  const showForm = !!selected || !!nova;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Categorias" subtitle="Organizam a vitrine e definem quanto espaço cada peça ocupa na caixa." action={<Link href="/painel/categorias?nova=1" className="btn-primary"><PlusIcon size={16} /> Nova categoria</Link>} />
      <LoadError show={!categories} what="as categorias" />
      <div className="flex flex-wrap items-start gap-5">
        <section className="panel min-w-0 flex-[999_1_480px] overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted">
                <th className="px-5 py-3.5 font-medium">Categoria</th>
                <th className={`${th} text-right`}>À venda</th>
                <th className={`${th} text-right`}>Pontos na caixa</th>
                <th className={th}>Situação</th>
                <th className="px-5 py-3.5"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {(categories ?? []).map((c) => (
                <tr key={c.id} className={rowCls(c.id === selected?.id)}>
                  <td className="px-5 py-3">
                    <span className="font-medium">{c.name}</span>
                    {c.description && <span className="block text-xs text-muted">{c.description}</span>}
                  </td>
                  <td className={`${td} num text-right`}>{count(c.id)}</td>
                  <td className={`${td} num text-right`}>{c.packageOccupationPoints}</td>
                  <td className={td}>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${c.isActive ? "bg-ok-bg text-ok-fg" : "bg-sand text-muted"}`}>{c.isActive ? "Ativa" : "Oculta"}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/painel/categorias?editar=${c.id}`} aria-label={`Editar ${c.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-sand"><EditIcon size={16} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories && categories.length === 0 && <p className="p-10 text-center text-sm text-muted">Nenhuma categoria ainda.</p>}
        </section>

        {showForm && (
          <SidePanel title={selected ? "Editar categoria" : "Nova categoria"} closeHref="/painel/categorias">
            <FormShell action={saveCategory} key={selected?.id ?? "nova"} resetOnSuccess={!selected}>
              {selected && <input type="hidden" name="id" value={selected.id} />}
              <Field label="Nome" name="name" defaultValue={selected?.name} required placeholder="Ex.: Vestidos" />
              <TextArea label="Descrição (opcional)" name="description" defaultValue={selected?.description} />
              <Field label="Pontos que cada peça ocupa na caixa" name="packageOccupationPoints" type="number" min={0} defaultValue={selected?.packageOccupationPoints ?? 1} />
              <p className="-mt-1.5 text-xs text-muted">Usado na escolha automática da caixa de envio: some os pontos das peças e compare com a capacidade da caixa.</p>
              <Check label="Mostrar na loja" name="isActive" defaultChecked={selected?.isActive ?? true} />
            </FormShell>
            {selected && (
              <div className="border-t border-sand pt-3">
                <ActionButton action={deleteCategory.bind(null, selected.id)} label="Excluir categoria" pendingLabel="Excluindo..." confirm={`Excluir a categoria ${selected.name}?`} className="text-sm font-medium text-bad-fg hover:underline" />
              </div>
            )}
          </SidePanel>
        )}
      </div>
    </div>
  );
}
