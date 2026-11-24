"use client";

import { useId, useState } from "react";
import { money } from "@/lib/format";

interface Quote {
  shippingCost: number;
  carrierName?: string;
  packageName?: string;
}

export function formatCep(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function ShippingQuote({ productIds, compact = false }: { productIds?: string[]; compact?: boolean }) {
  const id = useId();
  const [cep, setCep] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setQuote(null);
    if (cep.replace(/\D/g, "").length !== 8) {
      setError("Digite os 8 números do CEP.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postCode: cep, productIds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Não foi possível calcular o frete.");
      setQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível calcular o frete.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={calculate} className={`flex flex-col gap-3 ${compact ? "" : "rounded-[18px] border border-line bg-card p-5"}`}>
      <label htmlFor={id} className="text-[15px] font-bold">Calcular frete e prazo</label>
      <div className="flex gap-2.5">
        <input
          id={id}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => setCep(formatCep(e.target.value))}
          className="field !h-12 flex-1 !bg-paper"
        />
        <button type="submit" disabled={loading} className="h-12 rounded-xl bg-ink px-5 font-bold text-paper disabled:opacity-60">
          {loading ? "..." : "Calcular"}
        </button>
      </div>
      <div aria-live="polite">
        {error && <p className="text-sm text-bad-fg">{error}</p>}
        {quote && (
          <div className="flex items-center justify-between rounded-xl bg-paper px-3.5 py-3 text-sm">
            <span className="flex flex-col gap-0.5">
              <span className="font-bold">Menor frete{quote.carrierName ? ` · ${quote.carrierName}` : ""}</span>
              {quote.packageName && <span className="text-muted">{quote.packageName}</span>}
            </span>
            <span className="num font-bold">{quote.shippingCost > 0 ? money(quote.shippingCost) : "Grátis"}</span>
          </div>
        )}
      </div>
    </form>
  );
}
