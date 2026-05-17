import { createClient } from "@/lib/supabase/server";
import { AdminReviewsList, type AdminReviewRow } from "./AdminReviewsList";

type ReviewRowDb = {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string;
  client_phone: string;
  created_at: string;
  salon_id: string;
};

type SalonRow = {
  id: string;
  name: string;
  slug: string;
};

export default async function AdminReviewsPage() {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, client_name, client_phone, created_at, salon_id",
    )
    .order("created_at", { ascending: false });

  const reviewList = (reviews as ReviewRowDb[]) ?? [];
  const salonIds = Array.from(new Set(reviewList.map((r) => r.salon_id)));

  const { data: salons } = salonIds.length
    ? await supabase
        .from("salons")
        .select("id, name, slug")
        .in("id", salonIds)
    : { data: [] as SalonRow[] };

  const salonsMap = new Map<string, SalonRow>();
  for (const s of (salons as SalonRow[]) ?? []) {
    salonsMap.set(s.id, s);
  }

  const rows: AdminReviewRow[] = reviewList.map((r) => {
    const s = salonsMap.get(r.salon_id);
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      client_name: r.client_name,
      client_phone: r.client_phone,
      created_at: r.created_at,
      salon_id: r.salon_id,
      salon_name: s?.name ?? null,
      salon_slug: s?.slug ?? null,
    };
  });

  const avg =
    rows.length > 0
      ? rows.reduce((s, r) => s + r.rating, 0) / rows.length
      : null;

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-destructive">
        Panel global · Reseñas
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        {avg !== null ? (
          <span>
            <span className="text-gold-gradient">{avg.toFixed(1)}</span>{" "}
            <span className="text-foreground">promedio plataforma</span>
          </span>
        ) : (
          "Aún sin reseñas"
        )}
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Todas las reseñas verificadas de la plataforma. Modera contenido
        inapropiado eliminándolo aquí.
      </p>

      <div className="mt-10">
        <AdminReviewsList reviews={rows} />
      </div>
    </div>
  );
}
