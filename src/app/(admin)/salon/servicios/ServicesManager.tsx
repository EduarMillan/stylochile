"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SalonArea, Service } from "@/lib/types";
import {
  saveServiceAction,
  deleteServiceAction,
  type ServiceActionState,
} from "./actions";

const CURRENCIES = ["CLP", "USD", "EUR"];

// Paleta para identificar visualmente cada área. El servicio hereda el color
// de su área según el índice en la lista. Si no hay área asignada, se usa
// el color neutro al final.
const AREA_COLORS: ReadonlyArray<[number, number, number]> = [
  [251, 113, 133], // rose-400
  [56, 189, 248], // sky-400
  [167, 139, 250], // violet-400
  [52, 211, 153], // emerald-400
  [251, 146, 60], // orange-400
  [244, 114, 182], // pink-400
  [45, 212, 191], // teal-400
  [250, 204, 21], // yellow-400
];
const UNASSIGNED_COLOR: [number, number, number] = [148, 163, 184]; // slate-400

type Group = {
  key: string;
  label: string;
  color: [number, number, number];
  items: Service[];
};

export function ServicesManager({
  services,
  areas,
}: {
  services: Service[];
  areas: SalonArea[];
}) {
  const groups: Group[] = useMemo(() => {
    const out: Group[] = areas.map((area, idx) => ({
      key: area.id,
      label: area.name,
      color: AREA_COLORS[idx % AREA_COLORS.length],
      items: services.filter((s) => s.area_id === area.id),
    }));
    const orphans = services.filter((s) => s.area_id == null);
    if (orphans.length > 0) {
      out.push({
        key: "unassigned",
        label: "Sin área",
        color: UNASSIGNED_COLOR,
        items: orphans,
      });
    }
    return out;
  }, [areas, services]);

  const [activeKey, setActiveKey] = useState<string>(groups[0]?.key ?? "");
  // Si la lista de groups cambia (área añadida/eliminada), asegurar que el
  // tab activo siga existiendo.
  useEffect(() => {
    if (groups.length > 0 && !groups.find((g) => g.key === activeKey)) {
      setActiveKey(groups[0].key);
    }
  }, [groups, activeKey]);

  const active = groups.find((g) => g.key === activeKey) ?? groups[0];

  return (
    <div className="flex flex-col gap-6">
      <ServiceDialog areas={areas} />

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no tienes servicios. Crea áreas en{" "}
          <span className="text-primary">/salon/areas</span> y luego añade
          servicios.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => {
              const [r, gr, b] = g.color;
              const isActive = g.key === active?.key;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setActiveKey(g.key)}
                  aria-pressed={isActive}
                  className="rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap"
                  style={{
                    borderColor: isActive
                      ? `rgb(${r}, ${gr}, ${b})`
                      : `rgba(${r}, ${gr}, ${b}, 0.35)`,
                    backgroundColor: isActive
                      ? `rgba(${r}, ${gr}, ${b}, 0.18)`
                      : "transparent",
                    color: isActive
                      ? `rgb(${r}, ${gr}, ${b})`
                      : "var(--muted-foreground)",
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: `rgb(${r}, ${gr}, ${b})` }}
                      aria-hidden
                    />
                    {g.label}
                    <span className="text-[10px] opacity-70" aria-hidden>
                      ({g.items.length})
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {active && (
            <div className="flex flex-col gap-3">
              {active.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay servicios en esta área aún.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {active.items.map((s) => (
                    <ServiceCard
                      key={s.id}
                      service={s}
                      areas={areas}
                      color={active.color}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ServiceCard({
  service,
  areas,
  color,
}: {
  service: Service;
  areas: SalonArea[];
  color: [number, number, number];
}) {
  const [pending, startTransition] = useTransition();
  const [r, g, b] = color;
  const rgb = `${r}, ${g}, ${b}`;

  function remove() {
    if (!confirm(`¿Eliminar "${service.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteServiceAction(service.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  return (
    <div
      className="relative flex flex-col gap-2 overflow-hidden rounded-xl border bg-card/70 p-4 transition-colors hover:bg-card"
      style={{
        borderColor: `rgba(${rgb}, 0.3)`,
        backgroundImage: `linear-gradient(135deg, rgba(${rgb}, 0.06), transparent 60%)`,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: `rgb(${rgb})` }}
      />
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-base leading-tight">{service.name}</h3>
        {service.price != null && (
          <span
            className="whitespace-nowrap text-sm font-semibold"
            style={{ color: `rgb(${rgb})` }}
          >
            {service.price.toLocaleString("es-CL")} {service.currency}
          </span>
        )}
      </div>
      {service.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {service.description}
        </p>
      )}
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {service.duration_minutes
          ? `${service.duration_minutes} min`
          : "Sin duración"}
      </p>
      <div className="mt-1 flex gap-1.5">
        <ServiceDialog
          areas={areas}
          initial={service}
          triggerLabel="Editar"
          triggerVariant="outline"
          triggerSize="sm"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={remove}
          disabled={pending}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

type Variant = "default" | "outline" | "ghost";
type Size = "default" | "sm";

function ServiceDialog({
  areas,
  initial,
  triggerLabel = "Nuevo servicio",
  triggerVariant = "default",
  triggerSize = "default",
  triggerClassName = "self-start px-6 py-3 uppercase tracking-wider",
}: {
  areas: SalonArea[];
  initial?: Service;
  triggerLabel?: string;
  triggerVariant?: Variant;
  triggerSize?: Size;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [areaId, setAreaId] = useState<string>(
    initial?.area_id ?? (areas[0]?.id ?? "none"),
  );
  const [currency, setCurrency] = useState(initial?.currency ?? "CLP");
  const [state, action, pending] = useActionState<ServiceActionState, FormData>(
    saveServiceAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({
          variant: triggerVariant,
          size: triggerSize,
          className: triggerClassName,
        })}
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-w-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {initial ? "Editar servicio" : "Nuevo servicio"}
          </DialogTitle>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4">
          {initial && <input type="hidden" name="id" value={initial.id} />}
          <input type="hidden" name="area_id" value={areaId} />
          <input type="hidden" name="currency" value={currency} />

          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-[0.15em]">Área</Label>
            <Select value={areaId} onValueChange={(v) => setAreaId(v ?? "none")}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar área">
                  {(value) => {
                    if (value === "none" || !value) return "Sin área";
                    return (
                      areas.find((a) => a.id === value)?.name ??
                      "Seleccionar área"
                    );
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin área</SelectItem>
                {areas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="svc-name"
              className="text-xs uppercase tracking-[0.15em]"
            >
              Nombre del servicio
            </Label>
            <Input
              id="svc-name"
              name="name"
              required
              defaultValue={initial?.name ?? ""}
              placeholder="Ej. Balayage"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="svc-desc"
              className="text-xs uppercase tracking-[0.15em]"
            >
              Descripción
            </Label>
            <Textarea
              id="svc-desc"
              name="description"
              rows={3}
              defaultValue={initial?.description ?? ""}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="col-span-1 flex flex-col gap-2">
              <Label
                htmlFor="svc-price"
                className="text-xs uppercase tracking-[0.15em]"
              >
                Precio
              </Label>
              <Input
                id="svc-price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initial?.price ?? ""}
              />
            </div>
            <div className="col-span-1 flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Moneda
              </Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v ?? "CLP")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 flex flex-col gap-2">
              <Label
                htmlFor="svc-duration"
                className="text-xs uppercase tracking-[0.15em]"
              >
                Duración (min)
              </Label>
              <Input
                id="svc-duration"
                name="duration_minutes"
                type="number"
                min="1"
                step="1"
                defaultValue={initial?.duration_minutes ?? ""}
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

