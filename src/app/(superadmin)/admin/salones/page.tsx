import { createClient } from "@/lib/supabase/server";
import type { SubscriptionStatus } from "@/lib/types";
import { SalonsAdminList, type AdminSalonRow } from "./SalonsAdminList";

type SalonRow = {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
  suspended_at: string | null;
  provincia: string | null;
  municipio: string | null;
  created_at: string;
  owner_id: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type SubRow = {
  salon_id: string;
  status: SubscriptionStatus;
  trial_ends_at: string;
  current_period_ends_at: string | null;
};

export default async function AdminSalonsPage() {
  const supabase = await createClient();

  const { data: salons } = await supabase
    .from("salons")
    .select(
      "id, name, slug, is_published, suspended_at, provincia, municipio, created_at, owner_id",
    )
    .order("created_at", { ascending: false });

  const salonList = (salons as SalonRow[]) ?? [];
  const ownerIds = Array.from(new Set(salonList.map((s) => s.owner_id)));
  const salonIds = salonList.map((s) => s.id);

  const [{ data: profiles }, { data: subs }] = await Promise.all([
    ownerIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ownerIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    salonIds.length
      ? supabase
          .from("salon_subscriptions")
          .select(
            "salon_id, status, trial_ends_at, current_period_ends_at",
          )
          .in("salon_id", salonIds)
      : Promise.resolve({ data: [] as SubRow[] }),
  ]);

  const profilesMap = new Map<string, ProfileRow>();
  for (const p of (profiles as ProfileRow[]) ?? []) {
    profilesMap.set(p.id, p);
  }
  const subsMap = new Map<string, SubRow>();
  for (const s of (subs as SubRow[]) ?? []) {
    subsMap.set(s.salon_id, s);
  }

  const rows: AdminSalonRow[] = salonList.map((s) => {
    const p = profilesMap.get(s.owner_id);
    const sub = subsMap.get(s.id);
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      is_published: s.is_published,
      suspended_at: s.suspended_at,
      provincia: s.provincia,
      municipio: s.municipio,
      created_at: s.created_at,
      owner_email: p?.email ?? null,
      owner_name: p?.full_name ?? null,
      sub_status: sub?.status ?? null,
      trial_ends_at: sub?.trial_ends_at ?? null,
      current_period_ends_at: sub?.current_period_ends_at ?? null,
    };
  });

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-destructive">
        Panel global · Salones
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        Todos los salones
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Gestiona todos los salones registrados en la plataforma. Suspender un
        salón lo oculta de la vitrina pública sin borrar sus datos.
      </p>

      <div className="mt-10">
        <SalonsAdminList salons={rows} />
      </div>
    </div>
  );
}
