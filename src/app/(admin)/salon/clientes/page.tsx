import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { ClientsList } from "./ClientsList";

export default async function ClientsPage() {
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

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("salon_id", salon.id)
    .order("name", { ascending: true });

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Clientes
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        Tu cartera de clientes
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Cada cliente lleva su propio historial fotográfico — útil para mostrar
        progreso de color, tratamientos o rutas estéticas a lo largo del
        tiempo.
      </p>

      <div className="mt-10">
        <ClientsList clients={(clients as Client[]) ?? []} />
      </div>
    </div>
  );
}
