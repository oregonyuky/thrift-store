"use client";

import { useState, useTransition } from "react";
import { addLabelToCart, payLabel, printLabel, type ActionResult } from "@/app/actions";

interface Props {
  orderId: string;
  stage: number;
  cartId?: string;
  cartAdded: boolean;
  checkedOut: boolean;
  generated: boolean;
  balance: string | null;
}

export function LabelActions({ orderId, stage, cartId, cartAdded, checkedOut, generated, balance }: Props) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const run = (fn: (id: string) => Promise<ActionResult>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setResult(null);
    start(async () => setResult(await fn(orderId)));
  };

  const steps = [
    { label: "Frete no carrinho", done: cartAdded || checkedOut || generated },
    { label: "Etiqueta paga", done: checkedOut || generated },
    { label: "Etiqueta gerada", done: generated },
  ];

  let action: React.ReactNode = null;
  if (stage === 0) {
    action = <p className="text-[13px] text-muted">A etiqueta fica disponível quando o pagamento for confirmado.</p>;
  } else if (stage < 0 || stage >= 4) {
    action = null;
  } else if (!cartAdded && !checkedOut && !generated) {
    action = (
      <button type="button" disabled={pending} onClick={() => run(addLabelToCart)} className="btn-primary !min-h-[46px] w-full">
        {pending ? "Enviando ao Melhor Envio..." : "Adicionar frete ao Melhor Envio"}
      </button>
    );
  } else if (!checkedOut && !generated) {
    action = (
      <button
        type="button"
        disabled={pending}
        onClick={() => run(payLabel, `Pagar a etiqueta do pedido ${orderId.slice(0, 8)} com o saldo do Melhor Envio?`)}
        className="btn-primary !min-h-[46px] w-full"
      >
        {pending ? "Pagando..." : "Pagar etiqueta com o saldo"}
      </button>
    );
  } else if (!generated) {
    action = (
      <button type="button" disabled={pending} onClick={() => run(printLabel)} className="btn-primary !min-h-[46px] w-full">
        {pending ? "Gerando..." : "Gerar etiqueta"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-[#f4efe8] p-4">
      <span className="text-[13px] font-bold">Etiqueta Melhor Envio</span>
      <ol className="flex gap-1.5" aria-label="Etapas da etiqueta">
        {steps.map((s) => (
          <li key={s.label} className="flex flex-1 flex-col gap-1.5">
            <span className={`h-1 rounded-sm ${s.done ? "bg-sage" : "bg-line"}`} />
            <span className={`text-[11px] ${s.done ? "font-bold text-ink" : "text-muted"}`}>{s.label}</span>
          </li>
        ))}
      </ol>
      {action}
      {generated && cartId && (
        <a href={`/pedidos/etiqueta?labelId=${encodeURIComponent(cartId)}`} className="btn-ghost w-full">
          Baixar etiqueta (PDF)
        </a>
      )}
      <div aria-live="polite">
        {result?.error && <p className="text-[13px] text-bad-fg">{result.error}</p>}
        {result?.message && <p className="text-[13px] text-ok-fg">{result.message}</p>}
      </div>
      {balance && <span className="num text-xs text-muted">Saldo atual: {balance}</span>}
    </div>
  );
}
