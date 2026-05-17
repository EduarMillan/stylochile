import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SalonArea, Service } from "@/lib/types";
import { PublicHeader } from "@/components/PublicHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BookingFlow } from "./BookingFlow";

export default async function ReservePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, slug, whatsapp, hours, is_published")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!salon) notFound();

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
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PublicHeader variant="solid" sticky />

      <main className="flex flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8 lg:px-16 lg:py-10">
        <Breadcrumbs
          items={[
            { label: "Salones", href: "/salones" },
            { label: salon.name, href: `/s/${salon.slug}` },
            { label: "Reservar" },
          ]}
          className="mb-6"
        />
        <BookingFlow
          salon={salon}
          areas={(areas as SalonArea[]) ?? []}
          services={(services as Service[]) ?? []}
        />
      </main>
    </div>
  );
}
