import type { SalonSubscription } from "./types";

/**
 * Determina si una subscription venció hace más días que el grace
 * period — en cuyo caso el salón debe quedar suspendido.
 *
 * - `trialing`: se mide contra `trial_ends_at`.
 * - `active`: se mide contra `current_period_ends_at`.
 * - `expired`: se considera la fecha más reciente disponible (period o
 *   trial). Si ya estaba marcado expired pero aún no se suspendió,
 *   esto fuerza la suspensión.
 *
 * Retorna `false` si no hay fecha de referencia (datos incompletos).
 */
export function shouldAutoSuspend(
  subscription: SalonSubscription,
  gracePeriodDays: number,
): boolean {
  const endsAt = getRelevantEndDate(subscription);
  if (!endsAt) return false;

  const daysPast = Math.floor(
    (Date.now() - endsAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysPast > gracePeriodDays;
}

function getRelevantEndDate(sub: SalonSubscription): Date | null {
  if (sub.status === "trialing") {
    return new Date(sub.trial_ends_at);
  }
  if (sub.status === "active" && sub.current_period_ends_at) {
    return new Date(sub.current_period_ends_at);
  }
  // status === "expired" — usar la fecha más reciente conocida
  if (sub.current_period_ends_at) {
    return new Date(sub.current_period_ends_at);
  }
  if (sub.trial_ends_at) {
    return new Date(sub.trial_ends_at);
  }
  return null;
}
