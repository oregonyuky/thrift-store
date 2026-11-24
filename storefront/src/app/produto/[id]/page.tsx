import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addToCartAndGo, buyNow } from "@/app/actions";
import { Gallery } from "@/components/Gallery";
import { ClockIcon } from "@/components/icons";
import { ShippingQuote } from "@/components/ShippingQuote";
import { SubmitButton } from "@/components/SubmitButton";
import { discountPercent, money } from "@/lib/format";
import { getCartIds, getSession } from "@/lib/session";
import { getCategories, getProduct } from "@/lib/store";

export const dynamic = "force-dynamic";

async function load(id: string) {
  const session = await getSession();
  return getProduct(decodeURIComponent(id), session).catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const product = await load((await params).id);
  return { title: product?.name ?? "Peça", description: product?.shortDescription };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, cart] = await Promise.all([load(id), getCategories(), getCartIds()]);
  if (!product) notFound();

  const category = categories.find((c) => c.id === product.categoryId);
  const off = discountPercent(product.price, product.oldPrice);
  const inCart = cart.includes(product.id);
  const size = product.sizes[0];
  const measures = product.sizes.filter((s) => s.bust || s.sleeve || s.length);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-7 px-5 pb-24 pt-8 md:px-8 md:pt-10">
      <nav aria-label="Você está em" className="flex flex-wrap gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-terra">Início</Link>
        <span aria-hidden="true">/</span>
        {category && (
          <>
            <Link href={`/?categoryId=${category.id}#pecas`} className="hover:text-terra">{category.name}</Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid items-start gap-10 md:grid-cols-[1.15fr_1fr] md:gap-16">
        <Gallery pictures={product.pictures} name={product.altText || product.name} badge={off > 0 ? `-${off}%` : undefined} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            {product.available ? (
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-ok-bg px-3 py-1.5 text-[13px] font-bold text-ok-fg">
                <ClockIcon size={14} /> Peça única · disponível agora
              </span>
            ) : (
              <span className="self-start rounded-full bg-sand px-3 py-1.5 text-[13px] font-bold text-muted">Garimpada — já tem dona</span>
            )}
            <h1 className="font-display text-[40px] font-normal leading-[1.02] tracking-tight md:text-[52px]">{product.name}</h1>
            <div className="flex items-baseline gap-3">
              <span className="num text-[30px] font-bold">{money(product.price)}</span>
              {off > 0 && <span className="num text-lg text-muted line-through">{money(product.oldPrice)}</span>}
            </div>
            {product.shortDescription && <p className="text-[15px] leading-relaxed text-muted">{product.shortDescription}</p>}
          </div>

          {(size?.size || category) && (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {size?.size && (
                <div className="rounded-[14px] border border-line bg-card px-4 py-3.5">
                  <dt className="text-xs uppercase tracking-[0.08em] text-muted">Tamanho</dt>
                  <dd className="mt-1 text-lg font-bold">{size.size}</dd>
                </div>
              )}
              {category && (
                <div className="rounded-[14px] border border-line bg-card px-4 py-3.5">
                  <dt className="text-xs uppercase tracking-[0.08em] text-muted">Categoria</dt>
                  <dd className="mt-1 text-lg font-bold">{category.name}</dd>
                </div>
              )}
            </dl>
          )}

          {product.available && (
            <div className="flex flex-col gap-2.5">
              {inCart ? (
                <Link href="/checkout" className="btn-primary min-h-[58px] text-base">Finalizar compra</Link>
              ) : (
                <form action={buyNow.bind(null, product.id)}>
                  <SubmitButton className="btn-primary min-h-[58px] w-full text-base" pending="Separando sua peça...">Comprar agora no Pix</SubmitButton>
                </form>
              )}
              {inCart ? (
                <Link href="/carrinho" className="btn-ghost">Já está no seu carrinho — ver carrinho</Link>
              ) : (
                <form action={addToCartAndGo.bind(null, product.id)}>
                  <SubmitButton className="btn-ghost w-full" pending="Adicionando...">Adicionar ao carrinho</SubmitButton>
                </form>
              )}
              <p className="mt-1 text-center text-[13px] text-muted">
                No checkout você escolhe: envio na hora ou guardar na sacolinha e mandar tudo junto.
              </p>
            </div>
          )}

          {product.available && <ShippingQuote productIds={[product.id]} />}

          <div className="flex flex-col border-t border-line">
            {product.longDescription && (
              <details open className="border-b border-line py-[18px]">
                <summary className="cursor-pointer text-base font-bold">Sobre a peça</summary>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted">{product.longDescription}</p>
              </details>
            )}
            {measures.length > 0 && (
              <details className="border-b border-line py-[18px]">
                <summary className="cursor-pointer text-base font-bold">Medidas</summary>
                <ul className="mt-3 flex flex-col gap-1 text-[15px] text-muted">
                  {measures.map((m, i) => (
                    <li key={m.id ?? i} className="num">
                      {m.size ? `Tam. ${m.size}: ` : ""}
                      {[m.bust && `Busto ${m.bust} cm`, m.sleeve && `Manga ${m.sleeve} cm`, m.length && `Comprimento ${m.length} cm`].filter(Boolean).join(" · ")}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <details className="border-b border-line py-[18px]">
              <summary className="cursor-pointer text-base font-bold">Trocas e envio</summary>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                Troca em até 7 dias. Frete grátis acima de R$ 150. Dúvidas? <Link href="/fale-conosco" className="underline">Fale com a gente</Link>.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
