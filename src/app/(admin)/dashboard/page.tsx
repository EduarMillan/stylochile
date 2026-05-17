import Link from "next/link";
import {
  Calendar,
  CalendarCheck,
  Star,
  UsersRound,
  PackageX,
  Sparkles,
  Store,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

type StatTone =
  | "default"
  | "primary"
  | "amber"
  | "emerald"
  | "sapphire"
  | "amethyst"
  | "ruby"
  | "coral"
  | "slate";

const TONE_CLASS: Record<StatTone, string> = {
  default: "card-glam",
  primary: "card-glam card-glam-primary",
  amber: "card-glam card-glam-amber",
  emerald: "card-glam card-glam-emerald",
  sapphire: "card-glam card-glam-sapphire",
  amethyst: "card-glam card-glam-amethyst",
  ruby: "card-glam card-glam-ruby",
  coral: "card-glam card-glam-coral",
  slate: "card-glam card-glam-slate",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, slug, is_published")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!salon) {
    return (
      <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Bienvenido
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight">
          {(user!.user_metadata?.full_name as string | undefined) ??
            user!.email}
        </h1>
        <div className="card-glam mt-12 max-w-2xl p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Primer paso
          </p>
          <h2 className="mt-3 font-serif text-3xl">Crea tu salón</h2>
          <p className="mt-3 text-muted-foreground">
            Aún no tienes un salón configurado. Define el nombre, dirección y
            horario para empezar a recibir reservas.
          </p>
          <Link
            href="/salon/configuracion"
            className={buttonVariants({
              size: "lg",
              className: "mt-8 rounded-full uppercase tracking-wider",
            })}
          >
            Crear mi salón
          </Link>
        </div>
      </div>
    );
  }

  // Fechas de referencia
  const now = new Date();
  const weekAhead = new Date(now);
  weekAhead.setDate(now.getDate() + 7);

  // Métricas en paralelo
  const [
    pendingRes,
    weekApptsRes,
    nextApptRes,
    clientsRes,
    servicesRes,
    reviewsRes,
    lowStockRes,
    upcomingApptsRes,
  ] = await Promise.all([
    // Reservas pendientes (count)
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .eq("status", "pending"),
    // Citas confirmadas en los próximos 7 días
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .in("status", ["approved", "completed"])
      .gte("starts_at", now.toISOString())
      .lt("starts_at", weekAhead.toISOString()),
    // Próxima cita
    supabase
      .from("appointments")
      .select("id, starts_at, client_name, status")
      .eq("salon_id", salon.id)
      .in("status", ["pending", "approved"])
      .gte("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    // Clientes registrados
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salon.id),
    // Servicios
    supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salon.id),
    // Reseñas (avg + count)
    supabase
      .from("reviews")
      .select("rating")
      .eq("salon_id", salon.id),
    // Items bajo stock
    supabase
      .from("inventory_items")
      .select("id, name, quantity, min_quantity, unit")
      .eq("salon_id", salon.id),
    // Citas para el chart de próximos 7 días
    supabase
      .from("appointments")
      .select("starts_at, status")
      .eq("salon_id", salon.id)
      .in("status", ["pending", "approved"])
      .gte("starts_at", now.toISOString())
      .lt("starts_at", weekAhead.toISOString())
      .order("starts_at", { ascending: true }),
  ]);

  const pendingCount = pendingRes.count ?? 0;
  const weekAppointmentsCount = weekApptsRes.count ?? 0;
  const nextAppt = nextApptRes.data;
  const clientsCount = clientsRes.count ?? 0;
  const servicesCount = servicesRes.count ?? 0;

  const reviewsList = (reviewsRes.data as { rating: number }[] | null) ?? [];
  const reviewsCount = reviewsList.length;
  const reviewsAvg =
    reviewsCount > 0
      ? reviewsList.reduce((s, r) => s + r.rating, 0) / reviewsCount
      : null;

  const inventoryItems =
    (lowStockRes.data as
      | {
          id: string;
          name: string;
          quantity: number;
          min_quantity: number;
          unit: string;
        }[]
      | null) ?? [];
  const lowStockItems = inventoryItems.filter(
    (i) => i.quantity <= i.min_quantity,
  );

  // Agrupa citas por día para el chart de 7 días
  const upcomingAppts =
    (upcomingApptsRes.data as { starts_at: string; status: string }[] | null) ??
    [];
  const days: { label: string; date: Date; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push({
      label: d.toLocaleDateString("es-CL", { weekday: "short" }).slice(0, 3),
      date: d,
      count: 0,
    });
  }
  for (const appt of upcomingAppts) {
    const d = new Date(appt.starts_at);
    const dayIdx = Math.floor(
      (d.getTime() - days[0].date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (dayIdx >= 0 && dayIdx < 7) days[dayIdx].count += 1;
  }
  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Bienvenido
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        {(user!.user_metadata?.full_name as string | undefined) ?? user!.email}
      </h1>

      {/* Stats principales */}
      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        <StatCard
          tone="ruby"
          icon={<Calendar className="size-5" />}
          label="Pendientes"
          value={pendingCount}
          hint={pendingCount > 0 ? "Requieren tu atención" : "Todo al día"}
          href="/salon/agenda"
        />
        <StatCard
          tone="emerald"
          icon={<CalendarCheck className="size-5" />}
          label="Próximos 7 días"
          value={weekAppointmentsCount}
          hint={
            weekAppointmentsCount === 1
              ? "cita confirmada"
              : "citas confirmadas"
          }
          href="/salon/agenda"
        />
        <StatCard
          tone="sapphire"
          icon={<UsersRound className="size-5" />}
          label="Clientes"
          value={clientsCount}
          hint={clientsCount === 1 ? "registrado" : "registrados"}
          href="/salon/clientes"
        />
        <StatCard
          tone="amber"
          icon={<Star className="size-5" />}
          label="Calificación"
          value={reviewsAvg !== null ? reviewsAvg.toFixed(1) : "—"}
          hint={
            reviewsCount === 0
              ? "Sin reseñas aún"
              : `${reviewsCount} ${reviewsCount === 1 ? "reseña" : "reseñas"}`
          }
          href="/salon/resenas"
        />
      </div>

      {/* Mi salón + Chart */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Mi salón (1/3) */}
        <div className={`${TONE_CLASS.amethyst} flex flex-col gap-4 p-7`}>
          <div className="flex items-center gap-2">
            <Store className="size-4 text-primary" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Mi salón
            </p>
          </div>
          <h2 className="font-serif text-2xl leading-tight">{salon.name}</h2>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`size-2 rounded-full ${salon.is_published ? "bg-emerald-400" : "bg-muted-foreground/40"}`}
            />
            <span className={salon.is_published ? "text-emerald-300" : "text-muted-foreground"}>
              {salon.is_published ? "Publicado" : "Borrador"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {servicesCount} {servicesCount === 1 ? "servicio" : "servicios"} en tu carta
          </p>
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Link
              href="/salon/configuracion"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "rounded-full uppercase tracking-wider",
              })}
            >
              Editar
            </Link>
            {salon.is_published && (
              <Link
                href={`/s/${salon.slug}`}
                target="_blank"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "rounded-full uppercase tracking-wider",
                })}
              >
                Ver vitrina ↗
              </Link>
            )}
          </div>
        </div>

        {/* Chart de próximos 7 días (2/3) */}
        <div className={`${TONE_CLASS.slate} flex flex-col gap-5 p-7 lg:col-span-2`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Citas próximos 7 días
              </p>
              <h2 className="mt-1 font-serif text-2xl">
                {weekAppointmentsCount + pendingCount}{" "}
                <span className="text-base text-muted-foreground">
                  total · {pendingCount} sin aprobar
                </span>
              </h2>
            </div>
            {nextAppt && (
              <div className="text-right text-xs">
                <p className="uppercase tracking-[0.15em] text-muted-foreground">
                  Próxima
                </p>
                <p className="mt-0.5 font-serif text-base">
                  {nextAppt.client_name}
                </p>
                <p className="text-muted-foreground">
                  {new Date(nextAppt.starts_at).toLocaleString("es-CL", {
                    weekday: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="flex h-32 items-end gap-2 sm:h-40">
            {days.map((d, i) => {
              const heightPct = (d.count / maxCount) * 100;
              const isToday = i === 0;
              return (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <span className="text-xs font-medium tabular-nums text-foreground">
                    {d.count > 0 ? d.count : ""}
                  </span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        d.count === 0
                          ? "bg-muted/40"
                          : "bg-gradient-to-t from-primary/80 to-primary/30"
                      }`}
                      style={{
                        height: d.count === 0 ? "4px" : `${Math.max(heightPct, 8)}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-[0.15em] ${
                      isToday ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stock bajo + Acciones rápidas */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className={`${TONE_CLASS.coral} flex flex-col gap-3 p-7`}>
          <div className="flex items-center gap-2">
            <PackageX className="size-4 text-orange-300" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
              Stock bajo
            </p>
          </div>
          <h2 className="font-serif text-2xl">
            {lowStockItems.length}{" "}
            <span className="text-base text-muted-foreground">
              {lowStockItems.length === 1 ? "item" : "items"} a reponer
            </span>
          </h2>
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tu inventario está bien — nada por debajo del mínimo.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {lowStockItems.slice(0, 4).map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-b-0 last:pb-0"
                >
                  <span className="font-medium">{i.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {i.quantity} / {i.min_quantity} {i.unit}
                  </span>
                </li>
              ))}
              {lowStockItems.length > 4 && (
                <li className="text-xs text-muted-foreground">
                  + {lowStockItems.length - 4} más…
                </li>
              )}
            </ul>
          )}
          <div className="mt-auto pt-2">
            <Link
              href="/salon/almacen"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "rounded-full uppercase tracking-wider",
              })}
            >
              Ir al almacén
            </Link>
          </div>
        </div>

        <div className={`${TONE_CLASS.primary} flex flex-col gap-3 p-7`}>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Acciones rápidas
            </p>
          </div>
          <h2 className="font-serif text-2xl">¿Qué hacer ahora?</h2>
          <p className="text-sm text-muted-foreground">
            Atajos a lo más usado del panel.
          </p>
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Link
              href="/salon/agenda"
              className={buttonVariants({
                size: "sm",
                className: "rounded-full uppercase tracking-wider",
              })}
            >
              Ver agenda
            </Link>
            <Link
              href="/salon/clientes"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "rounded-full uppercase tracking-wider",
              })}
            >
              Clientes
            </Link>
            <Link
              href="/salon/galeria"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "rounded-full uppercase tracking-wider",
              })}
            >
              Subir trabajo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  tone,
  icon,
  label,
  value,
  hint,
  href,
}: {
  tone: StatTone;
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`${TONE_CLASS[tone]} flex flex-col gap-2 p-5 transition-transform hover:-translate-y-0.5`}
    >
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="font-serif text-3xl text-gold-gradient">{value}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </Link>
  );
}
