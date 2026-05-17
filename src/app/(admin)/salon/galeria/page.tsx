import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { GalleryItem, SalonArea } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { GalleryManager } from "./GalleryManager";

export default async function GalleryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: salon } = await supabase
    .from("salons")
    .select("id")
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
            className: "mt-6 px-6 py-3 uppercase tracking-wider",
          })}
        >
          Ir a Configuración
        </Link>
      </div>
    );
  }

  const [{ data: areas }, { data: items }] = await Promise.all([
    supabase
      .from("salon_areas")
      .select("*")
      .eq("salon_id", salon.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("gallery_items")
      .select("*")
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Vitrina · Galería
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        Antes y después
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Sube los trabajos del salón con dos fotos: antes y después. Esto es lo
        que más vende — los clientes comparan resultados antes de reservar.
      </p>

      <div className="mt-12">
        <GalleryManager
          salonId={salon.id}
          items={(items as GalleryItem[]) ?? []}
          areas={(areas as SalonArea[]) ?? []}
        />
      </div>
    </div>
  );
}
