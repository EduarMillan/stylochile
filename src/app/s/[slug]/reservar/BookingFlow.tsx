"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  generateAvailableSlots,
  formatLongDate,
  formatTime,
} from "@/lib/slots";
import { MonthCalendar } from "@/components/MonthCalendar";
import { buildReservationMessage, whatsappLink } from "@/lib/whatsapp";
import type {
  BusySlot,
  Salon,
  SalonArea,
  Service,
  WeeklyHours,
} from "@/lib/types";
import { reserveAction, type ReserveState } from "./actions";

const DEFAULT_DURATION_MINUTES = 60;

type StepIdx = 1 | 2 | 3 | 4 | 5;

const STEPS: { idx: StepIdx; label: string }[] = [
  { idx: 1, label: "Área" },
  { idx: 2, label: "Servicio" },
  { idx: 3, label: "Día" },
  { idx: 4, label: "Hora" },
  { idx: 5, label: "Datos" },
];

export function BookingFlow({
  salon,
  areas,
  services,
}: {
  salon: Pick<Salon, "id" | "name" | "slug" | "whatsapp" | "hours">;
  areas: SalonArea[];
  services: Service[];
}) {
  const [step, setStep] = useState<StepIdx>(1);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [day, setDay] = useState<Date | null>(null);
  const [slot, setSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [busy, setBusy] = useState<BusySlot[]>([]);
  const [busyLoading, setBusyLoading] = useState(false);

  const [state, formAction, pending] = useActionState<ReserveState, FormData>(
    reserveAction,
    null,
  );

  const filteredServices = useMemo(
    () =>
      services.filter((s) =>
        areaId == null ? s.area_id == null : s.area_id === areaId,
      ),
    [services, areaId],
  );
  const selectedArea = useMemo(
    () => areas.find((a) => a.id === areaId) ?? null,
    [areas, areaId],
  );
  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );
  const duration =
    selectedService?.duration_minutes ?? DEFAULT_DURATION_MINUTES;

  // Cargar busy slots al cambiar día
  useEffect(() => {
    if (!day) {
      setBusy([]);
      return;
    }
    let cancelled = false;
    async function load() {
      if (!day) return;
      setBusyLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("get_busy_slots", {
          p_salon_id: salon.id,
          p_day: day.toISOString().slice(0, 10),
        });
        if (cancelled) return;
        if (error) {
          toast.error(error.message);
          return;
        }
        setBusy((data as BusySlot[]) ?? []);
      } finally {
        if (!cancelled) setBusyLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [day, salon.id]);

  const availableSlots = useMemo(() => {
    if (!day) return [];
    return generateAvailableSlots({
      hours: salon.hours as WeeklyHours | null,
      day,
      durationMinutes: duration,
      busy,
      areaId,
    });
  }, [day, salon.hours, duration, busy, areaId]);

  // Mensajes de éxito / error
  useEffect(() => {
    if (state?.ok) {
      toast.success("¡Reserva enviada!");
      if (state.ok.whatsappUrl) {
        window.open(state.ok.whatsappUrl, "_blank", "noopener,noreferrer");
      }
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  // Pantalla de éxito
  if (state?.ok) {
    return (
      <Confirmation
        salonSlug={salon.slug}
        whatsappUrl={state.ok.whatsappUrl}
      />
    );
  }

  function pickArea(id: string) {
    setAreaId(id);
    setServiceId(null);
    setSlot(null);
    setStep(2);
  }
  function pickService(id: string) {
    setServiceId(id);
    setSlot(null);
    setStep(3);
  }
  function pickDay(d: Date) {
    setDay(d);
    setSlot(null);
    setStep(4);
  }
  function pickSlot(s: { start: Date; end: Date }) {
    setSlot(s);
    setStep(5);
  }

  function back() {
    if (step > 1) setStep((step - 1) as StepIdx);
  }

  // Validaciones para avanzar
  const canContinue =
    (step === 1 && !!areaId) ||
    (step === 2 && !!serviceId) ||
    (step === 3 && !!day) ||
    (step === 4 && !!slot);

  function next() {
    if (!canContinue) return;
    if (step < 5) setStep((step + 1) as StepIdx);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 sm:gap-10">
      <Stepper
        current={step}
        onJumpBack={(idx) => {
          if (idx < step) setStep(idx);
        }}
      />

      <div className="flex flex-1 flex-col">
        {step === 1 && (
          <StepArea
            areas={areas}
            selected={areaId}
            onPick={pickArea}
          />
        )}
        {step === 2 && (
          <StepService
            area={selectedArea}
            services={filteredServices}
            selected={serviceId}
            onPick={pickService}
          />
        )}
        {step === 3 && (
          <StepDay
            hours={salon.hours as WeeklyHours | null}
            selected={day}
            onPick={pickDay}
          />
        )}
        {step === 4 && (
          <StepSlot
            day={day}
            duration={duration}
            slots={availableSlots}
            loading={busyLoading}
            selected={slot}
            onPick={pickSlot}
          />
        )}
        {step === 5 && slot && (
          <StepData
            salon={salon}
            slot={slot}
            areaName={selectedArea?.name ?? null}
            serviceName={selectedService?.name ?? null}
            areaId={areaId}
            serviceId={serviceId}
            duration={duration}
            formAction={formAction}
            pending={pending}
            errorMessage={state?.error}
          />
        )}
      </div>

      <NavBar
        step={step}
        canBack={step > 1}
        canContinue={canContinue}
        onBack={back}
        onNext={next}
      />
    </div>
  );
}

// ============================================================================
// Stepper indicator
// ============================================================================
function Stepper({
  current,
  onJumpBack,
}: {
  current: StepIdx;
  onJumpBack: (idx: StepIdx) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-3">
      {STEPS.map((s, i) => {
        const completed = current > s.idx;
        const active = current === s.idx;
        const clickable = completed;
        return (
          <div key={s.idx} className="flex flex-1 items-center">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJumpBack(s.idx)}
              className="flex flex-col items-center gap-2 disabled:cursor-default"
            >
              <span
                className={
                  completed
                    ? "bg-gold-gradient flex size-8 items-center justify-center rounded-full text-xs font-bold text-primary-foreground shadow-md shadow-primary/30 sm:size-10 sm:text-sm"
                    : active
                      ? "flex size-8 items-center justify-center rounded-full border-2 border-primary text-xs font-bold text-primary sm:size-10 sm:text-sm"
                      : "flex size-8 items-center justify-center rounded-full border border-border text-xs text-muted-foreground sm:size-10 sm:text-sm"
                }
              >
                {completed ? "✓" : s.idx}
              </span>
              <span
                className={`hidden text-[10px] font-bold uppercase tracking-[0.15em] sm:block ${
                  active
                    ? "text-primary"
                    : completed
                      ? "text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                className={`mx-1 h-0.5 flex-1 rounded-full sm:mx-2 ${
                  current > s.idx ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Step components
// ============================================================================
function StepHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <header className="mb-6 sm:mb-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        {kicker}
      </p>
      <h2 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">
        {title}
      </h2>
    </header>
  );
}

function StepArea({
  areas,
  selected,
  onPick,
}: {
  areas: SalonArea[];
  selected: string | null;
  onPick: (id: string) => void;
}) {
  if (areas.length === 0) {
    return (
      <EmptyState message="Este salón aún no tiene áreas configuradas." />
    );
  }
  return (
    <section>
      <StepHeader kicker="Paso 1 de 5" title="¿Qué tipo de servicio buscas?" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {areas.map((a) => {
          const active = selected === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onPick(a.id)}
              className={
                active
                  ? "card-glam relative overflow-hidden p-5 text-left ring-2 ring-primary"
                  : "card-glam card-glam-hover p-5 text-left"
              }
            >
              <span className="font-serif text-base leading-tight sm:text-lg">
                {a.name}
              </span>
              {a.description && (
                <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                  {a.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StepService({
  area,
  services,
  selected,
  onPick,
}: {
  area: SalonArea | null;
  services: Service[];
  selected: string | null;
  onPick: (id: string) => void;
}) {
  if (services.length === 0) {
    return (
      <section>
        <StepHeader kicker="Paso 2 de 5" title="Servicios" />
        <EmptyState message={`No hay servicios disponibles${area ? ` en ${area.name}` : ""}.`} />
      </section>
    );
  }
  return (
    <section>
      <StepHeader
        kicker="Paso 2 de 5"
        title={area ? `Servicios de ${area.name}` : "Elige un servicio"}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {services.map((s) => {
          const active = selected === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onPick(s.id)}
              className={
                active
                  ? "card-glam relative overflow-hidden p-5 text-left ring-2 ring-primary"
                  : "card-glam card-glam-hover p-5 text-left"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-serif text-base leading-tight sm:text-lg">
                  {s.name}
                </span>
                {s.price != null && (
                  <span className="whitespace-nowrap text-sm font-medium text-gold-gradient">
                    {s.price.toLocaleString("es-CU")} {s.currency}
                  </span>
                )}
              </div>
              {s.description && (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {s.description}
                </p>
              )}
              {s.duration_minutes && (
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {s.duration_minutes} min
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StepDay({
  hours,
  selected,
  onPick,
}: {
  hours: WeeklyHours | null;
  selected: Date | null;
  onPick: (d: Date) => void;
}) {
  return (
    <section className="flex flex-col items-center sm:items-start">
      <div className="w-full sm:max-w-md">
        <StepHeader kicker="Paso 3 de 5" title="¿Qué día prefieres?" />
        <MonthCalendar hours={hours} selected={selected} onSelect={onPick} />
      </div>
    </section>
  );
}

function StepSlot({
  day,
  duration,
  slots,
  loading,
  selected,
  onPick,
}: {
  day: Date | null;
  duration: number;
  slots: { start: Date; end: Date }[];
  loading: boolean;
  selected: { start: Date; end: Date } | null;
  onPick: (s: { start: Date; end: Date }) => void;
}) {
  return (
    <section>
      <StepHeader
        kicker="Paso 4 de 5"
        title={day ? `Horarios para ${formatLongDate(day)}` : "Elige el horario"}
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">
          Buscando horarios disponibles…
        </p>
      ) : slots.length === 0 ? (
        <EmptyState message="No hay horarios disponibles este día. Vuelve atrás y elige otro." />
      ) : (
        <>
          <p className="mb-4 text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Cada cita dura {duration} min
          </p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
            {slots.map((s) => {
              const active =
                selected && selected.start.getTime() === s.start.getTime();
              return (
                <button
                  key={s.start.toISOString()}
                  type="button"
                  onClick={() => onPick(s)}
                  className={
                    active
                      ? "bg-gold-gradient rounded-2xl px-3 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30"
                      : "rounded-2xl border border-border bg-card px-3 py-3.5 text-sm transition-all hover:border-primary hover:bg-primary/5 hover:ring-1 hover:ring-primary/40"
                  }
                >
                  {formatTime(s.start)}
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function StepData({
  salon,
  slot,
  areaId,
  serviceId,
  areaName,
  serviceName,
  duration,
  formAction,
  pending,
  errorMessage,
}: {
  salon: Pick<Salon, "id" | "name" | "whatsapp">;
  slot: { start: Date; end: Date };
  areaId: string | null;
  serviceId: string | null;
  areaName: string | null;
  serviceName: string | null;
  duration: number;
  formAction: (formData: FormData) => void;
  pending: boolean;
  errorMessage?: string;
}) {
  return (
    <section className="flex flex-col gap-6">
      <StepHeader kicker="Paso 5 de 5" title="Tus datos" />

      <div className="card-glam relative overflow-hidden p-5">
        <div className="absolute -right-12 -top-12 size-32 rounded-full bg-gold-gradient-soft opacity-40 blur-2xl" />
        <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Resumen
        </p>
        <div className="relative mt-3 grid gap-4 text-sm sm:grid-cols-2">
          {serviceName && (
            <div>
              <dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Servicio
              </dt>
              <dd className="font-serif text-base">{serviceName}</dd>
              {areaName && (
                <dd className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {areaName}
                </dd>
              )}
            </div>
          )}
          <div>
            <dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Cuándo
            </dt>
            <dd className="font-serif text-base capitalize">
              {formatLongDate(slot.start)}
            </dd>
            <dd className="text-foreground">
              {formatTime(slot.start)} · {duration} min
            </dd>
          </div>
        </div>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="salon_id" value={salon.id} />
        <input type="hidden" name="area_id" value={areaId ?? ""} />
        <input type="hidden" name="service_id" value={serviceId ?? ""} />
        <input
          type="hidden"
          name="starts_at"
          value={slot.start.toISOString()}
        />
        <input type="hidden" name="ends_at" value={slot.end.toISOString()} />
        <WhatsAppHidden
          salonName={salon.name}
          ownerWhatsapp={salon.whatsapp}
          areaName={areaName}
          serviceName={serviceName}
          start={slot.start}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="client_name"
              className="text-xs uppercase tracking-[0.15em]"
            >
              Nombre completo
            </Label>
            <Input
              id="client_name"
              name="client_name"
              required
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="client_phone"
              className="text-xs uppercase tracking-[0.15em]"
            >
              Teléfono / WhatsApp
            </Label>
            <Input
              id="client_phone"
              name="client_phone"
              required
              type="tel"
              autoComplete="tel"
              placeholder="+53 5 123 4567"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="client_notes"
            className="text-xs uppercase tracking-[0.15em]"
          >
            Comentarios (opcional)
          </Label>
          <Textarea
            id="client_notes"
            name="client_notes"
            rows={3}
            placeholder="Alergias, preferencias, etc."
          />
        </div>

        {errorMessage && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="self-start rounded-full uppercase tracking-wider"
        >
          {pending ? "Enviando…" : "Confirmar reserva"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Tu solicitud quedará en estado{" "}
          <span className="text-primary">pendiente</span> hasta que el salón la
          apruebe. Después del envío te abriremos un WhatsApp con el resumen.
        </p>
      </form>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="card-glam p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ============================================================================
// NavBar (footer fijo en mobile)
// ============================================================================
function NavBar({
  step,
  canBack,
  canContinue,
  onBack,
  onNext,
}: {
  step: StepIdx;
  canBack: boolean;
  canContinue: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  // En step 5 el submit lo maneja el form, no el NavBar
  const showNext = step < 5;
  return (
    <div className="sticky bottom-0 -mx-4 mt-auto flex items-center justify-between gap-3 border-t border-border/60 bg-background/85 px-4 py-4 backdrop-blur-md sm:-mx-8 sm:px-8 lg:-mx-16 lg:px-16">
      <button
        type="button"
        onClick={onBack}
        disabled={!canBack}
        className="rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:hover:text-muted-foreground/40"
      >
        ← Atrás
      </button>
      {showNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className={
            canContinue
              ? "bg-gold-gradient rounded-full px-7 py-3 text-xs font-bold uppercase tracking-[0.15em] text-primary-foreground shadow-md shadow-primary/30 transition-all hover:shadow-lg hover:shadow-primary/50 hover:brightness-110"
              : "rounded-full bg-muted/50 px-7 py-3 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground/50"
          }
        >
          Continuar →
        </button>
      )}
    </div>
  );
}

function WhatsAppHidden({
  salonName,
  ownerWhatsapp,
  areaName,
  serviceName,
  start,
}: {
  salonName: string;
  ownerWhatsapp: string | null;
  areaName: string | null;
  serviceName: string | null;
  start: Date;
}) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (!ownerWhatsapp) return;
    const handler = () => {
      const nameInput = document.getElementById(
        "client_name",
      ) as HTMLInputElement | null;
      const notesInput = document.getElementById(
        "client_notes",
      ) as HTMLTextAreaElement | null;
      const message = buildReservationMessage({
        salonName,
        clientName: nameInput?.value || "Cliente",
        serviceName,
        areaName,
        start,
        notes: notesInput?.value || null,
      });
      setUrl(whatsappLink(ownerWhatsapp, message));
    };
    handler();
    document.addEventListener("input", handler);
    return () => document.removeEventListener("input", handler);
  }, [salonName, ownerWhatsapp, areaName, serviceName, start]);

  return <input type="hidden" name="whatsapp_url" value={url} />;
}

function Confirmation({
  salonSlug,
  whatsappUrl,
}: {
  salonSlug: string;
  whatsappUrl: string | null;
}) {
  return (
    <div className="card-glam relative flex flex-1 flex-col justify-center overflow-hidden p-8 sm:p-12">
      <div className="absolute -right-20 -top-20 size-64 rounded-full bg-gold-gradient-soft opacity-50 blur-3xl" />
      <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Solicitud enviada
      </p>
      <h2 className="relative mt-3 font-serif text-4xl text-gold-gradient sm:text-5xl">
        ¡Listo!
      </h2>
      <p className="relative mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        Tu reserva quedó como <strong>pendiente</strong>. El salón te contactará
        para confirmarla. Si la ventana de WhatsApp no se abrió, puedes
        enviarles el mensaje manualmente:
      </p>
      <div className="relative mt-8 flex flex-wrap gap-3">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({
              size: "lg",
              className: "rounded-full uppercase tracking-wider",
            })}
          >
            Abrir WhatsApp
          </a>
        )}
        <Link
          href={`/s/${salonSlug}`}
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "rounded-full uppercase tracking-wider",
          })}
        >
          Volver al salón
        </Link>
      </div>
    </div>
  );
}
