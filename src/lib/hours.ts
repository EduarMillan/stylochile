import type { DayKey, WeeklyHours } from "./types";

const WEEKDAY_MAP: Record<string, DayKey> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

export type OpenStatus = "open" | "closed";

/**
 * Devuelve el estado abierto/cerrado de un salón **en hora de Chile**.
 * Usa Intl.DateTimeFormat con timeZone "America/Santiago", así da el
 * mismo resultado en cualquier server / cliente sin importar su zona
 * horaria. Retorna null si no hay hours definidos.
 */
export function getOpenStatus(
  hours: WeeklyHours | null,
  now: Date,
): OpenStatus | null {
  if (!hours) return null;

  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    weekday: "short",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const hourStr = parts.find((p) => p.type === "hour")?.value;
  const minuteStr = parts.find((p) => p.type === "minute")?.value;
  if (!weekday || !hourStr || !minuteStr) return null;

  const dayKey = WEEKDAY_MAP[weekday];
  if (!dayKey) return null;

  const dayHours = hours[dayKey];
  if (!dayHours || dayHours.closed) return "closed";

  const nowMinutes = parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10);
  const openMinutes = parseHHMM(dayHours.open);
  const closeMinutes = parseHHMM(dayHours.close);
  if (openMinutes == null || closeMinutes == null) return null;

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes
    ? "open"
    : "closed";
}

function parseHHMM(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}
