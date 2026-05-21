"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";
import type { SalonFacilityPhoto } from "@/lib/types";
import {
  deleteFacilityPhotoAction,
  saveFacilityPhotoAction,
  type FacilityActionState,
} from "./actions";

export function InstalacionesManager({
  salonId,
  photos,
}: {
  salonId: string;
  photos: SalonFacilityPhoto[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <FacilityDialog salonId={salonId} />

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no has subido fotos de tu salón. Comparte el local, equipamiento o
          espacios para que los clientes vean dónde serán atendidos.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {photos.map((p) => (
            <FacilityCard key={p.id} photo={p} salonId={salonId} />
          ))}
        </div>
      )}
    </div>
  );
}

function FacilityCard({
  photo,
  salonId,
}: {
  photo: SalonFacilityPhoto;
  salonId: string;
}) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!confirm("¿Eliminar esta foto?")) return;
    startTransition(async () => {
      const res = await deleteFacilityPhotoAction(photo.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card/70 transition-colors hover:bg-card">
      <div className="relative aspect-square bg-muted">
        <Image
          src={photo.image_url}
          alt={photo.caption ?? "Foto del salón"}
          fill
          sizes="(max-width: 640px) 50vw, 200px"
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex flex-col gap-1.5 p-2.5">
        {photo.caption && (
          <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {photo.caption}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          <FacilityDialog
            salonId={salonId}
            initial={photo}
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

function FacilityDialog({
  salonId,
  initial,
  triggerLabel = "Subir foto",
  triggerVariant = "default",
  triggerSize = "default",
  triggerClassName = "self-start rounded-full px-6 uppercase tracking-wider",
}: {
  salonId: string;
  initial?: SalonFacilityPhoto;
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
  const [imageUrl, setImageUrl] = useState<string | null>(
    snap?.image_url ?? null,
  );

  const [state, action, pending] = useActionState<
    FacilityActionState,
    FormData
  >(saveFacilityPhotoAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  // Reset al cerrar el diálogo + refresca snapshot con el initial actual.
  // Sin esto la siguiente apertura mostraría la foto anterior.
  useEffect(() => {
    if (!open) {
      setSnap(initial);
      setImageUrl(initial?.image_url ?? null);
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
      <DialogContent className="max-w-xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {initial ? "Editar foto" : "Nueva foto del salón"}
          </DialogTitle>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-5">
          {snap && <input type="hidden" name="id" value={snap.id} />}
          <input type="hidden" name="image_url" value={imageUrl ?? ""} />

          <ImageUpload
            salonId={salonId}
            folder="facility"
            value={imageUrl}
            onChange={setImageUrl}
            label="Foto del salón"
            aspect="square"
          />

          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-[0.15em]">
              Pie de foto (opcional)
            </Label>
            <Input
              name="caption"
              defaultValue={snap?.caption ?? ""}
              placeholder="Ej. Zona de coloración, recepción, equipo profesional…"
              maxLength={200}
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
            <Button type="submit" disabled={pending || !imageUrl}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
