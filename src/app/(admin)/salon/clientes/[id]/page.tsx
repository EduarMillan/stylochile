import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Client, ClientProgressPhoto } from "@/lib/types";
import { ClientDetail } from "./ClientDetail";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  if (!salon) notFound();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("salon_id", salon.id)
    .maybeSingle();

  if (!client) notFound();

  const { data: photos } = await supabase
    .from("client_progress_photos")
    .select("*")
    .eq("client_id", id)
    .order("taken_at", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <Link
        href="/salon/clientes"
        className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-primary"
      >
        ← Todos los clientes
      </Link>

      <div className="mt-8">
        <ClientDetail
          salonId={salon.id}
          client={client as Client}
          photos={(photos as ClientProgressPhoto[]) ?? []}
        />
      </div>
    </div>
  );
}
