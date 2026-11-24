import type { Metadata } from "next";
import Link from "next/link";
import { deleteDrop, saveDrop } from "@/app/painel/manage-actions";
import { Check, Field, LoadError, PageHeader, rowCls, SidePanel, td, th } from "@/components/painel/Fields";
import { ActionButton, FormShell } from "@/components/painel/FormShell";
import { EditIcon, PlusIcon } from "@/components/painel/icons";
import { getProducts } from "@/lib/painel/data";
import { getDropsFull } from "@/lib/painel/manage";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Drops" };
export const dynamic = "force-dynamic";

function brasilia(value?: string) {
  if (!value) return "—";
  const [d, t] = value.split("T");
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y} às ${t?.slice(0, 5)}`;
}

export default async function DropsPage({ searchParams }: { searchParams: Promise<{ editar?: string; novo?: string }> }) {
  const session = await requireSession();
  const { editar, novo } = await searchParams;
  const [drops, products] = await Promise.all([getDropsFull(session).catch(() => null), getProducts(session).catch(() => [])]);
  const selected = editar ? (drops ?? []).find((d) => d.id === editar) : undefined;
  const stats = (id: string) => {
    const list = products.filter((p) => p.dropConfigId === id);
    return { total: list.length, sold: list.filter((p) => p.isSold).length };
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Drops"
        subtitle="Lançamentos com data marcada. A home da loja mostra a contagem regressiva do drop ativo."
        action={<Link href="/painel/drops?novo=1" className="btn-primary"><PlusIcon size={16} /> Novo drop</Link>}
      />
      <LoadError show={!drops} what="os drops" />
      <div className="flex flex-wrap items-start gap-5">
        <section className="panel min-w-0 flex-[999_1_480px] overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted">
                <th className="px-5 py-3.5 font-medium">Drop</th>
                <th className={th}>Liberação (Brasília)</th>
                <th className={`${th} text-right`}>Peças</th>
                <th className={th}>Situação</th>
                <th className="px-5 py-3.5"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {(drops ?? []).map((d) => {
                const s = stats(d.id);
                return (
                  <tr key={d.id} className={rowCls(d.id === selected?.id)}>
                    <td className="px-5 py-3">
                      <span className="font-medium">{d.titulo}</span>
                      {d.subtitulo && <span className="block max-w-[320px] truncate text-xs text-muted">{d.subtitulo}</span>}
                    </td>
                    <td className={`${td} num text-muted`}>{brasilia(d.dataLiberacao)}</td>
                    <td className={`${td} num text-right`}>{s.sold}/{s.total} vendidas</td>
                    <td className={td}>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${d.ativo ? "bg-ok-bg text-ok-fg" : "bg-sand text-muted"}`}>{d.ativo ? "Ativo" : "Inativo"}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/painel/drops?editar=${d.id}`} aria-label={`Editar ${d.titulo}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-sand"><EditIcon size={16} /></Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {drops && drops.length === 0 && <p className="p-10 text-center text-sm text-muted">Nenhum drop criado.</p>}
        </section>

        {(selected || novo) && (
          <SidePanel title={selected ? "Editar drop" : "Novo drop"} closeHref="/painel/drops">
            <FormShell action={saveDrop} key={selected?.id ?? "novo"} resetOnSuccess={!selected}>
              {selected && <input type="hidden" name="id" value={selected.id} />}
              <Field label="Título" name="titulo" defaultValue={selected?.titulo} required placeholder="Ex.: Drop Verão" />
              <Field label="Subtítulo (opcional)" name="subtitulo" defaultValue={selected?.subtitulo} placeholder="Aparece na home, abaixo do título" />
              <Field label="Data e hora de liberação (horário de Brasília)" name="dataLiberacao" type="datetime-local" defaultValue={selected?.dataLiberacao} required />
              <Check label="Drop ativo" name="ativo" defaultChecked={selected?.ativo ?? true} />
              <p className="-mt-1.5 text-xs text-muted">Para colocar peças no drop, escolha o drop no cadastro da peça em Produtos.</p>
            </FormShell>
            {selected && (
              <div className="border-t border-sand pt-3">
                <ActionButton action={deleteDrop.bind(null, selected.id)} label="Excluir drop" pendingLabel="Excluindo..." confirm={`Excluir o drop ${selected.titulo}?`} className="text-sm font-medium text-bad-fg hover:underline" />
              </div>
            )}
          </SidePanel>
        )}
      </div>
    </div>
  );
}
