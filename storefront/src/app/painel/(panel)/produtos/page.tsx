import type { Metadata } from "next";
import Link from "next/link";
import { AvailabilitySwitch } from "@/components/painel/AvailabilitySwitch";
import { EditIcon, PlusIcon } from "@/components/painel/icons";
import { ProductForm, type ProductFormValues } from "@/components/painel/ProductForm";
import { resolveImageUrl } from "@/lib/api";
import { getCategories, getDrops, getProduct, getProducts, type ProductRow } from "@/lib/painel/data";
import { money } from "@/lib/painel/format";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Produtos" };
export const dynamic = "force-dynamic";

const situations = [
  { key: "venda", label: "À venda", test: (p: ProductRow) => p.available && !p.isSold },
  { key: "vendidas", label: "Vendidas", test: (p: ProductRow) => p.isSold },
  { key: "ocultas", label: "Fora da loja", test: (p: ProductRow) => !p.available && !p.isSold },
  { key: "todas", label: "Todas", test: () => true },
];

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; categoria?: string; drop?: string; situacao?: string; nova?: string; editar?: string; salvo?: string }> }) {
  const session = await requireSession();
  const params = await searchParams;
  const [products, categories, drops] = await Promise.all([getProducts(session).catch(() => null), getCategories(session), getDrops(session)]);
  const all = products ?? [];
  const situation = situations.find((s) => s.key === params.situacao) ?? situations[0];
  const q = (params.q ?? "").trim().toLowerCase();
  const rows = all.filter(
    (p) =>
      situation.test(p) &&
      (!params.categoria || p.categoryId === params.categoria) &&
      (!params.drop || p.dropConfigId === params.drop) &&
      (!q || p.name.toLowerCase().includes(q)),
  );

  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const forSale = all.filter((p) => p.available && !p.isSold).length;
  const sold = all.filter((p) => p.isSold).length;

  // Keep current filters when opening/closing the side form.
  const base = new URLSearchParams();
  for (const k of ["q", "categoria", "drop", "situacao"] as const) if (params[k]) base.set(k, params[k]!);
  const withParam = (k?: string, v?: string) => {
    const sp = new URLSearchParams(base);
    if (k && v) sp.set(k, v);
    const s = sp.toString();
    return s ? `/painel/produtos?${s}` : "/painel/produtos";
  };

  let formValues: ProductFormValues | null = null;
  if (params.editar) {
    const p = await getProduct(session, params.editar).catch(() => null);
    if (p) {
      const names = [p.mainImageURL, p.picture1, p.picture2, p.picture3, p.picture4].filter((n): n is string => !!n);
      const size = p.sizes?.[0];
      formValues = {
        id: p.id,
        name: p.name,
        categoryId: p.categoryID,
        dropConfigId: p.dropConfigId,
        unitPrice: p.unitPrice,
        oldPrice: p.oldPrice,
        unitWeight: p.unitWeight,
        size: size?.size,
        bust: size?.bust,
        sleeve: size?.sleeve,
        length: size?.length,
        shortDescription: p.shortDescription,
        longDescription: p.longDescription,
        altText: p.altText,
        available: p.productAvailable !== false,
        photos: names.map((name) => ({ name, url: resolveImageUrl(name) })),
      };
    }
  } else if (params.nova) {
    formValues = { photos: [] };
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[34px] font-normal tracking-tight">Produtos</h1>
          <span className="num text-sm text-muted">{forSale} à venda · {sold} vendidas</span>
        </div>
        <Link href={withParam("nova", "1")} className="btn-primary"><PlusIcon size={16} /> Nova peça</Link>
      </div>

      {params.salvo && <p role="status" className="rounded-xl bg-ok-bg px-4 py-3 text-sm text-ok-fg">Peça salva.</p>}

      <form action="/painel/produtos" className="flex flex-wrap items-center gap-2.5">
        <label className="sr-only" htmlFor="pq">Buscar peças</label>
        <input id="pq" name="q" type="search" defaultValue={params.q} placeholder="Buscar peça" className="field w-[260px] max-w-full" />
        <label className="sr-only" htmlFor="pcat">Categoria</label>
        <select id="pcat" name="categoria" defaultValue={params.categoria ?? ""} className="field w-auto">
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="sr-only" htmlFor="pdrop">Drop</label>
        <select id="pdrop" name="drop" defaultValue={params.drop ?? ""} className="field w-auto">
          <option value="">Todos os drops</option>
          {drops.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <label className="sr-only" htmlFor="psit">Situação</label>
        <select id="psit" name="situacao" defaultValue={situation.key} className="field w-auto">
          {situations.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button type="submit" className="btn-ghost">Filtrar</button>
      </form>

      {!products && <p role="alert" className="rounded-xl bg-bad-bg px-4 py-3 text-sm text-bad-fg">Não foi possível carregar as peças da API.</p>}

      <div className="flex flex-wrap items-start gap-5">
        <section className="panel min-w-0 flex-[999_1_520px] overflow-x-auto">
          <table className="rtable w-full md:min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted">
                <th className="px-5 py-3.5 font-medium">Peça</th>
                <th className="px-2 py-3.5 font-medium">Categoria</th>
                <th className="px-2 py-3.5 text-right font-medium">Preço</th>
                <th className="px-2 py-3.5 font-medium">Drop</th>
                <th className="px-2 py-3.5 font-medium">À venda</th>
                <th className="px-5 py-3.5"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className={`border-t border-sand ${params.editar === p.id ? "bg-[#fbf3ec]" : "hover:bg-[#faf6f0]"}`}>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-sand">
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span>
                        <span className="font-medium">{p.name}</span>
                        <span className="block text-xs text-muted">
                          {[p.size && `Tam. ${p.size}`, p.isSold && "vendida"].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-muted">{(p.categoryId && catName.get(p.categoryId)) || "—"}</td>
                  <td className="num px-2 py-2.5 text-right">
                    <span className="font-bold">{money(p.price)}</span>
                    {p.oldPrice && p.oldPrice > p.price && <span className="block text-xs text-muted line-through">{money(p.oldPrice)}</span>}
                  </td>
                  <td className="px-2 py-2.5 text-muted">{p.dropTitulo ?? "—"}</td>
                  <td className="px-2 py-2.5">
                    <AvailabilitySwitch productId={p.id} name={p.name} available={p.available} disabled={p.isSold} />
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <Link href={withParam("editar", p.id)} aria-label={`Editar ${p.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-sand">
                      <EditIcon size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-10 text-center text-sm text-muted">Nenhuma peça com esses filtros.</p>}
        </section>

        {formValues && (
          <ProductForm key={formValues.id ?? "new"} values={formValues} categories={categories} drops={drops} closeHref={withParam()} />
        )}
      </div>
    </div>
  );
}
