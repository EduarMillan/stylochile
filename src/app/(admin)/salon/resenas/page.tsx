import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { ReviewsList } from "./ReviewsList";

export default async function ReviewsAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: salon } = await supabase
    .from("salons")
    .select("id, slug")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!salon) {
    return (
      <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
        <h1 className="font-serif text-3xl">Crea tu salón primero</h1>
        <Link
          href="/salon/configuracion"
          className={buttonVariants({
            className: "mt-6 rounded-full uppercase tracking-wider",
          })}
        >
          Ir a Configuración
        </Link>
      </div>
    );
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false });

  const list = (reviews as Review[]) ?? [];
  const avg =
    list.length > 0
      ? list.reduce((s, r) => s + r.rating, 0) / list.length
      : null;

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        Reseñas
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        {avg !== null ? (
          <span>
            <span className="text-gold-gradient">{avg.toFixed(1)}</span> sobre 5
          </span>
        ) : (
          "Aún sin reseñas"
        )}
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Solo los clientes con cita aprobada o completada pueden dejar reseñas.
        Si una es spam o ofensiva, puedes eliminarla.{" "}
        <Link
          href={`/s/${salon.slug}/resena`}
          className="text-primary hover:underline"
          target="_blank"
        >
          Ver enlace público ↗
        </Link>
      </p>

      <div className="mt-12">
        <ReviewsList reviews={list} />
      </div>
    </div>
  );
}
