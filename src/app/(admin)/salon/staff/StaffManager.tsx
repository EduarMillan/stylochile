"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";
import { COMMON_ROLES, type SalonArea, type Staff } from "@/lib/types";
import {
  deleteStaffAction,
  saveStaffAction,
  type StaffActionState,
} from "./actions";

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
const UNASSIGNED_COLOR: [number, number, number] = [148, 163, 184];

type Group = {
  key: string;
  label: string;
  color: [number, number, number];
  items: Staff[];
};

export function StaffManager({
  salonId,
  staff,
  areas,
}: {
  salonId: string;
  staff: Staff[];
  areas: SalonArea[];
}) {
  const groups: Group[] = useMemo(() => {
    const out: Group[] = areas.map((area, idx) => ({
      key: area.id,
      label: area.name,
      color: AREA_COLORS[idx % AREA_COLORS.length],
      items: staff.filter((s) => s.area_id === area.id),
    }));
    const orphans = staff.filter((s) => s.area_id == null);
    if (orphans.length > 0) {
      out.push({
        key: "unassigned",
        label: "Sin área",
        color: UNASSIGNED_COLOR,
        items: orphans,
      });
    }
    return out;
  }, [areas, staff]);

  const [activeKey, setActiveKey] = useState<string>(groups[0]?.key ?? "");
  useEffect(() => {
    if (groups.length > 0 && !groups.find((g) => g.key === activeKey)) {
      setActiveKey(groups[0].key);
    }
  }, [groups, activeKey]);
  const active = groups.find((g) => g.key === activeKey) ?? groups[0];

  return (
    <div className="flex flex-col gap-6">
      <StaffDialog salonId={salonId} areas={areas} />

      {staff.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no has añadido a tu equipo. Empieza por la primera persona —
          aparecerán en tu vitrina pública con foto, nombre y rol.
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

          {active && active.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay miembros en esta área aún.
            </p>
          ) : active ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {active.items.map((s) => (
                <StaffCard
                  key={s.id}
                  staff={s}
                  salonId={salonId}
                  areas={areas}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function StaffCard({
  staff,
  salonId,
  areas,
}: {
  staff: Staff;
  salonId: string;
  areas: SalonArea[];
}) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!confirm(`¿Eliminar a ${staff.name} del equipo?`)) return;
    startTransition(async () => {
      const res = await deleteStaffAction(staff.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  return (
    <article className="flex gap-3 rounded-xl border border-border bg-card/70 p-3 transition-colors hover:bg-card">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
        {staff.photo_url ? (
          <Image
            src={staff.photo_url}
            alt={staff.name}
            fill
            sizes="96px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
            Sin foto
          </div>
        )}
        {staff.years_experience != null && (
          <span className="absolute bottom-1 left-1 rounded-full bg-background/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-primary backdrop-blur-sm">
            {staff.years_experience}+ años
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate font-serif text-sm leading-tight">
          {staff.name}
        </h3>
        {staff.role && (
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
            {staff.role}
          </p>
        )}
        {staff.specialties.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {staff.specialties.slice(0, 3).map((s) => (
              <li
                key={s}
                className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-[0.05em] text-muted-foreground"
              >
                {s}
              </li>
            ))}
            {staff.specialties.length > 3 && (
              <li className="text-[9px] uppercase tracking-[0.05em] text-muted-foreground">
                +{staff.specialties.length - 3}
              </li>
            )}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          <StaffDialog
            salonId={salonId}
            areas={areas}
            initial={staff}
            triggerLabel="Editar"
            triggerVariant="outline"
            triggerSize="xs"
          />
          <Button
            variant="ghost"
            size="xs"
            onClick={remove}
            disabled={pending}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </article>
  );
}

type Variant = "default" | "outline" | "ghost";
type Size = "default" | "sm" | "xs";

function StaffDialog({
  salonId,
  areas,
  initial,
  triggerLabel = "Añadir miembro",
  triggerVariant = "default",
  triggerSize = "default",
  triggerClassName = "self-start rounded-full px-6 uppercase tracking-wider",
}: {
  salonId: string;
  areas: SalonArea[];
  initial?: Staff;
  triggerLabel?: string;
  triggerVariant?: Variant;
  triggerSize?: Size;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  // Snapshot estable de `initial` durante la apertura del diálogo. Evita
  // que los defaultValue cambien post-save (warning de Base UI). Se
  // refresca cuando el diálogo se cierra para que la próxima apertura
  // muestre datos frescos.
  const [snap, setSnap] = useState(initial);
  const [areaId, setAreaId] = useState<string>(snap?.area_id ?? "none");
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    snap?.photo_url ?? null,
  );
  const [state, action, pending] = useActionState<StaffActionState, FormData>(
    saveStaffAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  // Reset al cerrar el diálogo + refresca snapshot con el initial actual.
  useEffect(() => {
    if (!open) {
      setSnap(initial);
      setAreaId(initial?.area_id ?? "none");
      setPhotoUrl(initial?.photo_url ?? null);
    }
  }, [open, initial]);

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
      <DialogContent className="max-w-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {initial ? "Editar miembro" : "Nuevo miembro del equipo"}
          </DialogTitle>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-5">
          {snap && <input type="hidden" name="id" value={snap.id} />}
          <input type="hidden" name="area_id" value={areaId} />
          <input type="hidden" name="photo_url" value={photoUrl ?? ""} />

          <div className="grid gap-5 md:grid-cols-[200px_minmax(0,1fr)]">
            <ImageUpload
              salonId={salonId}
              folder="staff"
              value={photoUrl}
              onChange={setPhotoUrl}
              label="Foto"
              aspect="square"
            />

            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs uppercase tracking-[0.15em]">
                  Nombre completo
                </Label>
                <Input
                  name="name"
                  required
                  defaultValue={snap?.name ?? ""}
                  placeholder="Ej. María Pérez"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs uppercase tracking-[0.15em]">
                  Rol / especialidad
                </Label>
                <Input
                  name="role"
                  defaultValue={snap?.role ?? ""}
                  placeholder="Ej. Estilista, Estomatóloga…"
                  list="staff-roles"
                />
                <datalist id="staff-roles">
                  {COMMON_ROLES.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs uppercase tracking-[0.15em]">
                  Área
                </Label>
                <Select
                  value={areaId}
                  onValueChange={(v) => setAreaId(v ?? "none")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar área">
                      {(value) => {
                        if (value === "none" || !value)
                          return "Sin área específica";
                        return (
                          areas.find((a) => a.id === value)?.name ??
                          "Seleccionar área"
                        );
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin área específica</SelectItem>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-[0.15em]">
              Especialidades (opcional)
            </Label>
            <Input
              name="specialties"
              defaultValue={snap?.specialties?.join(", ") ?? ""}
              placeholder="Coloración, Balayage, Cortes asimétricos"
            />
            <p className="text-xs text-muted-foreground">
              Sepáralas con coma. Hasta 12. Aparecerán como etiquetas en la
              vitrina.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Años de experiencia (opcional)
              </Label>
              <Input
                name="years_experience"
                type="number"
                min={0}
                max={80}
                step={1}
                inputMode="numeric"
                defaultValue={snap?.years_experience ?? ""}
                placeholder="8"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Instagram (opcional)
              </Label>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40">
                <span className="flex select-none items-center bg-secondary px-3 font-serif text-base text-primary">
                  @
                </span>
                <Input
                  name="instagram_handle"
                  defaultValue={snap?.instagram_handle ?? ""}
                  placeholder="mariastudio"
                  pattern="[A-Za-z0-9._]{1,30}"
                  className="flex-1 rounded-none border-0 focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-[0.15em]">
              Certificaciones / formación (opcional)
            </Label>
            <Textarea
              name="certifications"
              rows={2}
              defaultValue={snap?.certifications ?? ""}
              placeholder="Certificada L'Oréal Professionnel, Master en colorimetría…"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-[0.15em]">
              Bio (opcional)
            </Label>
            <Textarea
              name="bio"
              rows={3}
              defaultValue={snap?.bio ?? ""}
              placeholder="Una breve presentación o trayectoria."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
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

