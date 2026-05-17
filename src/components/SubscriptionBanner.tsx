import type { SubscriptionStatus } from "@/lib/types";

type Phase =
  | "trial_ok" // > 15 días
  | "trial_soft" // 15..6 días
  | "trial_urgent" // 5..0 días
  | "grace" // 0..-grace
  | "active_ok"
  | "active_soft"
  | "active_urgent"
  | "active_grace"
  | "expired";

function getPhase(
  status: SubscriptionStatus,
  trialEndsAt: string,
  periodEndsAt: string | null,
  gracePeriodDays: number,
): { phase: Phase; daysLeft: number } {
  const now = Date.now();

  if (status === "trialing") {
    const daysLeft = Math.ceil(
      (new Date(trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24),
    );
    if (daysLeft > 15) return { phase: "trial_ok", daysLeft };
    if (daysLeft > 5) return { phase: "trial_soft", daysLeft };
    if (daysLeft > 0) return { phase: "trial_urgent", daysLeft };
    if (daysLeft >= -gracePeriodDays) return { phase: "grace", daysLeft };
    return { phase: "expired", daysLeft };
  }

  if (status === "active" && periodEndsAt) {
    const daysLeft = Math.ceil(
      (new Date(periodEndsAt).getTime() - now) / (1000 * 60 * 60 * 24),
    );
    if (daysLeft > 15) return { phase: "active_ok", daysLeft };
    if (daysLeft > 5) return { phase: "active_soft", daysLeft };
    if (daysLeft > 0) return { phase: "active_urgent", daysLeft };
    if (daysLeft >= -gracePeriodDays)
      return { phase: "active_grace", daysLeft };
    return { phase: "expired", daysLeft };
  }

  return { phase: "expired", daysLeft: -999 };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(amount: number, currency: string) {
  return `${amount.toLocaleString("es-CL")} ${currency}`;
}

function WhatsAppButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-950 shadow-md shadow-emerald-500/30 transition-all hover:scale-105 hover:bg-emerald-400"
    >
      <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      Contactar admin
    </a>
  );
}

export function SubscriptionBanner({
  status,
  trialEndsAt,
  periodEndsAt,
  gracePeriodDays,
  monthlyPrice,
  currency,
  adminWhatsapp,
}: {
  status: SubscriptionStatus;
  trialEndsAt: string;
  periodEndsAt: string | null;
  gracePeriodDays: number;
  monthlyPrice: number;
  currency: string;
  adminWhatsapp: string | null;
}) {
  const { phase, daysLeft } = getPhase(
    status,
    trialEndsAt,
    periodEndsAt,
    gracePeriodDays,
  );

  if (phase === "expired") return null;

  const waUrl = adminWhatsapp
    ? `https://wa.me/${adminWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        "Hola, soy dueño de un salón en StyloChile. Quiero coordinar el pago de mi plan mensual.",
      )}`
    : null;

  // Persistent info line — trial sin urgencia (incluye WhatsApp por si
  // el dueño quiere coordinar pago anticipado).
  if (phase === "trial_ok") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-primary">
            Período de prueba: <strong>{daysLeft} días</strong> restantes
            (hasta {formatDate(trialEndsAt)})
          </span>
          <span className="text-xs text-muted-foreground">
            Plan post-trial:{" "}
            <strong className="text-primary">
              {formatPrice(monthlyPrice, currency)}
            </strong>
            /mes
          </span>
        </div>
        {waUrl && <WhatsAppButton url={waUrl} />}
      </div>
    );
  }

  // Active OK — discreta + WhatsApp opcional
  if (phase === "active_ok" && periodEndsAt) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-emerald-300">
            Plan activo hasta {formatDate(periodEndsAt)}
          </span>
          <span className="text-xs text-emerald-400/70">
            {formatPrice(monthlyPrice, currency)}/mes
          </span>
        </div>
        {waUrl && <WhatsAppButton url={waUrl} />}
      </div>
    );
  }

  // Soft warnings — info
  if (phase === "trial_soft" || phase === "active_soft") {
    const label =
      phase === "trial_soft"
        ? `Tu prueba gratuita vence en ${daysLeft} días (${formatDate(trialEndsAt)}). El plan continúa por ${formatPrice(monthlyPrice, currency)} mensuales.`
        : `Tu plan vence en ${daysLeft} días (${formatDate(periodEndsAt!)}). Renueva por ${formatPrice(monthlyPrice, currency)} para mantener tu salón activo.`;
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-sky-200">{label}</p>
        {waUrl && <WhatsAppButton url={waUrl} />}
      </div>
    );
  }

  // Urgent — ámbar + CTA
  if (phase === "trial_urgent" || phase === "active_urgent") {
    const label =
      phase === "trial_urgent"
        ? `Tu prueba gratuita vence en ${daysLeft} ${daysLeft === 1 ? "día" : "días"}. Coordina el pago de ${formatPrice(monthlyPrice, currency)} mensuales para no perder acceso.`
        : `Tu plan vence en ${daysLeft} ${daysLeft === 1 ? "día" : "días"}. Renueva por ${formatPrice(monthlyPrice, currency)} para no perder acceso.`;
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-amber-200">{label}</p>
        {waUrl && <WhatsAppButton url={waUrl} />}
      </div>
    );
  }

  // Grace — rojo, crítico
  if (phase === "grace" || phase === "active_grace") {
    const graceLeft = gracePeriodDays + daysLeft;
    const label =
      phase === "grace"
        ? `Tu prueba gratuita ha vencido. Tienes ${graceLeft} ${graceLeft === 1 ? "día" : "días"} de gracia para activar tu plan (${formatPrice(monthlyPrice, currency)}/mes) antes de que tu salón sea suspendido.`
        : `Tu plan ha vencido. Tienes ${graceLeft} ${graceLeft === 1 ? "día" : "días"} de gracia para renovar (${formatPrice(monthlyPrice, currency)}/mes) antes de que tu salón sea suspendido.`;
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-red-200">{label}</p>
        {waUrl && <WhatsAppButton url={waUrl} />}
      </div>
    );
  }

  return null;
}
