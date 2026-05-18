"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import {
  STATUS_LABEL,
  type Appointment,
  type AppointmentStatus,
  type SalonArea,
  type Service,
} from "@/lib/types";
import {
  whatsappLink,
  buildOwnerGreetingMessage,
  buildApprovalMessage,
  buildRejectionMessage,
} from "@/lib/whatsapp";
import { buildChilePhone, digitsOnly } from "@/lib/phone";
import {
  deleteAppointmentAction,
  setAppointmentStatusAction,
} from "./actions";

type AppointmentWithRefs = Appointment & {
  area: SalonArea | null;
  service: Service | null;
};

// Normaliza para búsqueda: minúsculas + sin diacríticos. Así "María"
// matchea con "maria" y viceversa.
function norm(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function AgendaList({
  salonName,
  appointments,
  areas,
  services,
}: {
  salonName: string;
  appointments: Appointment[];
  areas: SalonArea[];
  services: Service[];
}) {
  const [filter, setFilter] = useState<"upcoming" | "pending" | "all">(
    "upcoming",
  );
  const [query, setQuery] = useState("");

  const enriched = useMemo<AppointmentWithRefs[]>(
    () =>
      appointments.map((a) => ({
        ...a,
        area: areas.find((x) => x.id === a.area_id) ?? null,
        service: services.find((x) => x.id === a.service_id) ?? null,
      })),
    [appointments, areas, services],
  );

  const byTab = useMemo(() => {
    const now = Date.now();
    if (filter === "pending")
      return enriched.filter((a) => a.status === "pending");
    if (filter === "upcoming")
      return enriched.filter(
        (a) =>
          new Date(a.starts_at).getTime() > now &&
          (a.status === "pending" || a.status === "approved"),
      );
    return enriched;
  }, [enriched, filter]);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return byTab;
    return byTab.filter((a) => {
      const haystack = [
        a.client_name,
        a.client_phone,
        a.service?.name,
        a.area?.name,
        a.client_notes,
      ]
        .map(norm)
        .join(" ");
      return haystack.includes(q);
    });
  }, [byTab, query]);

  const counts = useMemo(() => {
    const now = Date.now();
    return {
      pending: enriched.filter((a) => a.status === "pending").length,
      upcoming: enriched.filter(
        (a) =>
          new Date(a.starts_at).getTime() > now &&
          (a.status === "pending" || a.status === "approved"),
      ).length,
      all: enriched.length,
    };
  }, [enriched]);

  const hasResults = filtered.length > 0;
  const searching = query.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <FilterTab
          label={`Próximas (${counts.upcoming})`}
          active={filter === "upcoming"}
          onClick={() => setFilter("upcoming")}
        />
        <FilterTab
          label={`Pendientes (${counts.pending})`}
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
        />
        <FilterTab
          label={`Todas (${counts.all})`}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
      </div>

      <div className="relative max-w-md">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono, servicio…"
          className="pr-10"
          aria-label="Buscar reservas"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>

      <Separator className="bg-border" />

      {!hasResults ? (
        <p className="text-sm text-muted-foreground">
          {searching
            ? `Sin resultados para “${query.trim()}”.`
            : filter === "pending"
              ? "No tienes solicitudes pendientes."
              : filter === "upcoming"
                ? "No tienes citas próximas."
                : "Aún no hay citas registradas."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((a) => (
            <AppointmentRow
              key={a.id}
              appt={a}
              salonName={salonName}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
        active
          ? "border-b-2 border-primary text-primary"
          : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function AppointmentRow({
  appt,
  salonName,
}: {
  appt: AppointmentWithRefs;
  salonName: string;
}) {
  const [pending, startTransition] = useTransition();
  const start = new Date(appt.starts_at);
  const end = new Date(appt.ends_at);

  function setStatus(status: AppointmentStatus, reason?: string) {
    startTransition(async () => {
      const res = await setAppointmentStatusAction(appt.id, status, reason);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  function remove() {
    if (!confirm("¿Eliminar permanentemente esta cita?")) return;
    startTransition(async () => {
      const res = await deleteAppointmentAction(appt.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  // Normaliza al formato canónico +56XXXXXXXXX. Defensivo para
  // reservas viejas que pudieron guardarse antes de que el form forzara
  // el prefijo — así el link de WhatsApp y el display siempre quedan
  // bien.
  const normalizedPhone = buildChilePhone(appt.client_phone);
  const cleanPhone = digitsOnly(normalizedPhone);
  const hasPhone = cleanPhone.length > 0;
  const ctx = {
    salonName,
    clientName: appt.client_name,
    serviceName: appt.service?.name ?? null,
    areaName: appt.area?.name ?? null,
    start,
    notes: appt.client_notes,
  };

  // Plantilla genérica usada por el botón "WhatsApp" — pasa a un saludo
  // owner→cliente, no la antigua plantilla de cliente solicitando reserva.
  const replyLink = hasPhone
    ? whatsappLink(cleanPhone, buildOwnerGreetingMessage(ctx))
    : null;

  // Abrir WhatsApp tiene que ser síncrono dentro del click para evitar
  // bloqueos de popup en móvil. Por eso open va antes del startTransition.
  function approveAndNotify() {
    if (hasPhone) {
      window.open(
        whatsappLink(cleanPhone, buildApprovalMessage(ctx)),
        "_blank",
        "noopener,noreferrer",
      );
    }
    setStatus("approved");
  }

  function rejectAndNotify(reason: string) {
    if (hasPhone) {
      window.open(
        whatsappLink(cleanPhone, buildRejectionMessage({ ...ctx, reason })),
        "_blank",
        "noopener,noreferrer",
      );
    }
    setStatus("rejected", reason);
  }

  return (
    <li className="card-glam grid grid-cols-1 gap-4 p-6 transition-all hover:border-primary/40 md:grid-cols-[160px_1fr_auto] md:items-start">
      {/* Hora */}
      <div>
        <p className="font-serif text-2xl">
          {start.toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </p>
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
          {start.toLocaleDateString("es-CL", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {Math.round(
            (end.getTime() - start.getTime()) / 60_000,
          )}{" "}
          min
        </p>
      </div>

      {/* Detalle */}
      <div>
        <div className="flex items-center gap-3">
          <h3 className="font-serif text-xl">{appt.client_name}</h3>
          <StatusBadge status={appt.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {appt.service?.name ?? "Sin servicio asignado"}
          {appt.area && ` · ${appt.area.name}`}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
          {normalizedPhone || appt.client_phone}
        </p>
        {appt.client_notes && (
          <p className="mt-2 text-sm italic text-muted-foreground">
            “{appt.client_notes}”
          </p>
        )}
        {appt.rejection_reason && (
          <p className="mt-2 text-xs text-destructive">
            Rechazada: {appt.rejection_reason}
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2 md:justify-end">
        {appt.status === "pending" && (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={approveAndNotify}
            >
              {hasPhone ? "Aprobar y avisar" : "Aprobar"}
            </Button>
            <RejectDialog
              onConfirm={rejectAndNotify}
              willNotify={hasPhone}
            />
          </>
        )}
        {appt.status === "approved" && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setStatus("completed")}
          >
            Marcar completada
          </Button>
        )}
        {replyLink && (
          <a
            href={replyLink}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
            })}
          >
            WhatsApp
          </a>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={remove}
        >
          Eliminar
        </Button>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const styles: Record<AppointmentStatus, string> = {
    pending:
      "border-primary text-primary",
    approved: "border-primary bg-primary text-primary-foreground",
    rejected: "border-destructive text-destructive",
    completed: "border-muted-foreground text-muted-foreground",
    cancelled: "border-muted-foreground/50 text-muted-foreground/70",
  };
  return (
    <span
      className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] ${styles[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function RejectDialog({
  onConfirm,
  willNotify,
}: {
  onConfirm: (reason: string) => void;
  willNotify: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Rechazar
      </DialogTrigger>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Rechazar reserva
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label className="text-xs uppercase tracking-[0.15em]">
            Motivo (opcional)
          </Label>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej. ya tenemos otra reserva en ese horario."
          />
          {willNotify && (
            <p className="text-xs text-muted-foreground">
              Al confirmar, abriremos WhatsApp para que avises al cliente con
              el motivo.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm(reason);
              setOpen(false);
            }}
          >
            {willNotify ? "Rechazar y avisar" : "Confirmar rechazo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
