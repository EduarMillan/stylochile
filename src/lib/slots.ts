import type { BusySlot, DayKey, WeeklyHours } from "@/lib/types";

const DAY_INDEX: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function dayKeyFromDate(d: Date): DayKey {
  return DAY_INDEX[d.getDay()];
}

export function isClosedOn(hours: WeeklyHours | null, d: Date): boolean {
  if (!hours) return true;
  const day = hours[dayKeyFromDate(d)];
  return !day || day.closed;
}

function setTime(base: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const out = new Date(base);
  out.setHours(h, m, 0, 0);
  return out;
}

/**
 * Genera los slots disponibles para un día.
 * - hours del salón define la ventana abierta del día
 * - durationMinutes del servicio define el largo del slot
 * - busy filtra solapamientos (de la misma área)
 * - stepMinutes controla el espaciado entre arranques de slot (30 por defecto)
 */
export function generateAvailableSlots(opts: {
  hours: WeeklyHours | null;
  day: Date;
  durationMinutes: number;
  busy: BusySlot[];
  areaId: string | null;
  stepMinutes?: number;
  now?: Date;
}): { start: Date; end: Date }[] {
  const { hours, day, durationMinutes, busy, areaId } = opts;
  const step = opts.stepMinutes ?? 30;
  const now = opts.now ?? new Date();

  if (!hours || isClosedOn(hours, day)) return [];
  const dayHours = hours[dayKeyFromDate(day)];
  if (dayHours.closed) return [];

  const opens = setTime(day, dayHours.open);
  const closes = setTime(day, dayHours.close);

  // Busy de la misma área (o sin área asignada — bloquea para todas)
  const relevantBusy = busy
    .filter((b) => b.area_id == null || b.area_id === areaId)
    .map((b) => ({
      starts_at: new Date(b.starts_at),
      ends_at: new Date(b.ends_at),
    }));

  const slots: { start: Date; end: Date }[] = [];
  let cursor = new Date(opens);

  while (cursor.getTime() + durationMinutes * 60_000 <= closes.getTime()) {
    const end = new Date(cursor.getTime() + durationMinutes * 60_000);
    const inFuture = cursor.getTime() > now.getTime();
    const conflicts = relevantBusy.some(
      (b) => cursor < b.ends_at && end > b.starts_at,
    );
    if (inFuture && !conflicts) {
      slots.push({ start: new Date(cursor), end });
    }
    cursor = new Date(cursor.getTime() + step * 60_000);
  }
  return slots;
}

export function nextNDays(n: number, from: Date = new Date()): Date[] {
  const days: Date[] = [];
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export function formatLocalDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-CU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatLongDate(d: Date): string {
  return d.toLocaleDateString("es-CU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
