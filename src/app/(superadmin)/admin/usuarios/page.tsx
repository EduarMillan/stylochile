import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

type SalonRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  is_published: boolean;
  suspended_at: string | null;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: salons }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("salons")
      .select("id, owner_id, name, slug, is_published, suspended_at"),
  ]);

  const salonsByOwner = new Map<string, SalonRow[]>();
  for (const s of (salons as SalonRow[]) ?? []) {
    const list = salonsByOwner.get(s.owner_id) ?? [];
    list.push(s);
    salonsByOwner.set(s.owner_id, list);
  }

  const profileList = (profiles as ProfileRow[]) ?? [];

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-destructive">
        Panel global · Usuarios
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        Dueños registrados
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Cada cuenta corresponde a un dueño que se registró en la plataforma.
        Desde aquí puedes ver sus salones y contactarlos.
      </p>

      <div className="mt-10">
        {profileList.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay usuarios registrados.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {profileList.map((p) => {
              const userSalons = salonsByOwner.get(p.id) ?? [];
              return (
                <li
                  key={p.id}
                  className="card-tone-warm grid grid-cols-1 gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <h3 className="font-serif text-xl">
                      {p.full_name ?? "(Sin nombre)"}
                    </h3>
                    <div className="mt-2 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                      {p.email && (
                        <span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                            Email:
                          </span>{" "}
                          <a
                            href={`mailto:${p.email}`}
                            className="hover:text-primary"
                          >
                            {p.email}
                          </a>
                        </span>
                      )}
                      {p.phone && (
                        <span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                            Tel:
                          </span>{" "}
                          {p.phone}
                        </span>
                      )}
                      <span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                          Registrado:
                        </span>{" "}
                        {new Date(p.created_at).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {userSalons.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {userSalons.map((s) => (
                          <Link
                            key={s.id}
                            href={`/admin/salones`}
                            className="rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-primary hover:bg-primary/10"
                          >
                            {s.name}
                            {s.suspended_at && " (suspendido)"}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground md:text-right">
                    {userSalons.length === 0
                      ? "Sin salón"
                      : `${userSalons.length} salón${userSalons.length === 1 ? "" : "es"}`}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
