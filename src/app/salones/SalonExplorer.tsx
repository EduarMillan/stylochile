"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { composeAddress } from "@/lib/chile";
import { mapsLink } from "@/components/MapEmbed";
import { getOpenStatus, type OpenStatus } from "@/lib/hours";
import type { WeeklyHours } from "@/lib/types";

export type SalonCard = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  region: string | null;
  comuna: string | null;
  sector: string | null;
  calle: string | null;
  numero: string | null;
  logoUrl: string | null;
  hours: WeeklyHours | null;
  areas: string[];
  ratingAvg: number | null;
  ratingCount: number;
};

export function SalonExplorer({
  cards,
  regiones,
}: {
  cards: SalonCard[];
  regiones: string[];
}) {
  const [region, setRegion] = useState<string>("");
  const [query, setQuery] = useState("");
  // El badge abierto/cerrado se calcula en cliente para evitar mismatch de
  // hidratación (server podría tener otra zona horaria). Null hasta el
  // primer tick post-mount; luego se refresca cada minuto.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    let list = cards;
    if (region) {
      list = list.filter((c) => c.region === region);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        [c.name, c.description, c.sector, c.comuna]
          .filter(Boolean)
          .some((field) => (field as string).toLowerCase().includes(q)),
      );
    }
    return list;
  }, [cards, region, query]);

  return (
    <div className="flex flex-col gap-10">
      {/* Filtros */}
      <div className="card-glam grid gap-4 p-5 sm:grid-cols-[1fr_240px] sm:items-end sm:gap-5">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Buscar
          </label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, barrio, especialidad…"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Región
          </label>
          <div className="flex items-center gap-2">
            <Select
              value={region}
              onValueChange={(v) => setRegion(v ?? "")}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {regiones.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {region && (
              <button
                type="button"
                onClick={() => setRegion("")}
                aria-label="Limpiar filtro de región"
                className="size-9 rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
              >
                ×
              </button>
            )}
          </div>
        </div>
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground sm:col-span-2">
          {filtered.length} {filtered.length === 1 ? "salón encontrado" : "salones encontrados"}
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card-glam p-10 text-center sm:p-16">
          <p className="font-serif text-xl text-muted-foreground sm:text-2xl">
            {cards.length === 0
              ? "Aún no hay salones publicados"
              : "Ningún salón coincide con tu búsqueda"}
          </p>
          {cards.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              ¿Tienes un salón?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Regístralo gratis
              </Link>
              .
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} card={c} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ card, now }: { card: SalonCard; now: Date | null }) {
  const location = [card.sector, card.comuna, card.region]
    .filter(Boolean)
    .join(" · ");

  const openStatus: OpenStatus | null = now
    ? getOpenStatus(card.hours, now)
    : null;

  const directionsLink =
    card.calle || card.sector || card.comuna || card.region
      ? mapsLink(
          composeAddress({
            calle: card.calle,
            numero: card.numero,
            sector: card.sector,
            comuna: card.comuna,
            region: card.region,
          }),
        )
      : null;

  return (
    <Link
      href={`/s/${card.slug}`}
      className="card-glam card-glam-hover group relative flex flex-col gap-4 overflow-hidden p-7"
    >
      <div className="absolute -right-16 -top-16 size-40 rounded-full bg-gold-gradient-soft blur-3xl opacity-50 transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start gap-4">
        {card.logoUrl && (
          <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
            <Image
              src={card.logoUrl}
              alt={`Logo de ${card.name}`}
              fill
              sizes="56px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-serif text-2xl leading-tight">{card.name}</h3>
            {openStatus && <OpenBadge status={openStatus} />}
          </div>
          {location && (
            <p className="mt-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
              {location}
            </p>
          )}
        </div>
      </div>

      {card.description && (
        <p className="relative line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {card.description}
        </p>
      )}

      {card.areas.length > 0 && (
        <ul className="relative flex flex-wrap gap-1.5">
          {card.areas.slice(0, 4).map((a) => (
            <li
              key={a}
              className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-primary"
            >
              {a}
            </li>
          ))}
          {card.areas.length > 4 && (
            <li className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              +{card.areas.length - 4}
            </li>
          )}
        </ul>
      )}

      <div className="relative mt-auto flex items-center justify-between border-t border-border/60 pt-4">
        {card.ratingAvg !== null ? (
          <div className="flex items-center gap-2">
            <Stars value={card.ratingAvg} />
            <span className="text-xs">
              <span className="font-serif text-base text-gold-gradient">
                {card.ratingAvg.toFixed(1)}
              </span>
              <span className="ml-1 text-muted-foreground">
                ({card.ratingCount})
              </span>
            </span>
          </div>
        ) : (
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Sin reseñas aún
          </span>
        )}
        <div className="flex items-center gap-3">
          {directionsLink && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(directionsLink, "_blank", "noopener,noreferrer");
              }}
              aria-label={`Cómo llegar a ${card.name}`}
              className="inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-red-400 transition-colors hover:border-red-400 hover:bg-red-500/20"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              Cómo llegar
            </button>
          )}
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
            Ver →
          </span>
        </div>
      </div>
    </Link>
  );
}

function OpenBadge({ status }: { status: OpenStatus }) {
  if (status === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-400">
        <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
        Abierto
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-red-400">
      <span className="size-1.5 rounded-full bg-red-400" />
      Cerrado
    </span>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5 text-base leading-none">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={
            value >= n ? "text-gold-gradient" : "text-muted-foreground/30"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}
