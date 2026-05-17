import { createClient } from "@/lib/supabase/server";
import type { Salon } from "@/lib/types";
import { SalonForm } from "./SalonForm";

export default async function SalonConfigPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: salon } = await supabase
    .from("salons")
    .select("*")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Configuración
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        {salon ? "Editar salón" : "Crear tu salón"}
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Define los datos que aparecerán en tu vitrina pública y cómo te
        contactan los clientes.
      </p>

      <div className="mt-12">
        {/* key fuerza remount al actualizar el salón. Sin esto los
            inputs uncontrolled de base-ui mantienen su valor inicial
            y emiten warning cuando cambia el defaultValue tras un
            save+revalidate. */}
        <SalonForm
          key={(salon as Salon | null)?.updated_at ?? "new"}
          salon={(salon as Salon) ?? null}
        />
      </div>
    </div>
  );
}
