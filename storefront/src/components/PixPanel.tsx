"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/format";
import { ClockIcon, CopyIcon } from "./icons";

export interface PixData {
  kind: "order" | "bag";
  id: string;
  paymentId?: string;
  qrImage?: string | null;
  pixCode?: string;
  expiresAt?: string;
}

function remaining(expiresAt?: string) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(diff)) return null;
  if (diff <= 0) return "expirada";
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function PixPanel({ data, total }: { data: PixData; total?: number }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"waiting" | "paid" | "expired" | "error">("waiting");
  const [expiresAt, setExpiresAt] = useState(data.expiresAt);
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    if (!data.paymentId || status !== "waiting") return;
    let stopped = false;
    const check = async () => {
      try {
        const response = await fetch(`/api/pix/status?paymentId=${encodeURIComponent(data.paymentId!)}`, { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json()) as { paid?: boolean; expiresAt?: string };
        if (stopped) return;
        if (body.expiresAt) setExpiresAt(body.expiresAt);
        if (body.paid) {
          setStatus("paid");
          router.push(data.kind === "order" ? `/obrigado?pedido=${encodeURIComponent(data.id)}` : "/minhas-compras?pago=1");
        }
      } catch {
        /* keep polling */
      }
    };
    check();
    const timer = window.setInterval(check, 5000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [data, status, router]);

  useEffect(() => {
    const tick = () => {
      const left = remaining(expiresAt);
      setClock(left);
      if (left === "expirada") setStatus((s) => (s === "waiting" ? "expired" : s));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  async function copy() {
    if (!data.pixCode) return;
    try {
      await navigator.clipboard.writeText(data.pixCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        {clock && status === "waiting" && (
          <span className="num inline-flex items-center gap-2 rounded-full bg-warn-bg px-3 py-1.5 text-[13px] font-bold text-warn-fg">
            <ClockIcon size={14} /> Pix válido por {clock}
          </span>
        )}
        <h2 className="mt-2 font-display text-[34px] font-normal tracking-tight">Quase sua!</h2>
        <p className="text-[15px] text-muted">
          {total !== undefined ? (
            <>Pague <strong className="text-ink">{money(total)}</strong> no Pix para garantir.</>
          ) : (
            "Pague no Pix para garantir suas peças."
          )}
        </p>
      </div>

      {data.qrImage && (
        <div className="flex justify-center">
          <div className="rounded-[20px] border border-line bg-card p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.qrImage} alt="QR Code do Pix" width={220} height={220} className="h-[220px] w-[220px]" />
          </div>
        </div>
      )}

      {data.pixCode && (
        <button type="button" onClick={copy} className="btn-primary min-h-14 text-base">
          <CopyIcon size={18} /> {copied ? "Código copiado!" : "Copiar código Pix"}
        </button>
      )}

      <ol className="flex flex-col gap-2.5 rounded-2xl border border-line bg-card px-[18px] py-4 text-sm leading-snug text-muted">
        <li className="flex gap-2.5"><span className="font-bold text-terra">1</span>Abra o app do seu banco e escolha Pix copia e cola (ou leia o QR Code).</li>
        <li className="flex gap-2.5"><span className="font-bold text-terra">2</span>Cole o código e confirme o pagamento.</li>
        <li className="flex gap-2.5"><span className="font-bold text-terra">3</span>Esta tela atualiza sozinha quando o pagamento cair.</li>
      </ol>

      <div role="status" className="flex items-center justify-center gap-2.5 text-sm text-muted">
        {status === "waiting" && (
          <>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#c98a2e]" /> Aguardando pagamento…
          </>
        )}
        {status === "paid" && <span className="font-bold text-ok-fg">Pagamento confirmado! Redirecionando…</span>}
        {status === "expired" && (
          <span className="text-bad-fg">
            Este Pix expirou. Veja o pedido em <a className="underline" href="/minhas-compras">Minhas compras</a>.
          </span>
        )}
      </div>
      {!data.paymentId && (
        <p className="text-center text-sm text-muted">
          Depois de pagar, acompanhe em <a className="underline" href="/minhas-compras">Minhas compras</a>.
        </p>
      )}
    </div>
  );
}
