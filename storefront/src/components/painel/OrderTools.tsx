"use client";

import { useState } from "react";
import { rechargeBalance, setOrderStatus } from "@/app/painel/manage-actions";
import { FormShell } from "./FormShell";

const statuses: Array<[string, string]> = [
  ["Pending", "Aguardando pagamento"],
  ["Paid", "Pagamento confirmado"],
  ["Dispatched", "Postado na transportadora"],
  ["Shipped", "Em transporte"],
  ["Delivered", "Entregue"],
  ["Cancelled", "Cancelado"],
];

export function OrderStatusForm({ orderId, status }: { orderId: string; status?: string }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <FormShell action={setOrderStatus} submit="Mudar status" pending="Salvando..." className="flex flex-col gap-3">
        <input type="hidden" name="id" value={orderId} />
        <label htmlFor="order-status" className="text-[13px] font-bold">Status do pedido</label>
        <select id="order-status" name="status" defaultValue={status ?? "Pending"} className="field">
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <p className="text-xs text-muted">Use para marcar postagem, entrega ou cancelamento. Etapas de etiqueta são atualizadas sozinhas.</p>
      </FormShell>
    </div>
  );
}

export function BalanceRecharge() {
  const [copied, setCopied] = useState(false);
  return (
    <FormShell
      action={rechargeBalance}
      submit="Solicitar recarga"
      pending="Solicitando..."
      extra={(result) =>
        result.ok && result.data ? (
          <div className="flex flex-col gap-3 rounded-xl bg-[#f4efe8] p-4">
            {result.data.paymentUrl && (
              <a href={result.data.paymentUrl} target="_blank" rel="noreferrer" className="btn-primary">Abrir pagamento no Melhor Envio</a>
            )}
            {result.data.pixImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.data.pixImage} alt="QR Code Pix da recarga" className="mx-auto h-[220px] w-[220px] rounded-lg bg-card p-2" />
            )}
            {result.data.pixCode && (
              <button
                type="button"
                className="btn-ghost"
                onClick={async () => {
                  await navigator.clipboard.writeText(result.data!.pixCode!).catch(() => undefined);
                  setCopied(true);
                }}
              >
                {copied ? "Código Pix copiado!" : "Copiar código Pix"}
              </button>
            )}
            {!result.data.paymentUrl && !result.data.pixImage && !result.data.pixCode && (
              <p className="text-sm text-muted">A recarga foi pedida, mas o Melhor Envio não devolveu link nem Pix. Confira no site do Melhor Envio.</p>
            )}
          </div>
        ) : null
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="recharge-value" className="text-[13px] font-bold">Valor (R$)</label>
          <input id="recharge-value" name="value" inputMode="decimal" required placeholder="50,00" className="field" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="recharge-slug" className="text-[13px] font-bold">Pagar com</label>
          <select id="recharge-slug" name="slug" defaultValue="pix" className="field">
            <option value="pix">Pix</option>
            <option value="boleto">Boleto</option>
          </select>
        </div>
      </div>
    </FormShell>
  );
}
