"use client";

import { useState, useTransition } from "react";
import { finalizeBag } from "@/app/actions";

export function CartTabs({ cartCount, bagCount, cart, bag, startOnBag }: { cartCount: number; bagCount: number | null; cart: React.ReactNode; bag: React.ReactNode; startOnBag?: boolean }) {
  const [tab, setTab] = useState<"cart" | "bag">(startOnBag && bagCount !== null ? "bag" : "cart");
  const tabClass = (active: boolean) =>
    `h-11 rounded-full text-sm transition ${active ? "bg-card font-bold text-ink shadow-[0_2px_8px_rgba(42,31,30,0.08)]" : "font-medium text-muted hover:text-ink"}`;

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Carrinho ou sacolinha" className="grid grid-cols-2 rounded-full bg-sand p-1 sm:max-w-md">
        <button type="button" role="tab" id="tab-cart" aria-controls="panel-cart" aria-selected={tab === "cart"} onClick={() => setTab("cart")} className={tabClass(tab === "cart")}>
          Carrinho · {cartCount}
        </button>
        <button type="button" role="tab" id="tab-bag" aria-controls="panel-bag" aria-selected={tab === "bag"} onClick={() => setTab("bag")} className={tabClass(tab === "bag")}>
          Sacolinha{bagCount !== null ? ` · ${bagCount}` : ""}
        </button>
      </div>
      <div role="tabpanel" id="panel-cart" aria-labelledby="tab-cart" hidden={tab !== "cart"}>{cart}</div>
      <div role="tabpanel" id="panel-bag" aria-labelledby="tab-bag" hidden={tab !== "bag"}>{bag}</div>
    </div>
  );
}

export function FinalizeBagButton({ bagId }: { bagId: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending || message?.ok}
        onClick={() => {
          if (!window.confirm("Fechar a sacolinha agora? A gente prepara o envio de todas as peças pagas.")) return;
          start(async () => {
            const result = await finalizeBag(bagId);
            setMessage(result.error ? { ok: false, text: result.error } : { ok: true, text: result.success ?? "Sacolinha fechada." });
          });
        }}
        className="btn-ghost w-full"
      >
        {pending ? "Fechando..." : "Fechar sacolinha e enviar agora"}
      </button>
      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-ok-fg" : "text-bad-fg"}`}>{message.text}</p>
      )}
    </div>
  );
}
