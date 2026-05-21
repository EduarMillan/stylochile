"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
        <DialogContent className="max-w-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="sr-only">{s.name}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[200px_minmax(0,1fr)]">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted">
              {s.photo_url ? (
                <Image
                  src={s.photo_url}
                  alt={s.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 200px"
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

            <div className="flex min-w-0 flex-col gap-3">
              <div>
                <h2 className="font-serif text-2xl leading-tight sm:text-3xl">
                  {s.name}
                </h2>
                {s.role && (
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                    {s.role}
                  </p>
                )}
                {area && (
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {area.name}
                  </p>
                )}
              </div>

              {s.instagram_handle && (
                <a
                  href={`https://instagram.com/${s.instagram_handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 self-start text-sm text-foreground/80 transition-colors hover:text-primary"
                >
                  <InstagramIcon />
                  <span>@{s.instagram_handle}</span>
                </a>
              )}

              {s.specialties.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Especialidades
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {s.specialties.map((sp) => (
                      <li
                        key={sp}
                        className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] text-foreground/80"
                      >
                        {sp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {s.certifications && (
            <div className="mt-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Certificaciones
              </p>
              <p className="mt-2 whitespace-pre-line text-sm italic leading-relaxed text-foreground/85">
                {s.certifications}
              </p>
            </div>
          )}

          {s.bio && (
            <div className="mt-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Sobre {s.name.split(" ")[0]}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {s.bio}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
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
