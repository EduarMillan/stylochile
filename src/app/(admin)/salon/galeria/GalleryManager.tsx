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
import { ImageUpload } from "@/components/ImageUpload";
import type { GalleryItem, SalonArea } from "@/lib/types";
import {
  saveGalleryAction,
  deleteGalleryItemAction,
  type GalleryActionState,
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

const MAX_ITEMS_PER_AREA = 4;

// Cuenta trabajos por área. Usa "none" como clave para items sin área.
function buildCountByArea(items: GalleryItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = item.area_id ?? "none";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

type Group = {
  key: string;
  label: string;
  color: [number, number, number];
  items: GalleryItem[];
};

export function GalleryManager({
  salonId,
  items,
  areas,
}: {
  salonId: string;
  items: GalleryItem[];
  areas: SalonArea[];
}) {
  const countByArea = useMemo(() => buildCountByArea(items), [items]);

  const groups: Group[] = useMemo(() => {
    const out: Group[] = areas.map((area, idx) => ({
      key: area.id,
      label: area.name,
      color: AREA_COLORS[idx % AREA_COLORS.length],
      items: items.filter((i) => i.area_id === area.id),
    }));
    const orphans = items.filter((i) => i.area_id == null);
    if (orphans.length > 0) {
      out.push({
        key: "unassigned",
        label: "Sin área",
        color: UNASSIGNED_COLOR,
        items: orphans,
      });
    }
    return out;
  }, [areas, items]);

  const hasItems = items.length > 0;
  const [activeKey, setActiveKey] = useState<string>(groups[0]?.key ?? "");
  useEffect(() => {
    if (groups.length > 0 && !groups.find((g) => g.key === activeKey)) {
      setActiveKey(groups[0].key);
    }
  }, [groups, activeKey]);
  const active = groups.find((g) => g.key === activeKey) ?? groups[0];

  return (
    <div className="flex flex-col gap-6">
      <GalleryDialog
        salonId={salonId}
        areas={areas}
        countByArea={countByArea}
      />

      {!hasItems ? (
        <p className="text-sm text-muted-foreground">
          Aún no has subido ningún trabajo. Cada entrada lleva una foto antes y
          una después.
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
              No hay trabajos en esta área aún.
            </p>
          ) : active ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {active.items.map((item) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  salonId={salonId}
                  areas={areas}
                  countByArea={countByArea}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function GalleryCard({
  item,
  salonId,
  areas,
  countByArea,
}: {
  item: GalleryItem;
  salonId: string;
  areas: SalonArea[];
  countByArea: Map<string, number>;
}) {
  const [pending, startTransition] = useTransition();
  const area = areas.find((a) => a.id === item.area_id);

  function remove() {
    if (!confirm("¿Eliminar este trabajo?")) return;
    startTransition(async () => {
      const res = await deleteGalleryItemAction(item.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card/70 transition-colors hover:bg-card">
      <div className="grid grid-cols-2">
        <div className="relative aspect-square">
          <Image
            src={item.before_url}
            alt="Antes"
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            className="object-cover"
            unoptimized
          />
          <span className="absolute left-2 top-2 rounded bg-background/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-foreground backdrop-blur-sm">
            Antes
          </span>
        </div>
        <div className="relative aspect-square">
          <Image
            src={item.after_url}
            alt="Después"
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            className="object-cover"
            unoptimized
          />
          <span className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-primary-foreground">
            Después
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        {area && (
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-primary">
            {area.name}
          </p>
        )}
        {item.title && (
          <h3 className="font-serif text-sm leading-tight">{item.title}</h3>
        )}
        {item.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {item.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap gap-1.5">
          <GalleryDialog
            salonId={salonId}
            areas={areas}
            countByArea={countByArea}
            initial={item}
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

function GalleryDialog({
  salonId,
  areas,
  countByArea,
  initial,
  triggerLabel = "Añadir trabajo",
  triggerVariant = "default",
  triggerSize = "default",
  triggerClassName = "self-start px-6 py-3 uppercase tracking-wider",
}: {
  salonId: string;
  areas: SalonArea[];
  countByArea: Map<string, number>;
  initial?: GalleryItem;
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
  const [beforeUrl, setBeforeUrl] = useState<string | null>(
    snap?.before_url ?? null,
  );
  const [afterUrl, setAfterUrl] = useState<string | null>(
    snap?.after_url ?? null,
  );

  const [state, action, pending] = useActionState<GalleryActionState, FormData>(
    saveGalleryAction,
    null,
  );

  // Calcula cupo disponible considerando que si estamos editando un item
  // de esta misma área, ese item ya cuenta en el total y se debe excluir.
  function isAreaFull(targetKey: string): boolean {
    const initialKey = initial?.area_id ?? "none";
    const count = countByArea.get(targetKey) ?? 0;
    const editingFromSame = initialKey === targetKey;
    const effective = editingFromSame ? count - 1 : count;
    return effective >= MAX_ITEMS_PER_AREA;
  }

  function slotsLeft(targetKey: string): number {
    const initialKey = initial?.area_id ?? "none";
    const count = countByArea.get(targetKey) ?? 0;
    const editingFromSame = initialKey === targetKey;
    const effective = editingFromSame ? count - 1 : count;
    return Math.max(0, MAX_ITEMS_PER_AREA - effective);
  }

  const selectedFull = isAreaFull(areaId);
  const allFull =
    isAreaFull("none") &&
    areas.every((a) => isAreaFull(a.id));

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  // Al cerrar el diálogo, vuelve el estado a su valor inicial y refresca
  // el snapshot con el initial actual. Sin esto los URLs y el área
  // seleccionada persistirían entre aperturas y la siguiente vez verías
  // la imagen anterior cargada.
  useEffect(() => {
    if (!open) {
      setSnap(initial);
      setAreaId(initial?.area_id ?? "none");
      setBeforeUrl(initial?.before_url ?? null);
      setAfterUrl(initial?.after_url ?? null);
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
            {initial ? "Editar trabajo" : "Nuevo trabajo"}
          </DialogTitle>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-5">
          {snap && <input type="hidden" name="id" value={snap.id} />}
          <input type="hidden" name="area_id" value={areaId} />
          <input type="hidden" name="before_url" value={beforeUrl ?? ""} />
          <input type="hidden" name="after_url" value={afterUrl ?? ""} />

          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-[0.15em]">Área</Label>
            <Select value={areaId} onValueChange={(v) => setAreaId(v ?? "none")}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar área">
                  {(value) => {
                    if (value === "none" || !value) {
                      return `Sin área (${slotsLeft("none")}/${MAX_ITEMS_PER_AREA} libres)`;
                    }
                    const a = areas.find((x) => x.id === value);
                    if (!a) return "Seleccionar área";
                    return `${a.name} (${slotsLeft(value)}/${MAX_ITEMS_PER_AREA} libres)`;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  Sin área {renderCount("none", slotsLeft, isAreaFull)}
                </SelectItem>
                {areas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} {renderCount(a.id, slotsLeft, isAreaFull)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFull && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {areaId === "none"
                  ? `"Sin área" ya tiene ${MAX_ITEMS_PER_AREA} trabajos.`
                  : `${areas.find((a) => a.id === areaId)?.name ?? "Esta área"} ya tiene ${MAX_ITEMS_PER_AREA} trabajos.`}{" "}
                Elimina uno o elige otra área con cupo.
              </p>
            )}
            {allFull && !initial && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                Todas las áreas están al límite ({MAX_ITEMS_PER_AREA}{" "}
                trabajos cada una). Elimina trabajos antiguos para subir nuevos.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ImageUpload
              salonId={salonId}
              folder="gallery"
              value={beforeUrl}
              onChange={setBeforeUrl}
              label="Antes"
            />
            <ImageUpload
              salonId={salonId}
              folder="gallery"
              value={afterUrl}
              onChange={setAfterUrl}
              label="Después"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="gal-title"
              className="text-xs uppercase tracking-[0.15em]"
            >
              Título (opcional)
            </Label>
            <Input
              id="gal-title"
              name="title"
              defaultValue={snap?.title ?? ""}
              placeholder="Ej. Color con balayage en castaño"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="gal-desc"
              className="text-xs uppercase tracking-[0.15em]"
            >
              Descripción (opcional)
            </Label>
            <Textarea
              id="gal-desc"
              name="description"
              rows={3}
              defaultValue={snap?.description ?? ""}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                pending || !beforeUrl || !afterUrl || selectedFull
              }
            >
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function renderCount(
  key: string,
  slotsLeft: (k: string) => number,
  isFull: (k: string) => boolean,
) {
  const left = slotsLeft(key);
  if (isFull(key)) {
    return (
      <span className="ml-1 text-[10px] text-destructive">— lleno</span>
    );
  }
  return (
    <span className="ml-1 text-[10px] text-muted-foreground">({left}/{MAX_ITEMS_PER_AREA})</span>
  );
}
