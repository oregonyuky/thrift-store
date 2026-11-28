"use client";

import { useRef, useState } from "react";
import { formatCep } from "@/components/ShippingQuote";
import { formatPhone } from "@/lib/format";
import { Field } from "./Fields";

export function PhoneField({ defaultValue }: { defaultValue?: string }) {
  const [value, setValue] = useState(formatPhone(defaultValue ?? ""));
  return (
    <Field
      label="Telefone"
      name="phoneNumber"
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      required
      placeholder="(19) 99999-0000"
      value={value}
      onChange={(e) => setValue(formatPhone(e.target.value))}
    />
  );
}

/** Splits the saved one-line address ("Rua X, 120 - Centro") back into its parts. */
function splitStreet(street = "") {
  const m = street.match(/^(.*?),\s*([^,-]+?)\s*-\s*(.+)$/);
  return m ? { rua: m[1].trim(), numero: m[2].trim(), bairro: m[3].trim() } : { rua: street.trim(), numero: "", bairro: "" };
}

type Address = { cep: string; rua: string; numero: string; complemento: string; bairro: string; city: string; state: string };

/**
 * Sender address. Typing a full CEP fills street, district, city and state from ViaCEP;
 * the parts are joined back into the single "street" line the API stores.
 */
export function SenderAddress({ street, city, state, zipCode }: { street?: string; city?: string; state?: string; zipCode?: string }) {
  const parts = splitStreet(street);
  const [a, setA] = useState<Address>({ cep: formatCep(zipCode ?? ""), ...parts, complemento: "", city: city ?? "", state: (state ?? "").toUpperCase() });
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "missing">("idle");
  const numero = useRef<HTMLInputElement>(null);
  const lastCep = useRef(a.cep.replace(/\D/g, ""));

  const lookup = async (digits: string) => {
    setStatus("loading");
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = r.ok ? await r.json() : null;
      if (!data || data.erro) return setStatus("missing");
      setA((v) => ({ ...v, rua: data.logradouro || v.rua, bairro: data.bairro || v.bairro, city: data.localidade || v.city, state: (data.uf || v.state).toUpperCase(), numero: "" }));
      setStatus("found");
      numero.current?.focus();
    } catch {
      setStatus("missing");
    }
  };

  const set = (key: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (key === "cep") {
      const cep = formatCep(raw);
      setA((v) => ({ ...v, cep }));
      const digits = cep.replace(/\D/g, "");
      if (digits.length === 8 && digits !== lastCep.current) {
        lastCep.current = digits;
        void lookup(digits);
      } else if (digits.length < 8) {
        setStatus("idle");
      }
      return;
    }
    setA((v) => ({ ...v, [key]: key === "state" ? raw.toUpperCase().slice(0, 2) : raw }));
  };

  const line = [a.rua.trim(), [a.numero.trim(), a.complemento.trim()].filter(Boolean).join(" ")].filter(Boolean).join(", ") + (a.bairro.trim() ? ` - ${a.bairro.trim()}` : "");

  return (
    <div className="flex flex-col gap-3.5">
      <input type="hidden" name="street" value={line} />
      <div className="grid gap-3.5 sm:grid-cols-[170px_1fr]">
        <div className="flex flex-col gap-1.5">
          <Field label="CEP" name="zipCode" required inputMode="numeric" autoComplete="postal-code" placeholder="13010-000" value={a.cep} onChange={set("cep")} aria-describedby="cep-status" />
          <span id="cep-status" aria-live="polite" className={`text-xs ${status === "missing" ? "text-bad-fg" : "text-muted"}`}>
            {status === "loading" ? "Buscando endereço..." : status === "found" ? "Endereço preenchido pelo CEP." : status === "missing" ? "CEP não encontrado. Preencha o endereço à mão." : "Digite o CEP para preencher o endereço."}
          </span>
        </div>
        <Field label="Rua" name="rua" required autoComplete="address-line1" value={a.rua} onChange={set("rua")} />
      </div>
      <div className="grid gap-3.5 grid-cols-[110px_1fr] sm:grid-cols-[110px_1fr_1fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-numero" className="text-[13px] font-bold">Número</label>
          <input ref={numero} id="f-numero" name="numero" required className="field" inputMode="numeric" value={a.numero} onChange={set("numero")} />
        </div>
        <Field label="Complemento (opcional)" name="complemento" value={a.complemento} onChange={set("complemento")} placeholder="Sala, loja..." />
        <Field label="Bairro" name="bairro" required className="col-span-2 sm:col-span-1" value={a.bairro} onChange={set("bairro")} />
      </div>
      <div className="grid gap-3.5 grid-cols-[1fr_90px]">
        <Field label="Cidade" name="city" required autoComplete="address-level2" value={a.city} onChange={set("city")} />
        <Field label="UF" name="state" required maxLength={2} autoComplete="address-level1" placeholder="SP" value={a.state} onChange={set("state")} />
      </div>
    </div>
  );
}
