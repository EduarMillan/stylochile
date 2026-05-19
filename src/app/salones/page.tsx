import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { CHILE_REGIONES } from "@/lib/chile";
import { PublicHeader } from "@/components/PublicHeader";
import type { WeeklyHours } from "@/lib/types";
import { SalonExplorer, type SalonCard } from "./SalonExplorer";

export const metadata: Metadata = {
  title: "Directorio de salones",
  description:
    "Descubre los mejores salones de belleza de Chile. Filtra por región, ve fotos, horarios y reserva en segundos.",
  openGraph: {
    title: "Directorio de salones · StyloChile",
    description:
      "Descubre los mejores salones de belleza de Chile. Filtra por región, ve fotos, horarios y reserva en segundos.",
    url: "/salones",
  },
};

export default async function ExplorerPage() {
  const supabase = await createClient();

  const { data: salonRows } = await supabase
    .from("salons")
    .select(
      "id, slug, name, description, region, comuna, sector, calle, numero, logo_url, hours",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const salons = (salonRows ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    region: string | null;
    comuna: string | null;
    sector: string | null;
    calle: string | null;
    numero: string | null;
    logo_url: string | null;
    hours: WeeklyHours | null;
  }>;

  let cards: SalonCard[] = [];
  if (salons.length > 0) {
    const ids = salons.map((s) => s.id);

    const [{ data: areas }, { data: reviews }] = await Promise.all([
      supabase
        .from("salon_areas")
        .select("salon_id, name")
        .in("salon_id", ids)
        .order("sort_order", { ascending: true }),
      supabase.from("reviews").select("salon_id, rating").in("salon_id", ids),
    ]);

    const areasBy = new Map<string, string[]>();
    for (const a of (areas as { salon_id: string; name: string }[]) ?? []) {
      const list = areasBy.get(a.salon_id) ?? [];
      list.push(a.name);
      areasBy.set(a.salon_id, list);
    }

    const ratingsBy = new Map<string, { sum: number; count: number }>();
    for (const r of (reviews as { salon_id: string; rating: number }[]) ??
      []) {
      const cur = ratingsBy.get(r.salon_id) ?? { sum: 0, count: 0 };
      cur.sum += r.rating;
      cur.count += 1;
      ratingsBy.set(r.salon_id, cur);
    }

    cards = salons.map((s) => {
      const r = ratingsBy.get(s.id);
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        region: s.region,
        comuna: s.comuna,
        sector: s.sector,
        calle: s.calle,
        numero: s.numero,
        logoUrl: s.logo_url,
        hours: s.hours,
        areas: areasBy.get(s.id) ?? [],
        ratingAvg: r ? r.sum / r.count : null,
        ratingCount: r?.count ?? 0,
      };
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero con imagen de fondo */}
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/hero-bg.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,9,5,0.55) 0%, rgba(12,9,5,0.85) 70%, rgba(12,9,5,1) 100%)",
          }}
        />

        <PublicHeader current="explorar" />

        <section className="relative px-4 pt-10 pb-12 sm:px-8 sm:pt-12 sm:pb-16 lg:px-16 lg:pt-16 lg:pb-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary drop-shadow">
            Directorio
          </p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight text-gold-gradient drop-shadow-lg sm:text-5xl lg:text-7xl">
            Salones de Chile
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/85 drop-shadow">
            Descubre los mejores salones de belleza del país. Filtra por
            región y reserva en segundos.
          </p>
        </section>
      </div>

      <section className="px-4 pb-16 sm:px-8 sm:pb-20 lg:px-16 lg:pb-24">
        <SalonExplorer
          cards={cards}
          regiones={CHILE_REGIONES}
        />
      </section>

      <footer className="border-t border-border/60 px-4 py-6 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground sm:px-8 lg:px-16 lg:py-8">
        © 2026 StyloChile · Todos los derechos reservados
      </footer>
    </div>
  );
}
