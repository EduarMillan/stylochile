import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MapEmbed, mapsLink } from "@/components/MapEmbed";
import { PublicHeader } from "@/components/PublicHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ServicesTabs } from "./ServicesTabs";
import { GalleryPaginated } from "./GalleryPaginated";
import { StaffSection } from "./StaffSection";
import { composeAddress } from "@/lib/chile";
import {
  DAYS,
  type GalleryItem,
  type Review,
  type Salon,
  type SalonArea,
  type SalonFacilityPhoto,
  type Service,
  type Staff,
} from "@/lib/types";

// Tripletes RGB para la animación area-pulse. Cada chip rota por uno
// distinto vía idx % length. Se pasan como --pulse-r/g/b (propiedades
// registradas con @property como <number>) para que var() funcione
// correctamente dentro de @keyframes.
const AREA_PULSE_COLORS: ReadonlyArray<[number, number, number]> = [
  [251, 113, 133], // rose-400
  [56, 189, 248], // sky-400
  [167, 139, 250], // violet-400
  [52, 211, 153], // emerald-400
  [251, 146, 60], // orange-400
  [244, 114, 182], // pink-400
];

// Duración del ciclo de la animación area-pulse (debe coincidir con el
// valor en globals.css). El stagger se calcula como cycle / N para que la
// secuencia sea perfecta sin importar cuántas áreas haya.
const AREA_PULSE_CYCLE_MS = 6000;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("salons")
    .select("name, description, logo_url, comuna, region")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("suspended_at", null)
    .maybeSingle();

  if (!data) {
    return { title: "Salón no encontrado" };
  }

  const location = [data.comuna, data.region].filter(Boolean).join(", ");
  const title = `${data.name}${location ? ` · ${location}` : ""}`;
  const description =
    data.description ??
    `Conoce ${data.name}, salón de belleza en Chile. Servicios, fotos, horarios y reservas en StyloChile.`;

  return {
    title,
    description,
    alternates: { canonical: `/s/${slug}` },
    openGraph: {
      title,
      description,
      url: `/s/${slug}`,
      type: "website",
      ...(data.logo_url
        ? {
            images: [
              {
                url: data.logo_url,
                width: 400,
                height: 400,
                alt: `Logo de ${data.name}`,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: data.logo_url ? "summary_large_image" : "summary",
      title,
      description,
      ...(data.logo_url ? { images: [data.logo_url] } : {}),
    },
  };
}

export default async function SalonShowcasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: salonData } = await supabase
    .from("salons")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!salonData) notFound();
  const salon = salonData as Salon;

  const [
    { data: areas },
    { data: services },
    { data: gallery },
    { data: reviews },
    { data: staff },
    { data: facilityPhotos },
  ] = await Promise.all([
    supabase
      .from("salon_areas")
      .select("*")
      .eq("salon_id", salon.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("services")
      .select("*")
      .eq("salon_id", salon.id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("gallery_items")
      .select("*")
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("reviews")
      .select("*")
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("staff")
      .select("*")
      .eq("salon_id", salon.id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("salon_facility_photos")
      .select("*")
      .eq("salon_id", salon.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(18),
  ]);

  const areaList = (areas as SalonArea[]) ?? [];
  const serviceList = (services as Service[]) ?? [];
  const galleryList = (gallery as GalleryItem[]) ?? [];
  const reviewList = (reviews as Review[]) ?? [];
  const staffList = (staff as Staff[]) ?? [];
  const facilityList = (facilityPhotos as SalonFacilityPhoto[]) ?? [];

  const ratingAvg =
    reviewList.length > 0
      ? reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length
      : null;

  const fullAddress = composeAddress({
    calle: salon.calle,
    numero: salon.numero,
    sector: salon.sector,
    comuna: salon.comuna,
    region: salon.region,
  });
  const hasAddress = Boolean(
    salon.calle || salon.sector || salon.comuna || salon.region,
  );
  const directionsLink = hasAddress ? mapsLink(fullAddress) : null;
  const whatsappLink = salon.whatsapp
    ? `https://wa.me/${salon.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero con imagen de fondo */}
      <div className="relative isolate overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/salones.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        {/* Overlay degradado */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,9,5,0.55) 0%, rgba(12,9,5,0.78) 60%, rgba(12,9,5,0.97) 95%, rgba(12,9,5,1) 100%)",
          }}
        />
        {/* Vignette dorado en esquinas */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(212,175,55,0.10), transparent 55%), radial-gradient(ellipse at bottom left, rgba(212,175,55,0.07), transparent 60%)",
          }}
        />

        <PublicHeader />

        {/* Hero content */}
        <section className="relative px-4 py-12 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
          <Breadcrumbs
            items={[
              { label: "Salones", href: "/salones" },
              { label: salon.name },
            ]}
            className="mb-6"
          />
          <div className="flex items-start gap-4 sm:gap-6">
            {salon.logo_url && (
              <div className="relative size-20 shrink-0 overflow-hidden rounded-3xl border border-primary/40 bg-muted shadow-2xl shadow-primary/20 sm:size-24 lg:size-28">
                <Image
                  src={salon.logo_url}
                  alt={`Logo de ${salon.name}`}
                  fill
                  sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 112px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary drop-shadow">
                Salón de belleza · Chile
              </p>
              <h1 className="mt-2 font-serif text-4xl tracking-tight drop-shadow-lg sm:text-5xl lg:text-6xl">
                {salon.name}
              </h1>
            </div>
          </div>
          {ratingAvg !== null && (
            <div className="mt-5 flex items-center gap-3">
              <Stars value={ratingAvg} />
              <span className="text-sm">
                <span className="font-serif text-lg text-gold-gradient">
                  {ratingAvg.toFixed(1)}
                </span>{" "}
                <span className="text-foreground/70">
                  · {reviewList.length}{" "}
                  {reviewList.length === 1 ? "reseña" : "reseñas"}
                </span>
              </span>
            </div>
          )}
          {salon.description && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/85 drop-shadow">
              {salon.description}
            </p>
          )}
          {areaList.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {areaList.map((a, idx) => {
                const [r, g, b] =
                  AREA_PULSE_COLORS[idx % AREA_PULSE_COLORS.length];
                const stagger = AREA_PULSE_CYCLE_MS / areaList.length;
                return (
                  <li
                    key={a.id}
                    className="area-pulse rounded-full border bg-background/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-primary backdrop-blur-md"
                    style={
                      {
                        "--pulse-r": r,
                        "--pulse-g": g,
                        "--pulse-b": b,
                        animationDelay: `${idx * stagger}ms`,
                      } as React.CSSProperties
                    }
                  >
                    {a.name}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-10 flex flex-wrap gap-3 sm:gap-4">
            <Link
              href={`/s/${salon.slug}/reservar`}
              className="bg-gold-gradient rounded-full px-8 py-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/50 hover:brightness-110"
            >
              Reservar cita
            </Link>
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-primary/60 bg-background/30 px-8 py-4 text-sm font-semibold uppercase tracking-wider text-primary backdrop-blur-md transition-all hover:border-primary hover:bg-primary/10"
              >
                Escribir por WhatsApp
              </a>
            )}
          </div>
        </section>
      </div>

      {/* Servicios por área */}
      {serviceList.length > 0 && (
        <section className="border-b border-border px-4 py-10 sm:px-8 sm:py-12 lg:px-16 lg:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
            Carta de servicios
          </p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Lo que ofrecemos</h2>

          <ServicesTabs areas={areaList} services={serviceList} />
        </section>
      )}

      {/* Galería antes/después */}
      {galleryList.length > 0 && (
        <section className="border-b border-border px-4 py-10 sm:px-8 sm:py-12 lg:px-16 lg:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
            Trabajos del salón
          </p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Antes & después</h2>
          <GalleryPaginated items={galleryList} areas={areaList} />
        </section>
      )}

      {/* Instalaciones */}
      {facilityList.length > 0 && (
        <section className="border-b border-border px-4 py-10 sm:px-8 sm:py-12 lg:px-16 lg:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            El espacio
          </p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
            Nuestras instalaciones
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Conoce el local, el equipamiento y los espacios donde te atenderemos.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {facilityList.map((p) => (
              <figure
                key={p.id}
                className="card-glam card-glam-hover relative overflow-hidden"
              >
                <div className="relative aspect-square bg-muted">
                  <Image
                    src={p.image_url}
                    alt={p.caption ?? "Espacio del salón"}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                </div>
                {p.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-3 pt-8">
                    <p className="line-clamp-2 text-xs leading-snug text-foreground/90">
                      {p.caption}
                    </p>
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Equipo */}
      {staffList.length > 0 && (
        <section className="border-b border-border px-4 py-10 sm:px-8 sm:py-12 lg:px-16 lg:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            El equipo
          </p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Quién te atenderá</h2>
          <StaffSection staff={staffList} areas={areaList} />
        </section>
      )}

      {/* Horario + ubicación + mapa */}
      <section className="grid grid-cols-1 gap-5 px-4 py-10 sm:px-8 sm:py-12 md:grid-cols-2 lg:grid-cols-3 lg:px-16 lg:py-14">
        <div className="card-glam flex flex-col p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Horario
          </p>
          <h2 className="mt-2 font-serif text-2xl">Cuándo visitarnos</h2>
          <dl className="mt-5 flex flex-col">
            {DAYS.map(({ key, label }) => {
              const day = salon.hours?.[key];
              return (
                <div
                  key={key}
                  className="flex items-baseline justify-between border-b border-border py-2.5 last:border-b-0"
                >
                  <dt className="text-sm uppercase tracking-[0.1em]">
                    {label}
                  </dt>
                  <dd className="text-sm">
                    {!day || day.closed ? (
                      <span className="text-muted-foreground">Cerrado</span>
                    ) : (
                      <span className="text-foreground">
                        {day.open} – {day.close}
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        <div className="card-glam flex flex-col p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Encuéntranos
          </p>
          <h2 className="mt-2 font-serif text-2xl">Cómo llegar</h2>

          {hasAddress && (
            <div className="mt-5 space-y-1 text-base leading-relaxed">
              {(salon.calle || salon.numero) && (
                <p>{[salon.calle, salon.numero].filter(Boolean).join(" ")}</p>
              )}
              {salon.sector && (
                <p className="text-muted-foreground">{salon.sector}</p>
              )}
              {(salon.comuna || salon.region) && (
                <p className="text-sm uppercase tracking-[0.1em] text-muted-foreground">
                  {[salon.comuna, salon.region]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2 text-sm">
            {salon.phone && (
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Tel:
                </span>{" "}
                <a href={`tel:${salon.phone}`} className="hover:text-primary">
                  {salon.phone}
                </a>
              </div>
            )}
            {whatsappLink && (
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  WhatsApp:
                </span>{" "}
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary"
                >
                  {salon.whatsapp}
                </a>
              </div>
            )}
          </div>

          {directionsLink && (
            <a
              href={directionsLink}
              target="_blank"
              rel="noreferrer"
              className="mt-auto inline-block pt-5 text-xs font-bold uppercase tracking-[0.15em] text-primary hover:underline"
            >
              Abrir en Google Maps ↗
            </a>
          )}
        </div>

        {hasAddress && (
          <div className="card-glam relative overflow-hidden min-h-[320px] md:col-span-2 md:min-h-[280px] lg:col-span-1 lg:min-h-0">
            <MapEmbed query={fullAddress} className="absolute inset-0" />
          </div>
        )}
      </section>

      {/* Reseñas */}
      <section className="border-t border-border/60 px-4 py-10 sm:px-8 sm:py-12 lg:px-16 lg:py-14">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Reseñas
            </p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
              {ratingAvg !== null
                ? `${ratingAvg.toFixed(1)} sobre 5`
                : "Sé el primero en reseñar"}
            </h2>
            {ratingAvg !== null && (
              <p className="mt-2 text-sm text-muted-foreground">
                Basado en {reviewList.length}{" "}
                {reviewList.length === 1 ? "opinión" : "opiniones"} de clientes
                verificados.
              </p>
            )}
          </div>
          <Link
            href={`/s/${salon.slug}/resena`}
            className="bg-gold-gradient cta-pulse rounded-full px-7 py-3 text-xs font-bold uppercase tracking-[0.15em] text-primary-foreground transition-all hover:scale-105 hover:brightness-110"
          >
            Dejar reseña
          </Link>
        </div>

        {reviewList.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {reviewList.map((r) => (
              <article
                key={r.id}
                className="rounded-3xl border border-border/60 bg-card p-7 shadow-glam"
              >
                <div className="flex items-center justify-between gap-3">
                  <Stars value={r.rating} />
                  <time className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>
                {r.comment && (
                  <p className="mt-4 text-base leading-relaxed">
                    “{r.comment}”
                  </p>
                )}
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  — {r.client_name}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border/60 px-4 py-6 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground sm:px-8 lg:px-16 lg:py-8">
        © 2026 StyloChile
      </footer>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5 text-xl leading-none" aria-label={`${value.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value >= n;
        const half = !filled && value >= n - 0.5;
        return (
          <span
            key={n}
            className={
              filled
                ? "text-gold-gradient"
                : half
                  ? "text-gold-gradient opacity-70"
                  : "text-muted-foreground/30"
            }
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

