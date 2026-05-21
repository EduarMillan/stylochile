"use client";

import { CalendarDays } from "lucide-react";
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

export function EventsRibbon({ next }: { next: SalonEvent }) {
  const [r, g, b] = TYPE_COLOR[next.type];
  const rgb = `${r}, ${g}, ${b}`;

  function handleClick(ev: React.MouseEvent) {
    ev.preventDefault();
    document
      .getElementById("eventos")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative mt-6 inline-flex max-w-full items-center gap-3 overflow-hidden rounded-full border bg-background/30 px-4 py-2 text-left text-xs backdrop-blur-md transition-all hover:scale-[1.01]"
      style={{
        borderColor: `rgba(${rgb}, 0.45)`,
        boxShadow: `0 0 0 1px rgba(${rgb}, 0.08), 0 8px 30px -10px rgba(${rgb}, 0.35)`,
      }}
    >
      {/* Glow animado detrás */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60 blur-2xl"
        style={{
          background: `radial-gradient(ellipse at left, rgba(${rgb}, 0.5), transparent 60%)`,
        }}
      />

      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-full"
        style={{
          backgroundColor: `rgba(${rgb}, 0.2)`,
          color: `rgb(${rgb})`,
        }}
      >
        <CalendarDays className="size-3.5" />
      </span>

      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className="font-bold uppercase tracking-[0.18em]"
          style={{ color: `rgb(${rgb})` }}
        >
          Próximo {EVENT_TYPE_LABEL[next.type].toLowerCase()}
        </span>
        <span aria-hidden className="text-muted-foreground">
          ·
        </span>
        <span className="truncate text-foreground">{next.title}</span>
        <span aria-hidden className="hidden text-muted-foreground sm:inline">
          ·
        </span>
        <span className="hidden whitespace-nowrap text-muted-foreground sm:inline">
          {formatRelative(next.starts_at)}
        </span>
      </span>

      <span className="text-primary opacity-80 transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </button>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.round((d.getTime() - now.getTime()) / 86_400_000);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days <= 7) {
    return new Intl.DateTimeFormat("es-CL", {
      weekday: "long",
    }).format(d);
  }
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
  }).format(d);
}
