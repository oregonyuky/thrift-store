import type { Metadata } from "next";
import Link from "next/link";
import { removeFromCart } from "@/app/actions";
import { CartTabs, FinalizeBagButton } from "@/components/CartTabs";
import { CheckIcon, CloseIcon } from "@/components/icons";
import { ProductImage } from "@/components/ProductCard";
import { ShippingQuote } from "@/components/ShippingQuote";
import { dateTime, money } from "@/lib/format";
import { getCartIds, getSession } from "@/lib/session";
import { getActiveBag, getProducts, type Product } from "@/lib/store";

export const metadata: Metadata = { title: "Carrinho e sacolinha" };
export const dynamic = "force-dynamic";

export default async function CartPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  const [ids, session] = await Promise.all([getCartIds(), getSession()]);
  const [products, bag] = await Promise.all([
    ids.length ? getProducts().catch(() => [] as Product[]) : Promise.resolve([] as Product[]),
    getActiveBag(session),
  ]);
  const items = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);
  const available = items.filter((p) => p.available);
  const subtotal = available.reduce((sum, p) => sum + p.price, 0);

  const cart = (
    <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-3.5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[18px] border border-dashed border-line px-6 py-14 text-center">
            <p className="font-display text-2xl italic">Seu carrinho está vazio.</p>
            <Link href="/#pecas" className="btn-primary">Garimpar peças</Link>
          </div>
        ) : (
          items.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-line bg-card p-3">
              <Link href={`/produto/${p.id}`} className="h-[96px] w-[78px] shrink-0 overflow-hidden rounded-[10px]">
                <ProductImage product={p} index={i} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link href={`/produto/${p.id}`} className="font-medium hover:text-terra">{p.name}</Link>
                <span className="text-[13px] text-muted">
                  {p.sizes[0]?.size ? `Tam. ${p.sizes[0].size} · ` : ""}peça única
                </span>
                {p.available ? (
                  <span className="num font-bold">{money(p.price)}</span>
                ) : (
                  <span className="text-sm font-bold text-bad-fg">Garimpada por outra pessoa — remova do carrinho</span>
                )}
              </div>
              <form action={removeFromCart.bind(null, p.id)}>
                <button type="submit" aria-label={`Remover ${p.name}`} className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink">
                  <CloseIcon size={18} />
                </button>
              </form>
            </div>
          ))
        )}
        {bag && items.length > 0 && (
          <p className="flex items-start gap-2.5 rounded-[14px] bg-ok-bg px-3.5 py-3 text-[13px] leading-snug text-ok-fg">
            <CheckIcon size={18} className="mt-px shrink-0" />
            Você tem uma sacolinha aberta: no checkout, escolha “Sacolinha” para estas peças irem junto, sem frete novo.
          </p>
        )}
      </div>

      {available.length > 0 && (
        <aside className="flex flex-col gap-4 rounded-[18px] border border-line bg-card p-5">
          <ShippingQuote compact />
          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-[15px] text-muted">Subtotal</span>
            <span className="num text-2xl font-bold">{money(subtotal)}</span>
          </div>
          <Link href={session ? "/checkout" : "/entrar?returnUrl=/checkout"} className="btn-primary min-h-14 text-base">
            {session ? "Continuar para o pagamento" : "Entrar para finalizar"}
          </Link>
          <p className="text-center text-xs text-muted">Pagamento no Pix. O frete é confirmado no checkout.</p>
        </aside>
      )}
    </div>
  );

  const bagPanel = !session ? (
    <div className="flex flex-col items-start gap-4 rounded-[18px] border border-line bg-card p-6">
      <p className="text-[15px] text-muted">Entre na sua conta para ver as peças guardadas na sua sacolinha.</p>
      <Link href={`/entrar?returnUrl=${encodeURIComponent("/carrinho?aba=sacolinha")}`} className="btn-primary">Entrar</Link>
    </div>
  ) : !bag ? (
    <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-card p-6">
      <p className="font-display text-2xl italic">Nenhuma sacolinha aberta.</p>
      <p className="text-[15px] leading-relaxed text-muted">
        No checkout, escolha “Sacolinha”: você paga a peça agora e ela fica guardada. Tudo o que comprar até o prazo viaja junto, com um frete só.
      </p>
    </div>
  ) : (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-1.5 rounded-[18px] bg-ink p-6 text-paper">
        <span className="text-xs uppercase tracking-[0.16em] text-blush">Sacolinha aberta</span>
        <span className="font-display text-[28px]">
          {bag.expirationDate ? `Fecha em ${dateTime(bag.expirationDate)}` : "Aberta"}
        </span>
        <span className="text-sm text-[#d9ccc2]">Até lá, tudo o que você comprar viaja junto.</span>
        <div className="mt-4 flex items-baseline justify-between border-t border-[#4a3b38] pt-4">
          <span className="text-sm text-[#d9ccc2]">{bag.itemCount} {bag.itemCount === 1 ? "peça" : "peças"} guardadas</span>
          <span className="num text-xl font-bold">{money(bag.totalItemsValue)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2.5">
          {bag.items.map((item, i) => (
            <div key={`${item.productId}-${i}`} className="flex flex-col gap-1.5">
              <div className="aspect-[4/5] overflow-hidden rounded-xl">
                <ProductImage product={{ imageUrl: item.imageUrl, name: item.name }} index={i + 3} />
              </div>
              <span className="truncate text-xs text-muted">{item.isPaid ? "Paga" : "Aguardando pagamento"}</span>
            </div>
          ))}
        </div>
        <FinalizeBagButton bagId={bag.id} />
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-5 pb-24 pt-10 md:px-8">
      <h1 className="font-display text-[40px] font-normal tracking-tight">Suas peças</h1>
      <CartTabs cartCount={items.length} bagCount={bag ? bag.itemCount : session ? 0 : null} cart={cart} bag={bagPanel} startOnBag={aba === "sacolinha"} />
    </div>
  );
}
