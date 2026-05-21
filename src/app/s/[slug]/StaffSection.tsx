"use client";

import { useState } from "react";
import Image from "next/image";
import { XIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SalonArea, Staff } from "@/lib/types";

export function StaffSection({
  staff,
  areas,
}: {
  staff: Staff[];
  areas: SalonArea[];
}) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {staff.map((s) => {
        const area = areas.find((a) => a.id === s.area_id);
        return <StaffCard key={s.id} staff={s} area={area} />;
      })}
    </div>
  );
}

function StaffCard({
  staff: s,
  area,
}: {
  staff: Staff;
  area: SalonArea | undefined;
}) {
  const [open, setOpen] = useState(false);

  // Mostramos "Ver detalle" si hay info que la card recorta o esconde:
  // certificaciones, bio, muchas especialidades o años de experiencia.
  const hasMore = Boolean(
    s.bio || s.certifications || s.specialties.length > 3,
  );

  return (
    <>
      <article className="card-glam card-glam-hover flex flex-col overflow-hidden">
        <div className="relative aspect-square bg-muted">
          {s.photo_url ? (
            <Image
              src={s.photo_url}
              alt={s.name}
              fill
              sizes="(max-width: 640px) 50vw, 280px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Sin foto
            </div>
          )}
          {s.years_experience != null && (
            <span className="absolute right-3 top-3 rounded-full border border-primary/40 bg-background/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-primary backdrop-blur-md">
              {s.years_experience}+ años
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-serif text-lg leading-tight">{s.name}</h3>
            {s.instagram_handle && (
              <a
                href={`https://instagram.com/${s.instagram_handle}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Instagram de ${s.name}`}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <InstagramIcon />
              </a>
            )}
          </div>
          {s.role && (
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
              {s.role}
            </p>
          )}
          {area && (
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {area.name}
            </p>
          )}
          {s.specialties.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1">
              {s.specialties.slice(0, 3).map((sp) => (
                <li
                  key={sp}
                  className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-foreground/80"
                >
                  {sp}
                </li>
              ))}
              {s.specialties.length > 3 && (
                <li className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  +{s.specialties.length - 3}
                </li>
              )}
            </ul>
          )}
          {s.certifications && (
            <p className="mt-2 line-clamp-2 text-xs italic text-muted-foreground">
              {s.certifications}
            </p>
          )}
          {s.bio && (
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
              {s.bio}
            </p>
          )}

          {hasMore && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-auto self-start pt-3 text-[10px] font-bold uppercase tracking-[0.15em] text-primary transition-colors hover:underline"
            >
              Ver detalle →
            </button>
          )}
        </div>
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-lg gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-2xl"
        >
          <DialogTitle className="sr-only">{s.name}</DialogTitle>

          {/* Close flotante con backdrop-blur — visible sobre cualquier foto */}
          <DialogClose
            aria-label="Cerrar"
            className="absolute right-3 top-3 z-30 grid size-9 place-items-center rounded-full bg-background/55 text-foreground ring-1 ring-foreground/15 backdrop-blur-md transition-all hover:scale-105 hover:bg-background/85 active:scale-95"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Cerrar</span>
          </DialogClose>

          <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
            {/* Hero photo con gradiente y nombre superpuesto */}
            <div className="relative w-full bg-muted aspect-[4/3] sm:aspect-[16/10]">
              {s.photo_url ? (
                <Image
                  src={s.photo_url}
                  alt={s.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 672px"
                  className="object-cover"
                  unoptimized
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  Sin foto
                </div>
              )}

              {/* Capa dorada sutil en esquinas para detalle de lujo */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at top right, rgba(212,175,55,0.18), transparent 55%)",
                }}
              />

              {/* Gradiente inferior + nombre */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-5 pb-5 pt-20 sm:px-7 sm:pb-6">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-serif text-2xl leading-tight text-white drop-shadow-lg sm:text-3xl">
                      {s.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {s.role && (
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary drop-shadow">
                          {s.role}
                        </p>
                      )}
                      {area && (
                        <p className="text-[10px] uppercase tracking-[0.15em] text-white/75 drop-shadow">
                          · {area.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {s.years_experience != null && (
                    <span className="shrink-0 rounded-full border border-primary/60 bg-background/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-primary backdrop-blur-md">
                      {s.years_experience}+ años
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="flex flex-col gap-6 p-5 sm:p-7">
              {s.instagram_handle && (
                <a
                  href={`https://instagram.com/${s.instagram_handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm text-foreground/85 transition-colors hover:border-primary hover:text-primary"
                >
                  <InstagramIcon />
                  <span>@{s.instagram_handle}</span>
                </a>
              )}

              {s.specialties.length > 0 && (
                <DetailBlock label="Especialidades">
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {s.specialties.map((sp) => (
                      <li
                        key={sp}
                        className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-foreground/85"
                      >
                        {sp}
                      </li>
                    ))}
                  </ul>
                </DetailBlock>
              )}

              {s.certifications && (
                <DetailBlock label="Certificaciones">
                  <p className="mt-2.5 whitespace-pre-line text-sm italic leading-relaxed text-foreground/85">
                    {s.certifications}
                  </p>
                </DetailBlock>
              )}

              {s.bio && (
                <DetailBlock label={`Sobre ${s.name.split(" ")[0]}`}>
                  <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {s.bio}
                  </p>
                </DetailBlock>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
        {label}
      </p>
      {children}
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}
