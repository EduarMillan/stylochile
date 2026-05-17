import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { SalonArea } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { AreasManager } from "./AreasManager";

export default async function AreasPage() {
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
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Áreas
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight">
          Crea tu salón primero
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Las áreas se asocian a tu salón. Crea el salón en Configuración antes
          de añadir áreas.
        </p>
        <Link
          href="/salon/configuracion"
          className={buttonVariants({
            className: "mt-8 px-6 py-3 uppercase tracking-wider",
          })}
        >
          Ir a Configuración
        </Link>
      </div>
    );
  }

  const { data: areas } = await supabase
    .from("salon_areas")
    .select("*")
    .eq("salon_id", salon.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Vitrina · Áreas
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        Áreas del salón
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Organiza tu salón en áreas (peluquería, manicure, estomatología…). Los
        servicios y la galería antes/después se agruparán por estas áreas en tu
        vitrina pública.
      </p>

      <div className="mt-12">
        <AreasManager areas={(areas as SalonArea[]) ?? []} />
      </div>
    </div>
  );
}
