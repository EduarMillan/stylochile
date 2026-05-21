"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { CalendarDays, Tag, Users } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";
import {
  EVENT_TYPE_LABEL,
  type SalonEvent,
  type SalonEventType,
} from "@/lib/types";
import {
  deleteEventAction,
  saveEventAction,
  type EventActionState,
} from "./actions";

const CURRENCIES = ["CLP", "USD", "EUR"];

const TYPE_COLOR: Record<SalonEventType, [number, number, number]> = {
  course: [167, 139, 250], // violet-400
  event: [251, 113, 133], // rose-400
  workshop: [56, 189, 248], // sky-400
};

type Filter = "upcoming" | "past" | "drafts";

export function EventsManager({
  salonId,
  events,
  hasWhatsapp,
}: {
  salonId: string;
  events: SalonEvent[];
  hasWhatsapp: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("upcoming");

  const { upcoming, past, drafts } = useMemo(() => {
    const now = Date.now();
    const upcoming: SalonEvent[] = [];
    const past: SalonEvent[] = [];
    const drafts: SalonEvent[] = [];
    for (const e of events) {
      if (!e.is_published) {
        drafts.push(e);
        continue;
      }
      const startsTs = new Date(e.starts_at).getTime();
      const endsTs = e.ends_at ? new Date(e.ends_at).getTime() : startsTs;
      if (endsTs < now) past.push(e);
      else upcoming.push(e);
    }
    past.sort(
      (a, b) =>
        new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
    );
    return { upcoming, past, drafts };
  }, [events]);

  const visible =
    filter === "past" ? past : filter === "drafts" ? drafts : upcoming;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <EventDialog salonId={salonId} />
        {!hasWhatsapp && (
          <p className="text-xs text-amber-400">
            Tip: configura tu WhatsApp en Configuración para que el botón
            "Quiero info" funcione en tu vitrina pública.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterButton
          active={filter === "upcoming"}
          onClick={() => setFilter("upcoming")}
        >
          Próximos ({upcoming.length})
        </FilterButton>
        <FilterButton
          active={filter === "past"}
          onClick={() => setFilter("past")}
        >
          Pasados ({past.length})
        </FilterButton>
        <FilterButton
          active={filter === "drafts"}
          onClick={() => setFilter("drafts")}
        >
          Borradores ({drafts.length})
        </FilterButton>
      </div>

      {visible.length === 0 ? (
        <div className="card-glam p-10 text-center">
          <p className="font-serif text-xl text-muted-foreground">
            {filter === "upcoming"
              ? "Aún no tienes eventos próximos"
              : filter === "past"
                ? "Sin eventos pasados"
                : "Sin borradores"}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              salonId={salonId}
              isPast={filter === "past"}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-all ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function EventRow({
  event: e,
  salonId,
  isPast,
}: {
  event: SalonEvent;
  salonId: string;
  isPast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [r, g, b] = TYPE_COLOR[e.type];
  const rgb = `${r}, ${g}, ${b}`;

  function remove() {
    if (!confirm(`¿Eliminar "${e.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteEventAction(e.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  return (
    <li
      className="relative grid grid-cols-1 gap-4 overflow-hidden rounded-2xl border bg-card/70 p-5 sm:grid-cols-[120px_1fr_auto] sm:items-center"
      style={{
        borderColor: `rgba(${rgb}, 0.25)`,
        backgroundImage: `linear-gradient(135deg, rgba(${rgb}, 0.05), transparent 60%)`,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: `rgb(${rgb})` }}
      />

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted sm:aspect-square sm:w-[120px]">
        {e.cover_image_url ? (
          <Image
            src={e.cover_image_url}
            alt={e.title}
            fill
            sizes="120px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.15em]"
            style={{ color: `rgb(${rgb})` }}
          >
            {EVENT_TYPE_LABEL[e.type]}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{
              borderColor: `rgba(${rgb}, 0.5)`,
              backgroundColor: `rgba(${rgb}, 0.12)`,
              color: `rgb(${rgb})`,
            }}
          >
            {EVENT_TYPE_LABEL[e.type]}
          </span>
          {isPast && (
            <span className="rounded-full border border-muted-foreground/40 bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Pasado
            </span>
          )}
          {!e.is_published && (
            <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">
              Borrador
            </span>
          )}
        </div>
        <h3 className="mt-2 font-serif text-xl leading-tight">{e.title}</h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatRange(e.starts_at, e.ends_at)}
          </span>
          {e.price != null && (
            <span className="inline-flex items-center gap-1.5">
              <Tag className="size-3.5" />
              {e.price.toLocaleString("es-CL")} {e.currency}
            </span>
          )}
          {e.capacity_label && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" />
              {e.capacity_label}
            </span>
          )}
        </div>
        {e.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {e.description}
          </p>
        )}
      </div>

      <div className="flex gap-1.5 sm:flex-col">
        <EventDialog salonId={salonId} initial={e} />
        <Button
          variant="ghost"
          size="sm"
          onClick={remove}
          disabled={pending}
          className="text-destructive hover:text-destructive"
        >
          Eliminar
        </Button>
      </div>
    </li>
  );
}

function EventDialog({
  salonId,
  initial,
}: {
  salonId: string;
  initial?: SalonEvent;
}) {
  const [open, setOpen] = useState(false);
  // Snapshot estable de `initial` mientras el diálogo está abierto. Se
  // refresca al cerrar para que la próxima apertura muestre datos frescos.
  const [snap, setSnap] = useState(initial);

  const [type, setType] = useState<SalonEventType>(snap?.type ?? "event");
  const [currency, setCurrency] = useState(snap?.currency ?? "CLP");
  const [coverUrl, setCoverUrl] = useState<string | null>(
    snap?.cover_image_url ?? null,
  );
  const [isPublished, setIsPublished] = useState(snap?.is_published ?? true);

  const [state, action, pending] = useActionState<EventActionState, FormData>(
    saveEventAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  useEffect(() => {
    if (!open) {
      setSnap(initial);
      setType(initial?.type ?? "event");
      setCurrency(initial?.currency ?? "CLP");
      setCoverUrl(initial?.cover_image_url ?? null);
      setIsPublished(initial?.is_published ?? true);
    }
  }, [open, initial]);

  const triggerLabel = initial ? "Editar" : "Nuevo evento";
  const triggerProps = initial
    ? {
        variant: "outline" as const,
        size: "sm" as const,
        className: "",
      }
    : {
        variant: "default" as const,
        size: "default" as const,
        className: "px-6 py-3 uppercase tracking-wider",
      };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({
          variant: triggerProps.variant,
          size: triggerProps.size,
          className: triggerProps.className,
        })}
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {initial ? "Editar evento" : "Nuevo evento"}
          </DialogTitle>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-5">
          {snap && <input type="hidden" name="id" value={snap.id} />}
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="currency" value={currency} />
          <input type="hidden" name="cover_image_url" value={coverUrl ?? ""} />

          {/* Imagen */}
          <div>
            <Label className="text-xs uppercase tracking-[0.15em]">
              Imagen del evento (opcional)
            </Label>
            <div className="mt-2">
              <ImageUpload
                salonId={salonId}
                folder="events"
                value={coverUrl}
                onChange={setCoverUrl}
                label="Imagen"
                aspect="wide"
              />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Formato horizontal panorámico (16:10). Lo que veas aquí es lo
              que verán los clientes en la vitrina.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Título
              </Label>
              <Input
                name="title"
                required
                defaultValue={snap?.title ?? ""}
                placeholder="Ej. Curso de Balayage profesional"
                maxLength={140}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Tipo
              </Label>
              <Select
                value={type}
                onValueChange={(v) => setType((v as SalonEventType) ?? "event")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Curso</SelectItem>
                  <SelectItem value="event">Evento</SelectItem>
                  <SelectItem value="workshop">Taller</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-[0.15em]">
              Descripción
            </Label>
            <Textarea
              name="description"
              rows={3}
              defaultValue={snap?.description ?? ""}
              placeholder="Qué aprenderán, quién lo imparte, materiales incluidos…"
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Inicia
              </Label>
              <Input
                name="starts_at"
                type="datetime-local"
                required
                defaultValue={toLocalInput(snap?.starts_at)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Termina (opcional)
              </Label>
              <Input
                name="ends_at"
                type="datetime-local"
                defaultValue={toLocalInput(snap?.ends_at ?? null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px_1fr]">
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Precio (opcional)
              </Label>
              <Input
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={snap?.price ?? ""}
                placeholder="25000"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Moneda
              </Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v ?? "CLP")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Cupos (texto libre)
              </Label>
              <Input
                name="capacity_label"
                defaultValue={snap?.capacity_label ?? ""}
                placeholder='Ej. "12 plazas"'
                maxLength={60}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-[0.15em]">
              Mensaje pre-rellenado para WhatsApp (opcional)
            </Label>
            <Input
              name="whatsapp_message"
              defaultValue={snap?.whatsapp_message ?? ""}
              placeholder='Si lo dejas vacío usamos: "Hola, quiero info sobre [título]"'
              maxLength={500}
            />
          </div>

          {/* Publicar */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card/40 px-4 py-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-primary">
                {isPublished ? "● Visible al público" : "○ Borrador"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isPublished
                  ? "Aparece en tu vitrina pública."
                  : "Solo tú lo ves. Actívalo cuando esté listo."}
              </p>
            </div>
            <Switch
              name="is_published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// === Helpers ================================================================

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRange(startsIso: string, endsIso: string | null): string {
  const starts = new Date(startsIso);
  const ends = endsIso ? new Date(endsIso) : null;

  const dateFmt = new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const sameDay =
    ends &&
    starts.getFullYear() === ends.getFullYear() &&
    starts.getMonth() === ends.getMonth() &&
    starts.getDate() === ends.getDate();

  if (!ends) {
    return `${dateFmt.format(starts)} · ${timeFmt.format(starts)}`;
  }
  if (sameDay) {
    return `${dateFmt.format(starts)} · ${timeFmt.format(starts)} – ${timeFmt.format(ends)}`;
  }
  return `${dateFmt.format(starts)} – ${dateFmt.format(ends)}`;
}
