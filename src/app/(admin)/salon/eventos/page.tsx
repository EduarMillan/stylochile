import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import type { SalonEvent } from "@/lib/types";
import { EventsManager } from "./EventsManager";

export default async function EventosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: salon } = await supabase
    .from("salons")
    .select("id, whatsapp")
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

  const { data: events } = await supabase
    .from("salon_events")
    .select("*")
    .eq("salon_id", salon.id)
    .order("starts_at", { ascending: true });

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Vitrina · Cursos y eventos
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        Lo que organiza tu salón
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Publica los cursos, talleres y eventos que impartes. Aparecerán en
        tu vitrina pública con la fecha, precio y un botón de WhatsApp para
        que los clientes te escriban directo.
      </p>

      <div className="mt-12">
        <EventsManager
          salonId={salon.id}
          events={(events as SalonEvent[]) ?? []}
          hasWhatsapp={Boolean(salon.whatsapp)}
        />
      </div>
    </div>
  );
}
