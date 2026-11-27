import type { Metadata } from "next";
import Link from "next/link";
import { deactivatePackageCategory, deleteShippingBox, savePackageCategory, saveShippingBox } from "@/app/painel/manage-actions";
import { Check, Field, LoadError, PageHeader, rowCls, Select, SidePanel, td, TextArea, th } from "@/components/painel/Fields";
import { ActionButton, FormShell } from "@/components/painel/FormShell";
import { EditIcon, PlusIcon } from "@/components/painel/icons";
import { money } from "@/lib/painel/format";
import { getPackageCategories, getShippingBoxes } from "@/lib/painel/manage";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Caixas e embalagens" };
export const dynamic = "force-dynamic";

const n = (v?: number | null) => (v == null ? "" : String(v).replace(".", ","));
const dims = (b: { width?: number; length?: number; height?: number }) =>
  [b.length, b.width, b.height].every((v) => v != null) ? `${n(b.length)} × ${n(b.width)} × ${n(b.height)} cm` : "—";

export default async function ShippingPage({ searchParams }: { searchParams: Promise<{ caixa?: string; categoria?: string }> }) {
  const session = await requireSession();
  const { caixa, categoria } = await searchParams;
  const [boxes, cats] = await Promise.all([getShippingBoxes(session).catch(() => null), getPackageCategories(session).catch(() => null)]);
  const box = caixa && caixa !== "nova" ? (boxes ?? []).find((b) => b.id === caixa) : undefined;
  const cat = categoria && categoria !== "nova" ? (cats ?? []).find((c) => c.id === categoria) : undefined;
  const catOptions: Array<[string, string]> = [["", "Escolha..."], ...(cats ?? []).filter((c) => c.isActive || c.id === box?.packageCategoryId).map((c): [string, string] => [c.id, `${c.name} (${c.capacityPoints} pontos)`])];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Caixas e embalagens" subtitle="O sistema escolhe a menor caixa em que as peças do pedido cabem." />
      <LoadError show={!boxes || !cats} what="as caixas" />

      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
          <section className="panel overflow-x-auto">
            <div className="flex items-center justify-between px-5 pt-4">
              <h2 className="text-base font-bold">Caixas</h2>
              <Link href="/painel/envio?caixa=nova" className="btn-ghost"><PlusIcon size={14} /> Nova caixa</Link>
            </div>
            <table className="rtable mt-2 w-full md:min-w-[620px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted">
                  <th className="px-5 py-3 font-medium">Caixa</th>
                  <th className={th}>Medidas</th>
                  <th className={`${th} text-right`}>Capacidade</th>
                  <th className={`${th} text-right`}>Estoque</th>
                  <th className="px-5 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {(boxes ?? []).map((b) => (
                  <tr key={b.id} className={rowCls(b.id === box?.id)}>
                    <td className="px-5 py-3">
                      <span className="font-medium">{b.name}</span>
                      {!b.isActive && <span className="ml-2 rounded-full bg-sand px-2 py-0.5 text-[11px] text-muted">inativa</span>}
                      <span className="block text-xs text-muted">{b.packageCategoryName ?? "Sem categoria"}</span>
                    </td>
                    <td className={`${td} num text-muted`}>{dims(b)}</td>
                    <td className={`${td} num text-right`}>{b.capacityPoints} pts{b.maxWeight ? ` · até ${n(b.maxWeight)} kg` : ""}</td>
                    <td className={`${td} num text-right ${b.stockQuantity <= 2 ? "font-bold text-warn-fg" : ""}`}>{b.stockQuantity}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/painel/envio?caixa=${b.id}`} aria-label={`Editar ${b.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-sand"><EditIcon size={16} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {boxes && boxes.length === 0 && <p className="p-8 text-center text-sm text-muted">Nenhuma caixa cadastrada.</p>}
          </section>

          <section className="panel overflow-x-auto">
            <div className="flex items-center justify-between px-5 pt-4">
              <h2 className="text-base font-bold">Categorias de embalagem</h2>
              <Link href="/painel/envio?categoria=nova" className="btn-ghost"><PlusIcon size={14} /> Nova categoria</Link>
            </div>
            <table className="rtable mt-2 w-full md:min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted">
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className={`${th} text-right`}>Capacidade</th>
                  <th className={th}>Situação</th>
                  <th className="px-5 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {(cats ?? []).map((c) => (
                  <tr key={c.id} className={rowCls(c.id === cat?.id)}>
                    <td className="px-5 py-3">
                      <span className="font-medium">{c.name}</span>
                      {c.description && <span className="block text-xs text-muted">{c.description}</span>}
                    </td>
                    <td className={`${td} num text-right`}>{c.capacityPoints} pts</td>
                    <td className={td}><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${c.isActive ? "bg-ok-bg text-ok-fg" : "bg-sand text-muted"}`}>{c.isActive ? "Ativa" : "Inativa"}</span></td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/painel/envio?categoria=${c.id}`} aria-label={`Editar ${c.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-sand"><EditIcon size={16} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {(box || caixa === "nova") && (
          <SidePanel title={box ? "Editar caixa" : "Nova caixa"} closeHref="/painel/envio">
            <FormShell action={saveShippingBox} key={box?.id ?? "nova"} resetOnSuccess={!box}>
              {box && <input type="hidden" name="id" value={box.id} />}
              <Field label="Nome" name="name" defaultValue={box?.name} required placeholder="Ex.: Caixa P" />
              <Select label="Categoria de embalagem" name="packageCategoryId" defaultValue={box?.packageCategoryId ?? ""} options={catOptions} required />
              <div className="grid grid-cols-3 gap-3">
                <Field label="Compr. (cm)" name="length" inputMode="decimal" defaultValue={n(box?.length)} />
                <Field label="Largura (cm)" name="width" inputMode="decimal" defaultValue={n(box?.width)} />
                <Field label="Altura (cm)" name="height" inputMode="decimal" defaultValue={n(box?.height)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Peso da caixa (kg)" name="weight" inputMode="decimal" defaultValue={n(box?.weight)} />
                <Field label="Peso máximo (kg)" name="maxWeight" inputMode="decimal" defaultValue={n(box?.maxWeight)} />
                <Field label="Valor do seguro (R$)" name="insuranceValue" inputMode="decimal" defaultValue={n(box?.insuranceValue)} />
                <Field label="Estoque" name="stockQuantity" type="number" min={0} defaultValue={box?.stockQuantity ?? 0} />
              </div>
              {box?.insuranceValue !== undefined && <p className="-mt-1.5 text-xs text-muted">Seguro atual: {money(box.insuranceValue)}</p>}
              <Check label="Caixa ativa" name="isActive" defaultChecked={box?.isActive ?? true} />
            </FormShell>
            {box && (
              <div className="border-t border-sand pt-3">
                {box.isInUse ? (
                  <p className="text-xs text-muted">Esta caixa já foi usada em pedidos; para tirá-la de uso, desmarque “Caixa ativa”.</p>
                ) : (
                  <ActionButton action={deleteShippingBox.bind(null, box.id)} label="Excluir caixa" pendingLabel="Excluindo..." confirm={`Excluir a caixa ${box.name}?`} className="text-sm font-medium text-bad-fg hover:underline" />
                )}
              </div>
            )}
          </SidePanel>
        )}

        {(cat || categoria === "nova") && !box && caixa !== "nova" && (
          <SidePanel title={cat ? "Editar categoria de embalagem" : "Nova categoria de embalagem"} closeHref="/painel/envio">
            <FormShell action={savePackageCategory} key={cat?.id ?? "nova"} resetOnSuccess={!cat}>
              {cat && <input type="hidden" name="id" value={cat.id} />}
              <Field label="Nome" name="name" defaultValue={cat?.name} required placeholder="Ex.: Pequena" />
              <Field label="Capacidade (pontos)" name="capacityPoints" type="number" min={0} defaultValue={cat?.capacityPoints ?? 0} />
              <TextArea label="Descrição (opcional)" name="description" defaultValue={cat?.description} />
              <Check label="Ativa" name="isActive" defaultChecked={cat?.isActive ?? true} />
            </FormShell>
            {cat?.isActive && (
              <div className="border-t border-sand pt-3">
                <ActionButton action={deactivatePackageCategory.bind(null, cat.id)} label="Desativar categoria" pendingLabel="Desativando..." confirm={`Desativar ${cat.name}?`} className="text-sm font-medium text-bad-fg hover:underline" />
              </div>
            )}
          </SidePanel>
        )}
      </div>
    </div>
  );
}
