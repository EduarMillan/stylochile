import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import type { SalonFacilityPhoto } from "@/lib/types";
import { InstalacionesManager } from "./InstalacionesManager";

export default async function InstalacionesPage() {
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

  const { data: photos } = await supabase
    .from("salon_facility_photos")
    .select("*")
    .eq("salon_id", salon.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Vitrina · Instalaciones
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        Fotos del salón
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Muestra cómo es tu local, qué equipamiento usas y dónde serán atendidos
        tus clientes. La transparencia del espacio genera confianza.
      </p>

      <div className="mt-12">
        <InstalacionesManager
          salonId={salon.id}
          photos={(photos as SalonFacilityPhoto[]) ?? []}
        />
      </div>
    </div>
  );
}
