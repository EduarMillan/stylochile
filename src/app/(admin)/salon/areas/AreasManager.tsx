"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { COMMON_AREAS, type SalonArea } from "@/lib/types";
import {
  createAreaAction,
  updateAreaAction,
  deleteAreaAction,
  type AreaActionState,
} from "./actions";

export function AreasManager({ areas }: { areas: SalonArea[] }) {
  const [state, action, pending] = useActionState<AreaActionState, FormData>(
    createAreaAction,
    null,
  );

  useEffect(() => {
    if (state?.success) toast.success(state.success);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="flex max-w-4xl flex-col gap-12">
      {/* Crear */}
      <section className="card-glam p-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
          Nueva área
        </p>
        <h2 className="mt-2 font-serif text-2xl">Añadir un área al salón</h2>

        <form action={action} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="name"
              className="text-xs uppercase tracking-[0.15em]"
            >
              Nombre
            </Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ej. Peluquería"
              list="common-areas"
            />
            <datalist id="common-areas">
              {COMMON_AREAS.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="description"
              className="text-xs uppercase tracking-[0.15em]"
            >
              Descripción (opcional)
            </Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <input type="hidden" name="sort_order" value={areas.length} />
          <div>
            <Button
              type="submit"
              disabled={pending}
              className="px-6 py-3 uppercase tracking-wider"
            >
              {pending ? "Creando…" : "Crear área"}
            </Button>
          </div>
        </form>
      </section>

      {/* Lista */}
      <section className="flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Áreas configuradas ({areas.length})
        </p>
        {areas.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aún no has creado ninguna área. Empieza con las más típicas:
            Peluquería, Manicure, Estomatología.
          </p>
        )}
        {areas.map((area, idx) => (
          <AreaRow key={area.id} area={area} pulseDelay={idx * 1800} />
        ))}
      </section>
    </div>
  );
}

function AreaRow({
  area,
  pulseDelay = 0,
}: {
  area: SalonArea;
  pulseDelay?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(area.name);
  const [description, setDescription] = useState(area.description ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await updateAreaAction(area.id, {
        name,
        description: description || null,
        sort_order: area.sort_order,
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
        `¿Eliminar el área "${area.name}"? Los servicios asociados perderán su categoría.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteAreaAction(area.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  if (!editing) {
    return (
      <div
        className="card-pulse-attention relative flex items-start justify-between gap-4 overflow-hidden rounded-3xl border bg-card p-6"
        style={{ animationDelay: `${pulseDelay}ms` }}
      >
        <div
          aria-hidden
          className="auto-feature-halo pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-gold-gradient-soft blur-2xl"
          style={{ animationDelay: `${pulseDelay}ms` }}
        />
        <div className="relative flex-1">
          <h3 className="font-serif text-xl">{area.name}</h3>
          {area.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {area.description}
            </p>
          )}
        </div>
        <div className="relative flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
          >
            Editar
          </Button>
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

  return (
    <div className="rounded-3xl border-2 border-primary bg-card p-6 shadow-glam flex flex-col gap-3">
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <Textarea
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={pending}>
          Guardar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditing(false);
            setName(area.name);
            setDescription(area.description ?? "");
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
