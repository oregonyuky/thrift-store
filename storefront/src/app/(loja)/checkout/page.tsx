import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { ProductImage } from "@/components/ProductCard";
import { money } from "@/lib/format";
import { getCartIds, getSession } from "@/lib/session";
import { getActiveBag, getAvailableProducts, getCustomer, type Product } from "@/lib/store";

export const metadata: Metadata = { title: "Finalizar compra" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) redirect("/entrar?returnUrl=/checkout");

  const ids = await getCartIds();
  const [products, customer, bag] = await Promise.all([
    getAvailableProducts().catch(() => [] as Product[]),
    getCustomer(session),
    getActiveBag(session),
  ]);
  const items = products.filter((p) => ids.includes(p.id));
  const subtotal = items.reduce((sum, p) => sum + p.price, 0);

  const c = customer ?? {};
  const cep = (c.postalCode ?? "").replace(/\D/g, "");
  const defaults = {
    firstName: c.firstName ?? session.name.split(" ")[0] ?? "",
    lastName: c.lastName ?? session.name.split(" ").slice(1).join(" "),
    cpf: c.cpf ?? "",
    email: c.emailAddress || session.email,
    phone: c.phoneNumber ?? "",
    postCode: cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : "",
    street: c.street ?? "",
    number: c.number ?? "",
    complement: c.complement ?? "",
    neighborhood: c.neighborhood ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
  };

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-5 pb-24 pt-10 md:px-8">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">Compra segura</span>
        <h1 className="font-display text-[40px] font-normal tracking-tight">Finalizar compra</h1>
      </div>

      {items.length > 0 && (
        <ul className="flex gap-3 overflow-x-auto pb-1" aria-label="Peças do pedido">
          {items.map((p, i) => (
            <li key={p.id} className="flex min-w-[240px] items-center gap-3 rounded-2xl border border-line bg-card p-2.5">
              <span className="h-16 w-[52px] shrink-0 overflow-hidden rounded-lg"><ProductImage product={p} index={i} /></span>
              <span className="flex min-w-0 flex-col text-sm">
                <span className="truncate font-medium">{p.name}</span>
                <span className="num font-bold">{money(p.price)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {/* Always mounted: after paying, the cart empties but the Pix panel must stay on screen. */}
      <CheckoutForm defaults={defaults} subtotal={subtotal} hasOpenBag={!!bag} empty={items.length === 0} />
    </div>
  );
}
