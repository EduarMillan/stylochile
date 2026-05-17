import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { InventoryItem } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { AlmacenManager } from "./AlmacenManager";

export default async function AlmacenPage() {
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

  const { data: items } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("salon_id", salon.id)
    .order("name", { ascending: true });

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Almacén
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        Inventario
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Lleva el control de productos: tintes, sueros, consumibles, herramientas.
        Cada movimiento queda registrado para auditar consumo y estimar
        compras.
      </p>

      <div className="mt-10">
        <AlmacenManager items={(items as InventoryItem[]) ?? []} />
      </div>
    </div>
  );
}
