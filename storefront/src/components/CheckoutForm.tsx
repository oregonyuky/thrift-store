"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { placeOrder, type CheckoutState } from "@/app/actions";
import { formatPhone, money } from "@/lib/format";
import { formatCep } from "./ShippingQuote";
import { PixPanel } from "./PixPanel";
import { SubmitButton } from "./SubmitButton";

export interface CheckoutDefaults {
  firstName: string;
  lastName: string;
  cpf: string;
  email: string;
  phone: string;
  postCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

function Field({ label, name, error, className = "", ...rest }: { label: string; name: string; error?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `co-${name}`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-bold">{label}</label>
      <input id={id} name={name} className="field" aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...rest} />
      {error && <span id={`${id}-err`} className="text-[13px] text-bad-fg">{error}</span>}
    </div>
  );
}

const formatCpf = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export function CheckoutForm({ defaults, subtotal, hasOpenBag, empty }: { defaults: CheckoutDefaults; subtotal: number; hasOpenBag: boolean; empty: boolean }) {
  const [state, action] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const [mode, setMode] = useState<"normal" | "bag">(hasOpenBag ? "bag" : "normal");
  const [values, setValues] = useState(() => ({ ...defaults, cpf: formatCpf(defaults.cpf), phone: formatPhone(defaults.phone) }));
  const [shipping, setShipping] = useState<{ cost?: number; error?: string; loading?: boolean }>({});
  const fe = state.fieldErrors ?? {};

  const set = (key: keyof CheckoutDefaults) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: key === "postCode" ? formatCep(e.target.value) : key === "cpf" ? formatCpf(e.target.value) : key === "phone" ? formatPhone(e.target.value) : e.target.value }));

  const cepDigits = values.postCode.replace(/\D/g, "");
  const total = subtotal + (mode === "normal" ? shipping.cost ?? 0 : 0);

  // After a failed submit, take the customer to the first field to fix (on phones it is far up).
  useEffect(() => {
    const first = Object.keys(state.fieldErrors ?? {})[0];
    if (!first) return;
    const el = document.getElementById(`co-${first}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  }, [state.fieldErrors]);

  // Fill the address from ViaCEP and quote shipping once the CEP is complete.
  useEffect(() => {
    if (cepDigits.length !== 8) return;
    let cancelled = false;
    fetch(`https://viacep.com.br/ws/${cepDigits}/json/`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || data.erro) return;
        setValues((v) => ({
          ...v,
          street: v.street || data.logradouro || "",
          neighborhood: v.neighborhood || data.bairro || "",
          city: v.city || data.localidade || "",
          state: v.state || data.uf || "",
        }));
      })
      .catch(() => undefined);

    setShipping({ loading: true });
    fetch("/api/frete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postCode: cepDigits }) })
      .then(async (r) => {
        const data = await r.json();
        if (cancelled) return;
        setShipping(r.ok ? { cost: data.shippingCost } : { error: data.message });
      })
      .catch(() => !cancelled && setShipping({ error: "Não foi possível calcular o frete." }));
    return () => {
      cancelled = true;
    };
  }, [cepDigits]);

  useEffect(() => {
    if (state.result?.paymentUrl && !state.result.qrImage && !state.result.pixCode) {
      window.location.href = state.result.paymentUrl;
    }
    if (state.result) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.result]);

  if (state.result && (state.result.qrImage || state.result.pixCode)) {
    return <PixPanel data={state.result} />;
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[18px] border border-dashed border-line px-6 py-14 text-center">
        <p className="font-display text-2xl italic">Seu carrinho está vazio.</p>
        <Link href="/#pecas" className="btn-primary">Garimpar peças</Link>
      </div>
    );
  }

  const option = (value: "normal" | "bag", title: string, body: string) => (
    <label className={`flex cursor-pointer gap-3 rounded-2xl border-[1.5px] p-4 transition ${mode === value ? "border-ink bg-card" : "border-line bg-card/60 hover:border-[#cbbcab]"}`}>
      <input type="radio" name="deliveryMode" value={value} checked={mode === value} onChange={() => setMode(value)} className="mt-1 accent-[#a9493a]" />
      <span className="flex flex-col gap-1">
        <span className="font-bold">{title}</span>
        <span className="text-sm leading-snug text-muted">{body}</span>
      </span>
    </label>
  );

  return (
    <form action={action} className="grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]" noValidate>
      <div className="flex flex-col gap-8">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-display text-2xl">1. Seus dados</legend>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4">
            <Field label="Nome" name="firstName" autoComplete="given-name" value={values.firstName} onChange={set("firstName")} error={fe.firstName} required />
            <Field label="Sobrenome" name="lastName" autoComplete="family-name" value={values.lastName} onChange={set("lastName")} error={fe.lastName} required />
            <Field className="col-span-2 sm:col-span-1" label="E-mail" name="email" type="email" autoComplete="email" value={values.email} onChange={set("email")} error={fe.email} required />
            <Field className="col-span-2 sm:col-span-1" label="Telefone com DDD" name="phone" type="tel" placeholder="(19) 99999-0000" autoComplete="tel" value={values.phone} onChange={set("phone")} error={fe.phone} required />
            <Field className="col-span-2 sm:col-span-1" label="CPF (para o Pix)" name="cpf" inputMode="numeric" value={values.cpf} onChange={set("cpf")} error={fe.cpf} required />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-display text-2xl">2. Endereço de entrega</legend>
          <div className="grid grid-cols-6 gap-x-3 gap-y-4 sm:gap-x-4">
            <Field className="col-span-6 sm:col-span-2" label="CEP" name="postCode" inputMode="numeric" autoComplete="postal-code" value={values.postCode} onChange={set("postCode")} error={fe.postCode} required />
            <Field className="col-span-6 sm:col-span-4" label="Rua" name="street" autoComplete="address-line1" value={values.street} onChange={set("street")} error={fe.street} required />
            <Field className="col-span-2" label="Número" name="number" value={values.number} onChange={set("number")} error={fe.number} required />
            <Field className="col-span-4" label="Complemento" placeholder="Opcional" name="complement" autoComplete="address-line2" value={values.complement} onChange={set("complement")} />
            <Field className="col-span-6 sm:col-span-3" label="Bairro" name="neighborhood" value={values.neighborhood} onChange={set("neighborhood")} error={fe.neighborhood} required />
            <Field className="col-span-4 sm:col-span-2" label="Cidade" name="city" autoComplete="address-level2" value={values.city} onChange={set("city")} error={fe.city} required />
            <Field className="col-span-2 sm:col-span-1" label="UF" name="state" maxLength={2} autoComplete="address-level1" value={values.state} onChange={set("state")} error={fe.state} required />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-4 font-display text-2xl">3. Como você quer receber?</legend>
          {option("normal", "Envio normal", "Finalize o pedido e receba esta compra agora.")}
          {option(
            "bag",
            hasOpenBag ? "Juntar na minha sacolinha" : "Sacolinha",
            hasOpenBag
              ? "Você já tem uma sacolinha aberta: estas peças vão junto, sem frete novo agora."
              : "Pague agora e vá juntando peças. Tudo viaja junto no fim do prazo, com um frete só.",
          )}
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="co-notes" className="text-[13px] font-bold">Observações (opcional)</label>
          <textarea id="co-notes" name="notes" rows={3} className="field !h-auto py-3" />
        </div>
      </div>

      <aside className="flex flex-col gap-4 rounded-[18px] border border-line bg-card p-5 lg:sticky lg:top-6">
        <h2 className="font-display text-2xl">Resumo</h2>
        <dl className="num flex flex-col gap-2 text-[15px]">
          <div className="flex justify-between"><dt className="text-muted">Peças</dt><dd>{money(subtotal)}</dd></div>
          <div className="flex justify-between">
            <dt className="text-muted">Frete</dt>
            <dd>
              {mode === "bag"
                ? "No fechamento da sacolinha"
                : shipping.loading
                  ? "Calculando…"
                  : shipping.cost !== undefined
                    ? shipping.cost > 0 ? money(shipping.cost) : "Grátis"
                    : "Informe o CEP"}
            </dd>
          </div>
          {mode === "normal" && shipping.error && <p className="text-[13px] text-bad-fg">{shipping.error}</p>}
          <div className="mt-2 flex justify-between border-t border-line pt-3 text-lg font-bold">
            <dt>Total estimado</dt>
            <dd>{money(total)}</dd>
          </div>
        </dl>
        <p className="rounded-xl bg-paper px-3.5 py-3 text-[13px] text-muted">Pagamento via Pix com QR Code do Mercado Pago. O valor final aparece no app do seu banco.</p>
        {state.error && <p role="alert" className="rounded-xl bg-bad-bg px-3.5 py-3 text-sm text-bad-fg">{state.error}</p>}
        <SubmitButton className="btn-primary hidden min-h-14 text-base lg:inline-flex" pending="Gerando seu Pix...">Pagar no Pix</SubmitButton>
      </aside>

      {/* Phones: total and pay button always within reach. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 shadow-[0_-8px_24px_rgba(42,31,30,0.08)] backdrop-blur lg:hidden">
        {(state.error || Object.keys(fe).length > 0) && (
          <p role="alert" className="mb-2 text-[13px] font-medium text-bad-fg">{state.error ?? "Confira os campos destacados."}</p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-xs text-muted">{mode === "bag" ? "Total (frete no fechamento)" : shipping.cost === undefined ? "Total sem frete" : "Total"}</span>
            <span className="num text-lg font-bold leading-tight">{money(total)}</span>
          </div>
          <SubmitButton className="btn-primary min-h-12 flex-1 text-base" pending="Gerando Pix...">Pagar no Pix</SubmitButton>
        </div>
      </div>
    </form>
  );
}
