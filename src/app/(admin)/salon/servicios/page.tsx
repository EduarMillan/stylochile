import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { SalonArea, Service } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { ServicesManager } from "./ServicesManager";

export default async function ServicesPage() {
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

  const [{ data: areas }, { data: services }] = await Promise.all([
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
  ]);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Vitrina · Servicios
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">Servicios</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Define el menú de servicios de cada área. El precio y la duración se
        muestran en la vitrina pública y se usarán al calcular slots de reserva
        en Fase 2.
      </p>

      {(!areas || areas.length === 0) && (
        <div className="mt-8 max-w-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Aún no tienes áreas creadas. Los servicios funcionan mejor agrupados
            por área.
          </p>
          <Link
            href="/salon/areas"
            className={buttonVariants({
              variant: "outline",
              className: "mt-4 px-6 py-3 uppercase tracking-wider",
            })}
          >
            Crear áreas
          </Link>
        </div>
      )}

      <div className="mt-12">
        <ServicesManager
          services={(services as Service[]) ?? []}
          areas={(areas as SalonArea[]) ?? []}
        />
      </div>
    </div>
  );
}
