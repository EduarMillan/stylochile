"use client";

import { useState } from "react";
import {
  startOfDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  isSameDay,
  isBefore,
} from "date-fns";
import { isClosedOn } from "@/lib/slots";
import type { WeeklyHours } from "@/lib/types";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function MonthCalendar({
  hours,
  selected,
  onSelect,
  monthsAhead = 2,
}: {
  hours: WeeklyHours | null;
  selected: Date | null;
  onSelect: (d: Date) => void;
  monthsAhead?: number;
}) {
  const today = startOfDay(new Date());
  const [viewMonth, setViewMonth] = useState<Date>(
    selected ? startOfMonth(selected) : startOfMonth(today),
  );

  const minMonth = startOfMonth(today);
  const maxMonth = startOfMonth(addMonths(today, monthsAhead));
  const canGoPrev = viewMonth.getTime() > minMonth.getTime();
  const canGoNext = viewMonth.getTime() < maxMonth.getTime();

  const monthLabel = viewMonth.toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });

  // Construye la cuadrícula con padding del lunes al inicio
  const firstDay = viewMonth;
  const lastDay = endOfMonth(viewMonth);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Lun=0 … Dom=6
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="card-glam w-full max-w-md p-6">
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => canGoPrev && setViewMonth(addMonths(viewMonth, -1))}
          disabled={!canGoPrev}
          aria-label="Mes anterior"
          className="size-9 rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          ‹
        </button>
        <h3 className="font-serif text-xl capitalize">{monthLabel}</h3>
        <button
          type="button"
          onClick={() => canGoNext && setViewMonth(addMonths(viewMonth, 1))}
          disabled={!canGoNext}
          aria-label="Mes siguiente"
          className="size-9 rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <span
            key={w}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
          >
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} className="aspect-square" />;
          const past = isBefore(d, today);
          const closed = isClosedOn(hours, d);
          const isToday = isSameDay(d, today);
          const isSelected = selected ? isSameDay(d, selected) : false;
          const disabled = past || closed;

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(d)}
              className={
                isSelected
                  ? "bg-gold-gradient aspect-square rounded-xl text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/40 transition-all"
                  : disabled
                    ? "aspect-square rounded-xl text-sm text-muted-foreground/30 line-through"
                    : isToday
                      ? "aspect-square rounded-xl border border-primary/60 text-sm font-semibold text-primary transition-all hover:bg-primary/10"
                      : "aspect-square rounded-xl text-sm text-foreground transition-all hover:bg-muted hover:ring-1 hover:ring-primary/40"
              }
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="bg-gold-gradient size-2.5 rounded-full" />
          Selección
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border border-primary" />
          Hoy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          Cerrado / pasado
        </span>
      </div>
    </div>
  );
}
