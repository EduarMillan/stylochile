"use client";

import { useState } from "react";
import Image from "next/image";
import type { GalleryItem, SalonArea } from "@/lib/types";

const PAGE_SIZE = 4;

export function GalleryPaginated({
  items,
  areas,
}: {
  items: GalleryItem[];
  areas: SalonArea[];
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const visible = items.slice(start, start + PAGE_SIZE);

  return (
    <>
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((item) => {
          const area = areas.find((a) => a.id === item.area_id);
          const hasMeta = area || item.title || item.description;
          return (
            <article
              key={item.id}
              className="card-glam card-glam-hover overflow-hidden"
            >
              <div className="grid grid-cols-2">
                <BeforeAfterImage src={item.before_url} label="Antes" />
                <BeforeAfterImage
                  src={item.after_url}
                  label="Después"
                  gold
                />
              </div>
              {hasMeta && (
                <div className="p-4">
                  {area && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                      {area.name}
                    </p>
                  )}
                  {item.title && (
                    <h3 className="mt-1.5 font-serif text-base leading-tight">
                      {item.title}
                    </h3>
                  )}
                  {item.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Paginación de galería"
          className="mt-8 flex items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="inline-flex h-9 items-center justify-center rounded-full border border-primary/40 px-4 text-xs font-bold uppercase tracking-[0.15em] text-primary transition-colors hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Página anterior"
          >
            ← Anterior
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const isActive = idx === safePage;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPage(idx)}
                  aria-label={`Ir a página ${idx + 1}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`size-2 rounded-full transition-all ${
                    isActive
                      ? "w-6 bg-primary"
                      : "bg-muted-foreground/40 hover:bg-muted-foreground/70"
                  }`}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
            className="inline-flex h-9 items-center justify-center rounded-full border border-primary/40 px-4 text-xs font-bold uppercase tracking-[0.15em] text-primary transition-colors hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Página siguiente"
          >
            Siguiente →
          </button>
        </nav>
      )}
    </>
  );
}

function BeforeAfterImage({
  src,
  label,
  gold,
}: {
  src: string;
  label: string;
  gold?: boolean;
}) {
  return (
    <div className="relative aspect-square">
      <Image
        src={src}
        alt={label}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover"
        unoptimized
      />
      <span
        className={`absolute left-3 top-3 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${
          gold
            ? "bg-primary text-primary-foreground"
            : "bg-background/80 text-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
