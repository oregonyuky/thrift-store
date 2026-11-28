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

/** (19) 99999-0000 for mobiles, (19) 3333-0000 for landlines. */
export function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** 000.000.000-00 while 11 digits or fewer, 00.000.000/0000-00 beyond that. */
export function formatCpfCnpj(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}

/** Check digits of a CPF (11 digits) or CNPJ (14 digits). */
export function isValidCpfCnpj(value: string) {
  const d = value.replace(/\D/g, "");
  if (/^(\d)\1+$/.test(d)) return false;
  const digit = (base: string, weights: number[]) => {
    const sum = base.split("").reduce((acc, n, i) => acc + Number(n) * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  if (d.length === 11) {
    const w1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    return digit(d.slice(0, 9), w1) === Number(d[9]) && digit(d.slice(0, 10), w2) === Number(d[10]);
  }
  if (d.length === 14) {
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    return digit(d.slice(0, 12), w1) === Number(d[12]) && digit(d.slice(0, 13), w2) === Number(d[13]);
  }
  return false;
}
