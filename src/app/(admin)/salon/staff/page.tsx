import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { SalonArea, Staff } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { StaffManager } from "./StaffManager";

export default async function StaffPage() {
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
            className: "mt-6 rounded-full uppercase tracking-wider",
          })}
        >
          Ir a Configuración
        </Link>
      </div>
    );
  }

  const [{ data: areas }, { data: staff }] = await Promise.all([
    supabase
      .from("salon_areas")
      .select("*")
      .eq("salon_id", salon.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("staff")
      .select("*")
      .eq("salon_id", salon.id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Vitrina · Equipo
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        Tu equipo
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Las personas que atienden en tu salón. Aparecen en tu vitrina pública
        con foto, rol y bio. Asociar cada miembro a un área ayuda al cliente a
        elegir.
      </p>

      <div className="mt-10">
        <StaffManager
          salonId={salon.id}
          staff={(staff as Staff[]) ?? []}
          areas={(areas as SalonArea[]) ?? []}
        />
      </div>
    </div>
  );
}
