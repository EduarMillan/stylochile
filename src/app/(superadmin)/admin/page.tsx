import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  // Métricas globales — la RLS permite al super-admin ver todo
  const [
    { count: totalSalons },
    { count: publishedSalons },
    { count: suspendedSalons },
    { count: totalUsers },
    { count: pendingAppts },
    { count: approvedAppts },
    { count: totalReviews },
  ] = await Promise.all([
    supabase.from("salons").select("*", { count: "exact", head: true }),
    supabase
      .from("salons")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .is("suspended_at", null),
    supabase
      .from("salons")
      .select("*", { count: "exact", head: true })
      .not("suspended_at", "is", null),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("starts_at", new Date().toISOString()),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
  ]);

  const { data: recentSalons } = await supabase
    .from("salons")
    .select("id, name, slug, is_published, suspended_at, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-destructive">
        Panel global · Resumen
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        StyloChile en cifras
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Estado actual de toda la plataforma. Como super-admin tienes acceso
        global de lectura y moderación sobre cualquier salón.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        <Stat
          label="Salones totales"
          value={totalSalons ?? 0}
          tone="deep"
        />
        <Stat
          label="Publicados"
          value={publishedSalons ?? 0}
          tone="primary"
          accent="primary"
        />
        <Stat
          label="Suspendidos"
          value={suspendedSalons ?? 0}
          tone="destructive"
          accent={
            suspendedSalons && suspendedSalons > 0 ? "destructive" : undefined
          }
        />
        <Stat
          label="Dueños registrados"
          value={totalUsers ?? 0}
          tone="warm"
        />
        <Stat
          label="Reservas pendientes"
          value={pendingAppts ?? 0}
          tone="amber"
          accent={pendingAppts && pendingAppts > 0 ? "primary" : undefined}
        />
        <Stat
          label="Próximas confirmadas"
          value={approvedAppts ?? 0}
          tone="bronze"
        />
        <Stat
          label="Reseñas totales"
          value={totalReviews ?? 0}
          tone="default"
        />
      </div>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Últimos salones registrados</h2>
          <Link
            href="/admin/salones"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "rounded-full uppercase tracking-wider",
            })}
          >
            Ver todos
          </Link>
        </div>

        {recentSalons && recentSalons.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {recentSalons.map((s) => (
              <li
                key={s.id}
                className="card-static flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <p className="font-serif text-lg">{s.name}</p>
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    /s/{s.slug} · creado{" "}
                    {new Date(s.created_at).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <StatusBadge
                  published={s.is_published}
                  suspended={Boolean(s.suspended_at)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no hay salones registrados en la plataforma.
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
  accent,
}: {
  label: string;
  value: number;
  tone?:
    | "default"
    | "primary"
    | "destructive"
    | "deep"
    | "warm"
    | "amber"
    | "bronze";
  accent?: "primary" | "destructive";
}) {
  const toneClass =
    tone === "primary"
      ? "card-tone-primary"
      : tone === "destructive"
        ? "card-tone-destructive"
        : tone === "deep"
          ? "card-tone-deep"
          : tone === "warm"
            ? "card-tone-warm"
            : tone === "amber"
              ? "card-tone-amber"
              : tone === "bronze"
                ? "card-tone-bronze"
                : "card-static";
  const valueClass =
    accent === "primary"
      ? "text-gold-gradient"
      : accent === "destructive"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className={`${toneClass} p-6`}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-3 font-serif text-4xl ${valueClass}`}>{value}</p>
    </div>
  );
}

function StatusBadge({
  published,
  suspended,
}: {
  published: boolean;
  suspended: boolean;
}) {
  if (suspended) {
    return (
      <span className="rounded-full border border-destructive/60 bg-destructive/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-destructive">
        Suspendido
      </span>
    );
  }
  if (published) {
    return (
      <span className="rounded-full border border-primary/60 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
        Publicado
      </span>
    );
  }
  return (
    <span className="rounded-full border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
      Borrador
    </span>
  );
}
