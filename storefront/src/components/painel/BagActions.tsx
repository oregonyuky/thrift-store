"use client";

import { useState, useTransition } from "react";
import { closeBag, extendBag, type ActionResult } from "@/app/painel/actions";

export function BagActions({ bagId, customer, canExtend, canClose, extendLabel }: { bagId: string; customer: string; canExtend: boolean; canClose: boolean; extendLabel: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const btn = "h-[34px] rounded-lg border border-line bg-card px-3 text-[13px] font-medium hover:bg-sand disabled:opacity-60";

  if (!canExtend && !canClose) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {canExtend && (
          <button type="button" disabled={pending} className={btn} onClick={() => start(async () => setResult(await extendBag(bagId)))}>
            {extendLabel}
          </button>
        )}
        {canClose && (
          <button
            type="button"
            disabled={pending}
            className={btn}
            onClick={() => {
              if (!window.confirm(`Fechar a sacolinha de ${customer} e marcar para envio?`)) return;
              start(async () => setResult(await closeBag(bagId)));
            }}
          >
            Fechar e enviar
          </button>
        )}
      </div>
      <div aria-live="polite">
        {result?.error && <p className="text-xs text-bad-fg">{result.error}</p>}
        {result?.message && <p className="text-xs text-ok-fg">{result.message}</p>}
      </div>
    </div>
  );
}
