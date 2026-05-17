import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Appointment, SalonArea, Service } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { AgendaList } from "./AgendaList";

export default async function AgendaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name")
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

  const [{ data: appointments }, { data: areas }, { data: services }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .eq("salon_id", salon.id)
        .order("starts_at", { ascending: true }),
      supabase
        .from("salon_areas")
        .select("*")
        .eq("salon_id", salon.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("services")
        .select("*")
        .eq("salon_id", salon.id),
    ]);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Agenda
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        Solicitudes de reserva
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Aprueba o rechaza las solicitudes que llegan desde la vitrina. Puedes
        responder al cliente directamente por WhatsApp.
      </p>

      <div className="mt-12">
        <AgendaList
          salonName={salon.name}
          appointments={(appointments as Appointment[]) ?? []}
          areas={(areas as SalonArea[]) ?? []}
          services={(services as Service[]) ?? []}
        />
      </div>
    </div>
  );
}
