"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Tag,
  Users,
  XIcon,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EVENT_TYPE_LABEL,
  type SalonEvent,
  type SalonEventType,
} from "@/lib/types";

const TYPE_COLOR: Record<SalonEventType, [number, number, number]> = {
  course: [167, 139, 250],
  event: [251, 113, 133],
  workshop: [56, 189, 248],
};

const SWIPE_THRESHOLD_PX = 50;
const AUTOPLAY_INTERVAL_MS = 7000;

export function EventsSection({
  events,
  whatsapp,
}: {
  events: SalonEvent[];
  whatsapp: string | null;
}) {
  const [index, setIndex] = useState(0);
  // Permanente: el usuario tomó control (clickeó flecha/dot o hizo swipe).
  const [autoStopped, setAutoStopped] = useState(false);
  // Temporal: el mouse está encima — pausa mientras hovera, retoma al salir.
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [detail, setDetail] = useState<SalonEvent | null>(null);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const total = events.length;
  const safeIndex = total > 0 ? ((index % total) + total) % total : 0;
  const hasMultiple = total > 1;
  const isPlaying =
    hasMultiple && !autoStopped && !hovering && !reducedMotion;

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setIndex((i) => i + 1);
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  if (events.length === 0) return null;

  function prev() {
    setIndex((i) => i - 1);
    setAutoStopped(true);
  }
  function next() {
    setIndex((i) => i + 1);
    setAutoStopped(true);
  }
  function jumpTo(i: number) {
    setIndex(i);
    setAutoStopped(true);
  }
  function onTouchStart(e: React.TouchEvent) {
    touchStartRef.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (start === null) return;
    const delta = e.changedTouches[0].clientX - start;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    setAutoStopped(true);
    if (delta > 0) setIndex((i) => i - 1);
    else setIndex((i) => i + 1);
  }

  return (
    <div className="mt-10">
      <div
        className="relative"
        aria-roledescription="carousel"
        aria-label="Cursos y eventos del salón"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div
          className="relative overflow-hidden rounded-2xl"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${safeIndex * 100}%)` }}
          >
            {events.map((e, i) => (
              <div
                key={e.id}
                role="group"
                aria-roledescription="diapositiva"
                className="w-full shrink-0"
              >
                <EventCard
                  event={e}
                  whatsapp={whatsapp}
                  onOpenDetail={() => setDetail(e)}
                  isActive={i === safeIndex}
                  slideKey={safeIndex}
                />
              </div>
            ))}
          </div>

          {hasMultiple && (
            <>
              <CarouselButton dir="prev" onClick={prev} />
              <CarouselButton dir="next" onClick={next} />
            </>
          )}

          {hasMultiple && isPlaying && (
            <AutoplayProgress
              key={safeIndex}
              durationMs={AUTOPLAY_INTERVAL_MS}
            />
          )}
        </div>

        {hasMultiple && (
          <CarouselDots count={total} active={safeIndex} onSelect={jumpTo} />
        )}
      </div>

      <EventDetailDialog
        event={detail}
        whatsapp={whatsapp}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

function AutoplayProgress({ durationMs }: { durationMs: number }) {
  // Barra de progreso delgada en el borde inferior que se llena durante
  // el intervalo de autoplay. Se reinicia con cada slide via key={}.
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-0.5 overflow-hidden">
      <div
        className="h-full origin-left bg-primary/70"
        style={{
          animation: `event-autoplay-progress ${durationMs}ms linear forwards`,
        }}
      />
    </div>
  );
}

function EventCard({
  event: e,
  whatsapp,
  onOpenDetail,
  isActive,
  slideKey,
}: {
  event: SalonEvent;
  whatsapp: string | null;
  onOpenDetail: () => void;
  isActive: boolean;
  slideKey: number;
}) {
  const [r, g, b] = TYPE_COLOR[e.type];
  const rgb = `${r}, ${g}, ${b}`;
  const whatsappLink = buildWhatsappLink(whatsapp, e);

  return (
    <>
      {/* === Mobile / tablet card (estilo actual) === */}
      <article
        className="card-glam group relative flex flex-col overflow-hidden lg:hidden"
        style={{ borderColor: `rgba(${rgb}, 0.3)` }}
      >
        <button
          type="button"
          onClick={onOpenDetail}
          aria-label={`Ver detalle de ${e.title}`}
          className="absolute inset-0 z-10"
        />

        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {e.cover_image_url ? (
            <Image
              src={e.cover_image_url}
              alt={e.title}
              fill
              sizes="100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <DecorativeBackdrop rgb={rgb} />
          )}
          <span
            className="absolute left-3 top-3 z-[1] rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-md"
            style={{
              borderColor: `rgba(${rgb}, 0.6)`,
              backgroundColor: `rgba(${rgb}, 0.18)`,
              color: `rgb(${rgb})`,
            }}
          >
            {EVENT_TYPE_LABEL[e.type]}
          </span>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="font-serif text-xl leading-tight">{e.title}</h3>
          <EventMetaList event={e} />
          {e.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {e.description}
            </p>
          )}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(ev) => ev.stopPropagation()}
              className="relative z-20 mt-auto inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-400 transition-colors hover:border-emerald-500 hover:bg-emerald-500/20"
            >
              <WhatsAppIcon /> Quiero info
            </a>
          )}
        </div>
      </article>

      {/* === Desktop banner ancho === */}
      <article
        className="relative hidden aspect-[21/9] w-full overflow-hidden rounded-2xl border shadow-glam lg:block"
        style={{ borderColor: `rgba(${rgb}, 0.4)` }}
      >
        <button
          type="button"
          onClick={onOpenDetail}
          aria-label={`Ver detalle de ${e.title}`}
          className="absolute inset-0 z-10"
        />

        {e.cover_image_url ? (
          <div className="event-banner-kenburns absolute inset-0">
            <Image
              src={e.cover_image_url}
              alt={e.title}
              fill
              sizes="100vw"
              className="object-cover"
              unoptimized
              priority
            />
          </div>
        ) : (
          <DecorativeBackdrop rgb={rgb} />
        )}

        {/* Gradiente diagonal para contraste del contenido */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(12,9,5,0.92) 0%, rgba(12,9,5,0.72) 35%, rgba(12,9,5,0.25) 65%, transparent 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 to-transparent"
        />
        {/* Acento dorado sutil en la esquina */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(212,175,55,0.14), transparent 55%)",
          }}
        />

        {/* Contenido — keyed para que la entrada animada se dispare al
            cambiar de slide. Inactivo: key estable, sin animación. */}
        <div
          key={isActive ? `c-${slideKey}` : `c-off-${e.id}`}
          className={`absolute inset-0 flex items-center p-10 xl:p-14 ${
            isActive ? "event-banner-content-enter" : ""
          }`}
        >
          <div className="max-w-xl">
            <span
              className="inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-md"
              style={{
                borderColor: `rgba(${rgb}, 0.7)`,
                backgroundColor: `rgba(${rgb}, 0.22)`,
                color: `rgb(${rgb})`,
              }}
            >
              {EVENT_TYPE_LABEL[e.type]}
            </span>
            <h3 className="mt-4 font-serif text-4xl leading-tight text-white drop-shadow-lg xl:text-5xl">
              {e.title}
            </h3>
            <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/90">
              <li className="inline-flex items-center gap-2">
                <CalendarDays className="size-4 shrink-0 text-primary" />
                <span>{formatRange(e.starts_at, e.ends_at)}</span>
              </li>
              {e.price != null && (
                <li className="inline-flex items-center gap-2">
                  <Tag className="size-4 shrink-0 text-primary" />
                  <span className="font-medium">
                    {e.price.toLocaleString("es-CL")} {e.currency}
                  </span>
                </li>
              )}
              {e.capacity_label && (
                <li className="inline-flex items-center gap-2">
                  <Users className="size-4 shrink-0 text-primary" />
                  <span>{e.capacity_label}</span>
                </li>
              )}
            </ul>
            {e.description && (
              <p className="mt-4 line-clamp-2 max-w-lg text-sm leading-relaxed text-white/85 drop-shadow">
                {e.description}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(ev) => ev.stopPropagation()}
                  className="relative z-20 inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/20 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.15em] text-emerald-300 backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-emerald-500/30"
                >
                  <WhatsAppIcon /> Quiero info
                </a>
              )}
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onOpenDetail();
                }}
                className="relative z-20 inline-flex items-center gap-2 rounded-full border border-white/40 bg-background/20 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.15em] text-white backdrop-blur-md transition-all hover:scale-[1.02] hover:border-white hover:bg-background/40"
              >
                Ver detalle →
              </button>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

function EventMetaList({ event: e }: { event: SalonEvent }) {
  return (
    <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
      <li className="inline-flex items-center gap-2">
        <CalendarDays className="size-3.5 shrink-0 text-primary/80" />
        <span>{formatRange(e.starts_at, e.ends_at)}</span>
      </li>
      {e.price != null && (
        <li className="inline-flex items-center gap-2">
          <Tag className="size-3.5 shrink-0 text-primary/80" />
          <span className="font-medium text-foreground">
            {e.price.toLocaleString("es-CL")} {e.currency}
          </span>
        </li>
      )}
      {e.capacity_label && (
        <li className="inline-flex items-center gap-2">
          <Users className="size-3.5 shrink-0 text-primary/80" />
          <span>{e.capacity_label}</span>
        </li>
      )}
    </ul>
  );
}

function DecorativeBackdrop({ rgb }: { rgb: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(135deg, rgba(${rgb}, 0.45), rgba(${rgb}, 0.12) 50%, transparent), radial-gradient(ellipse at top right, rgba(212,175,55,0.22), transparent 55%)`,
      }}
    />
  );
}

function CarouselButton({
  dir,
  onClick,
}: {
  dir: "prev" | "next";
  onClick: () => void;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Evento anterior" : "Evento siguiente"}
      className={`absolute top-1/2 z-30 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/55 text-foreground ring-1 ring-foreground/15 backdrop-blur-md transition-all hover:scale-105 hover:bg-background/85 active:scale-95 sm:size-11 ${
        dir === "prev" ? "left-3 sm:left-4" : "right-3 sm:right-4"
      }`}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

function CarouselDots({
  count,
  active,
  onSelect,
}: {
  count: number;
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="mt-4 flex justify-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Ir al evento ${i + 1}`}
          aria-current={i === active}
          className={`h-1.5 rounded-full transition-all ${
            i === active
              ? "w-8 bg-primary"
              : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
          }`}
        />
      ))}
    </div>
  );
}

function EventDetailDialog({
  event: e,
  whatsapp,
  onClose,
}: {
  event: SalonEvent | null;
  whatsapp: string | null;
  onClose: () => void;
}) {
  // Mantiene el último evento mostrado para que el contenido no parpadee
  // a vacío durante la animación de cierre del diálogo.
  const [snap, setSnap] = useState<SalonEvent | null>(e);
  useEffect(() => {
    if (e) setSnap(e);
  }, [e]);

  const open = e !== null;
  if (!snap) return null;
  const current = snap;

  const [r, g, b] = TYPE_COLOR[current.type];
  const rgb = `${r}, ${g}, ${b}`;
  const whatsappLink = buildWhatsappLink(whatsapp, current);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">{current.title}</DialogTitle>

        <DialogClose
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-30 grid size-9 place-items-center rounded-full bg-background/55 text-foreground ring-1 ring-foreground/15 backdrop-blur-md transition-all hover:scale-105 hover:bg-background/85 active:scale-95"
        >
          <XIcon className="size-4" />
          <span className="sr-only">Cerrar</span>
        </DialogClose>

        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <div className="relative w-full bg-muted aspect-[16/10]">
            {current.cover_image_url ? (
              <Image
                src={current.cover_image_url}
                alt={current.title}
                fill
                sizes="(max-width: 640px) 100vw, 672px"
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <DecorativeBackdrop rgb={rgb} />
            )}

            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at top right, rgba(212,175,55,0.16), transparent 55%)",
              }}
            />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent px-5 pb-5 pt-20 sm:px-7 sm:pb-6">
              <span
                className="inline-block rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-md"
                style={{
                  borderColor: `rgba(${rgb}, 0.6)`,
                  backgroundColor: `rgba(${rgb}, 0.2)`,
                  color: `rgb(${rgb})`,
                }}
              >
                {EVENT_TYPE_LABEL[current.type]}
              </span>
              <h2 className="mt-3 font-serif text-2xl leading-tight text-white drop-shadow-lg sm:text-3xl">
                {current.title}
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-5 p-5 sm:p-7">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetaCard
                icon={<CalendarDays className="size-4" />}
                label="Cuándo"
              >
                {formatRange(current.starts_at, current.ends_at)}
              </MetaCard>
              {current.price != null ? (
                <MetaCard icon={<Tag className="size-4" />} label="Precio">
                  <span className="font-medium">
                    {current.price.toLocaleString("es-CL")} {current.currency}
                  </span>
                </MetaCard>
              ) : (
                <MetaCard icon={<Tag className="size-4" />} label="Precio">
                  Consultar
                </MetaCard>
              )}
              <MetaCard icon={<Users className="size-4" />} label="Cupos">
                {current.capacity_label ?? "Consultar disponibilidad"}
              </MetaCard>
            </ul>

            {current.description && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Detalles
                </p>
                <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                  {current.description}
                </p>
              </div>
            )}

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gold-gradient inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-sm font-bold uppercase tracking-[0.15em] text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/50 hover:brightness-110"
              >
                <WhatsAppIcon /> Quiero info por WhatsApp
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetaCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-xl border border-border bg-muted/40 p-3.5">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-sm leading-snug text-foreground/90">
        {children}
      </p>
    </li>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4"
      fill="currentColor"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.97L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 1.67c2.21 0 4.28.86 5.84 2.42a8.215 8.215 0 0 1 2.42 5.83c0 4.54-3.7 8.24-8.25 8.24-1.51 0-2.99-.41-4.28-1.18l-.31-.18-3.18.83.85-3.11-.2-.32a8.214 8.214 0 0 1-1.27-4.4c.01-4.54 3.7-8.13 8.18-8.13zM8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.74 2.77 4.31 3.78 2.13.84 2.56.67 3.02.63.47-.04 1.5-.61 1.71-1.21.21-.59.21-1.1.15-1.21-.06-.11-.22-.16-.46-.28-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.61.78-.75.94-.14.16-.27.18-.51.06-.24-.12-1.02-.38-1.95-1.2-.72-.64-1.21-1.43-1.35-1.67-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.29-.74-1.77-.19-.46-.39-.4-.54-.4-.14 0-.3-.02-.46-.02z" />
    </svg>
  );
}

// === Helpers ================================================================

function buildWhatsappLink(
  whatsapp: string | null,
  event: SalonEvent,
): string | null {
  if (!whatsapp) return null;
  const number = whatsapp.replace(/\D/g, "");
  if (!number) return null;
  const message =
    event.whatsapp_message?.trim() ||
    `Hola, quiero info sobre "${event.title}".`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function formatRange(startsIso: string, endsIso: string | null): string {
  const starts = new Date(startsIso);
  const ends = endsIso ? new Date(endsIso) : null;

  const dateFmt = new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
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
