"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SubscriptionStatus } from "@/lib/types";
import {
  deleteSalonAction,
  markSalonPaidAction,
  restoreSalonAction,
  suspendSalonAction,
} from "./actions";

export type AdminSalonRow = {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
  suspended_at: string | null;
  provincia: string | null;
  municipio: string | null;
  created_at: string;
  owner_email: string | null;
  owner_name: string | null;
  sub_status: SubscriptionStatus | null;
  trial_ends_at: string | null;
  current_period_ends_at: string | null;
};

type Filter = "all" | "published" | "draft" | "suspended";

export function SalonsAdminList({ salons }: { salons: AdminSalonRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    let list = salons;
    if (filter === "published") {
      list = list.filter((s) => s.is_published && !s.suspended_at);
    } else if (filter === "draft") {
      list = list.filter((s) => !s.is_published && !s.suspended_at);
    } else if (filter === "suspended") {
      list = list.filter((s) => Boolean(s.suspended_at));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        [s.name, s.slug, s.owner_email, s.owner_name, s.provincia, s.municipio]
          .filter(Boolean)
          .some((f) => (f as string).toLowerCase().includes(q)),
      );
    }
    return list;
  }, [salons, filter, query]);

  const counts = useMemo(() => {
    return {
      all: salons.length,
      published: salons.filter((s) => s.is_published && !s.suspended_at).length,
      draft: salons.filter((s) => !s.is_published && !s.suspended_at).length,
      suspended: salons.filter((s) => Boolean(s.suspended_at)).length,
    };
  }, [salons]);

  return (
    <div className="flex flex-col gap-6">
      <div className="card-static flex flex-wrap items-end gap-4 p-5">
        <div className="min-w-[240px] flex-1">
          <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Buscar
          </label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, slug, email del dueño, ubicación…"
          />
        </div>
        <div className="min-w-[200px]">
          <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Estado
          </label>
          <Select
            value={filter}
            onValueChange={(v) => setFilter((v as Filter) ?? "all")}
          >
            <SelectTrigger>
              <SelectValue>
                {(value) => {
                  switch (value) {
                    case "published":
                      return `Publicados (${counts.published})`;
                    case "draft":
                      return `Borradores (${counts.draft})`;
                    case "suspended":
                      return `Suspendidos (${counts.suspended})`;
                    default:
                      return `Todos (${counts.all})`;
                  }
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({counts.all})</SelectItem>
              <SelectItem value="published">
                Publicados ({counts.published})
              </SelectItem>
              <SelectItem value="draft">
                Borradores ({counts.draft})
              </SelectItem>
              <SelectItem value="suspended">
                Suspendidos ({counts.suspended})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="ml-auto text-xs uppercase tracking-[0.15em] text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "salón" : "salones"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ningún salón coincide con el filtro.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((s) => (
            <SalonRow key={s.id} salon={s} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SalonRow({ salon }: { salon: AdminSalonRow }) {
  const [pending, startTransition] = useTransition();
  const isSuspended = Boolean(salon.suspended_at);

  function suspend() {
    if (
      !confirm(
        `¿Suspender "${salon.name}"? El salón dejará de aparecer en la vitrina pública y no podrá recibir reservas hasta que lo restaures.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await suspendSalonAction(salon.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  function restore() {
    startTransition(async () => {
      const res = await restoreSalonAction(salon.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  function remove() {
    if (
      !confirm(
        `¿ELIMINAR PERMANENTEMENTE "${salon.name}"?\n\nEsto borra el salón, sus áreas, servicios, galería, citas, clientes, almacén y reseñas. La cuenta del dueño NO se elimina, pero pierde su salón. No se puede deshacer.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteSalonAction(salon.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  function markPaid() {
    const note = window.prompt(
      `Marcar "${salon.name}" como pagado.\nExtiende el plan un mes (acumulativo si ya estaba al día).\n\nReferencia / nota (opcional):`,
      "",
    );
    if (note === null) return; // canceló
    startTransition(async () => {
      const res = await markSalonPaidAction(salon.id, note || undefined);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  const toneClass = isSuspended
    ? "card-tone-destructive"
    : salon.is_published
      ? "card-tone-primary"
      : "card-tone-warm";

  const health = getPaymentHealth(salon);

  return (
    <li
      className={`${toneClass} relative grid grid-cols-1 gap-4 overflow-hidden p-6 pl-7 md:grid-cols-[1fr_auto] md:items-center`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: HEALTH_COLORS[health].bar }}
      />
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-serif text-xl">{salon.name}</h3>
          <StatusBadge
            published={salon.is_published}
            suspended={isSuspended}
          />
          <SubscriptionBadge
            status={salon.sub_status}
            trialEndsAt={salon.trial_ends_at}
            periodEndsAt={salon.current_period_ends_at}
          />
        </div>
        <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
          /s/{salon.slug}
        </p>
        <div className="mt-3 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
          {salon.owner_email && (
            <span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                Dueño:
              </span>{" "}
              {salon.owner_name ?? "—"} ({salon.owner_email})
            </span>
          )}
          {(salon.municipio || salon.provincia) && (
            <span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                Ubicación:
              </span>{" "}
              {[salon.municipio, salon.provincia].filter(Boolean).join(", ")}
            </span>
          )}
          <span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
              Registrado:
            </span>{" "}
            {new Date(salon.created_at).toLocaleDateString("es-CL", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {isSuspended && (
            <span className="text-destructive">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                Suspendido:
              </span>{" "}
              {new Date(salon.suspended_at!).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:justify-end">
        {salon.is_published && !isSuspended && (
          <Link
            href={`/s/${salon.slug}`}
            target="_blank"
            className="inline-flex h-9 items-center rounded-lg border border-input bg-background/40 px-3 text-xs font-medium text-foreground backdrop-blur-sm transition-all hover:border-primary hover:bg-muted"
          >
            Ver vitrina ↗
          </Link>
        )}
        <Button
          size="sm"
          disabled={pending}
          onClick={markPaid}
          className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
        >
          Marcar pagado
        </Button>
        {isSuspended ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={restore}
          >
            Restaurar
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={suspend}
          >
            Suspender
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={remove}
          className="text-destructive hover:text-destructive"
        >
          Eliminar
        </Button>
      </div>
    </li>
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

type PaymentHealth = "ok" | "soft" | "urgent" | "danger" | "neutral";

const HEALTH_COLORS: Record<PaymentHealth, { bar: string }> = {
  ok: { bar: "#10b981" }, // emerald-500
  soft: { bar: "#f59e0b" }, // amber-500
  urgent: { bar: "#f97316" }, // orange-500
  danger: { bar: "#ef4444" }, // red-500
  neutral: { bar: "#94a3b8" }, // slate-400
};

function getPaymentHealth(salon: AdminSalonRow): PaymentHealth {
  // Suspendido manualmente → danger sin importar fechas
  if (salon.suspended_at) return "danger";
  if (!salon.sub_status) return "neutral";
  if (salon.sub_status === "expired") return "danger";

  // En trialing o active, miramos la fecha de vencimiento relevante
  const endsAt =
    salon.sub_status === "trialing"
      ? salon.trial_ends_at
      : salon.current_period_ends_at;
  if (!endsAt) return "neutral";

  const daysLeft = Math.ceil(
    (new Date(endsAt).getTime() - Date.now()) / 86_400_000,
  );
  if (daysLeft < 0) return "danger";
  if (daysLeft <= 5) return "urgent";
  if (daysLeft <= 15) return "soft";
  return "ok";
}

function SubscriptionBadge({
  status,
  trialEndsAt,
  periodEndsAt,
}: {
  status: SubscriptionStatus | null;
  trialEndsAt: string | null;
  periodEndsAt: string | null;
}) {
  if (!status) return null;
  const now = Date.now();
  let daysLeft: number | null = null;
  if (status === "trialing" && trialEndsAt) {
    daysLeft = Math.ceil(
      (new Date(trialEndsAt).getTime() - now) / 86_400_000,
    );
  } else if (status === "active" && periodEndsAt) {
    daysLeft = Math.ceil(
      (new Date(periodEndsAt).getTime() - now) / 86_400_000,
    );
  }

  const label =
    status === "trialing"
      ? `Trial${daysLeft !== null ? ` · ${daysLeft}d` : ""}`
      : status === "active"
        ? `Plan activo${daysLeft !== null ? ` · ${daysLeft}d` : ""}`
        : "Vencido";

  const cls =
    status === "active"
      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
      : status === "trialing"
        ? "border-sky-500/60 bg-sky-500/10 text-sky-400"
        : "border-red-500/60 bg-red-500/10 text-red-400";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${cls}`}
    >
      {label}
    </span>
  );
}
