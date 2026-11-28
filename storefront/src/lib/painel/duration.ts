/**
 * Bag durations. The API only stores minutes, days and months; the panel also offers
 * hours and weeks and converts them (1 hora = 60 minutos, 1 semana = 7 dias).
 */
export type PanelUnit = "minutes" | "hours" | "days" | "weeks" | "months";

export const unitOptions: Array<[PanelUnit, string]> = [
  ["minutes", "minutos"],
  ["hours", "horas"],
  ["days", "dias"],
  ["weeks", "semanas"],
  ["months", "meses"],
];

const names: Record<PanelUnit, [string, string]> = {
  minutes: ["minuto", "minutos"],
  hours: ["hora", "horas"],
  days: ["dia", "dias"],
  weeks: ["semana", "semanas"],
  months: ["mês", "meses"],
};

const isUnit = (u: string): u is PanelUnit => u in names;

/** Panel value + unit → what the API accepts. */
export function toApiDuration(value: number, unit: string): { value: number; unit: "minutes" | "days" | "months" } {
  const v = Math.max(1, Math.round(value));
  if (unit === "minutes") return { value: v, unit: "minutes" };
  if (unit === "hours") return { value: v * 60, unit: "minutes" };
  if (unit === "weeks") return { value: v * 7, unit: "days" };
  if (unit === "months") return { value: v, unit: "months" };
  return { value: v, unit: "days" };
}

/** API value + unit → the friendliest panel unit (120 minutos → 2 horas, 14 dias → 2 semanas). */
export function fromApiDuration(value: number, unit: string): { value: number; unit: PanelUnit } {
  const u = unit.toLowerCase();
  if (u === "minutes") return value % 60 === 0 ? { value: value / 60, unit: "hours" } : { value, unit: "minutes" };
  if (u === "days") return value % 7 === 0 ? { value: value / 7, unit: "weeks" } : { value, unit: "days" };
  if (isUnit(u)) return { value, unit: u };
  return { value, unit: "days" };
}

export function durationLabel(value: number, unit: string) {
  const d = fromApiDuration(value, unit);
  const [one, many] = names[d.unit];
  return `${d.value} ${d.value === 1 ? one : many}`;
}
