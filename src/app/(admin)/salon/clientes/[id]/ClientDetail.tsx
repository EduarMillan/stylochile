"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";
import type { Client, ClientProgressPhoto } from "@/lib/types";
import {
  deleteClientAction,
  updateClientAction,
} from "../actions";
import {
  addClientPhotoAction,
  deleteClientPhotoAction,
  type PhotoActionState,
} from "./actions";

export function ClientDetail({
  salonId,
  client,
  photos,
}: {
  salonId: string;
  client: Client;
  photos: ClientProgressPhoto[];
}) {
  return (
    <div className="flex max-w-5xl flex-col gap-12">
      <ClientCard salonId={salonId} client={client} />
      <Separator className="bg-border" />
      <PhotoTimeline
        salonId={salonId}
        clientId={client.id}
        photos={photos}
      />
    </div>
  );
}

function ClientCard({
  salonId: _salonId,
  client,
}: {
  salonId: string;
  client: Client;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone ?? "");
  const [email, setEmail] = useState(client.email ?? "");
  const [notes, setNotes] = useState(client.notes ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await updateClientAction(client.id, {
        name,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
      });
      if (res?.error) toast.error(res.error);
      if (res?.success) {
        toast.success(res.success);
        setEditing(false);
      }
    });
  }

  function remove() {
    if (
      !confirm(
        `¿Eliminar a "${client.name}"? Se borrarán también todas sus fotos del historial.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteClientAction(client.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) {
        toast.success(res.success);
        router.push("/salon/clientes");
      }
    });
  }

  if (!editing) {
    return (
      <section className="card-glam p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
              Cliente
            </p>
            <h1 className="mt-2 font-serif text-4xl tracking-tight">
              {client.name}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              {client.phone && (
                <span>
                  <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Tel:
                  </span>{" "}
                  {client.phone}
                </span>
              )}
              {client.email && (
                <span>
                  <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Email:
                  </span>{" "}
                  {client.email}
                </span>
              )}
            </div>
            {client.notes && (
              <p className="mt-4 max-w-xl text-sm text-muted-foreground">
                {client.notes}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button variant="ghost" onClick={remove} disabled={pending}>
              Eliminar
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border-2 border-primary bg-card p-8 shadow-glam">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
        Editando cliente
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label className="text-xs uppercase tracking-[0.15em]">Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-xs uppercase tracking-[0.15em]">Teléfono</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-xs uppercase tracking-[0.15em]">Email</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label className="text-xs uppercase tracking-[0.15em]">Notas</Label>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        <Button onClick={save} disabled={pending}>
          Guardar
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setEditing(false);
            setName(client.name);
            setPhone(client.phone ?? "");
            setEmail(client.email ?? "");
            setNotes(client.notes ?? "");
          }}
        >
          Cancelar
        </Button>
      </div>
    </section>
  );
}

function PhotoTimeline({
  salonId,
  clientId,
  photos,
}: {
  salonId: string;
  clientId: string;
  photos: ClientProgressPhoto[];
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
            Historial fotográfico
          </p>
          <h2 className="mt-2 font-serif text-3xl">
            {photos.length} {photos.length === 1 ? "foto" : "fotos"}
          </h2>
        </div>
        <AddPhotoDialog salonId={salonId} clientId={clientId} />
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no hay fotos en el historial. Sube la primera para empezar a
          documentar el progreso.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <PhotoCard key={p.id} photo={p} clientId={clientId} />
          ))}
        </div>
      )}
    </section>
  );
}

function PhotoCard({
  photo,
  clientId,
}: {
  photo: ClientProgressPhoto;
  clientId: string;
}) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!confirm("¿Eliminar esta foto del historial?")) return;
    startTransition(async () => {
      const res = await deleteClientPhotoAction(photo.id, clientId);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  const date = new Date(photo.taken_at + "T00:00:00").toLocaleDateString(
    "es-CL",
    { day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <article className="card-glam overflow-hidden">
      <div className="relative aspect-square">
        <Image
          src={photo.photo_url}
          alt={photo.caption ?? "Foto de progreso"}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex flex-col gap-2 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
          {date}
        </p>
        {photo.caption && (
          <p className="text-sm text-muted-foreground">{photo.caption}</p>
        )}
        <div className="mt-2">
          <Button variant="ghost" size="sm" onClick={remove} disabled={pending}>
            Eliminar
          </Button>
        </div>
      </div>
    </article>
  );
}

function AddPhotoDialog({
  salonId,
  clientId,
}: {
  salonId: string;
  clientId: string;
}) {
  const [open, setOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [takenAt, setTakenAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [state, action, pending] = useActionState<PhotoActionState, FormData>(
    addClientPhotoAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
      setPhotoUrl(null);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  // Reset al cerrar: si cancelas con foto cargada, no la verás en la
  // siguiente apertura.
  useEffect(() => {
    if (!open) {
      setPhotoUrl(null);
      setTakenAt(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({
          className: "px-6 py-3 uppercase tracking-wider",
        })}
      >
        Añadir foto
      </DialogTrigger>
      <DialogContent className="max-w-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            Añadir al historial
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-5">
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="photo_url" value={photoUrl ?? ""} />

          <ImageUpload
            salonId={salonId}
            folder={`clients/${clientId}`}
            value={photoUrl}
            onChange={setPhotoUrl}
            label="Foto"
          />

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="cap-taken"
              className="text-xs uppercase tracking-[0.15em]"
            >
              Fecha de la foto
            </Label>
            <Input
              id="cap-taken"
              name="taken_at"
              type="date"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="cap-caption"
              className="text-xs uppercase tracking-[0.15em]"
            >
              Descripción (opcional)
            </Label>
            <Textarea
              id="cap-caption"
              name="caption"
              rows={3}
              placeholder="Ej. Color castaño cálido + corte. Después de 4 semanas."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || !photoUrl}>
              {pending ? "Guardando…" : "Añadir foto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
