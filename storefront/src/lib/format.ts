const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function money(value?: number | null): string {
  return brl.format(value ?? 0);
}

export function dateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export function shortDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
}

export function discountPercent(price: number, oldPrice?: number): number {
  if (!oldPrice || oldPrice <= 0 || price <= 0 || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}

function normalize(status?: string) {
  return (status ?? "").toLowerCase().replace(/[\s_-]+/g, "");
}

type Tone = "wait" | "paid" | "ship" | "done" | "cancel" | "muted";

const statusMap: Record<string, [string, Tone]> = {
  paid: ["Pago", "paid"],
  pago: ["Pago", "paid"],
  approved: ["Pago", "paid"],
  paymentconfirmed: ["Pago", "paid"],
  pending: ["Aguardando pagamento", "wait"],
  waitingpayment: ["Aguardando pagamento", "wait"],
  active: ["Sacolinha aberta", "paid"],
  closed: ["Preparando envio", "ship"],
  readytoship: ["Preparando envio", "ship"],
  dispatched: ["Despachado", "ship"],
  shipped: ["A caminho", "ship"],
  delivered: ["Entregue", "done"],
  cancelled: ["Cancelado", "cancel"],
  canceled: ["Cancelado", "cancel"],
  expired: ["Expirado", "muted"],
  abandoned: ["Expirado", "muted"],
  reservationexpired: ["Expirado", "muted"],
};

export function statusInfo(status?: string): { label: string; tone: Tone } {
  const found = statusMap[normalize(status)];
  return found ? { label: found[0], tone: found[1] } : { label: status || "Pagamento iniciado", tone: "wait" };
}

export const toneClass: Record<Tone, string> = {
  wait: "bg-warn-bg text-warn-fg",
  paid: "bg-info-bg text-info-fg",
  ship: "bg-teal-bg text-teal-fg",
  done: "bg-ok-bg text-ok-fg",
  cancel: "bg-bad-bg text-bad-fg",
  muted: "bg-sand text-muted",
};
