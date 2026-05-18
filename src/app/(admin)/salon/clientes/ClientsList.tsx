"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { Client } from "@/lib/types";
import { createClientAction, type ClientActionState } from "./actions";

export function ClientsList({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.phone, c.email]
        .filter(Boolean)
        .some((field) => (field as string).toLowerCase().includes(q)),
    );
  }, [clients, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email…"
          className="max-w-md"
        />
        <NewClientDialog />
        <span className="ml-auto text-xs uppercase tracking-[0.15em] text-muted-foreground">
          {filtered.length} de {clients.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {clients.length === 0
            ? "Aún no tienes clientes registrados. Empieza creando el primero."
            : "Ningún cliente coincide con tu búsqueda."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/salon/clientes/${c.id}`}
              className="card-glam card-glam-hover flex flex-col gap-2 p-6"
            >
              <h3 className="font-serif text-xl">{c.name}</h3>
              {c.phone && (
                <p className="text-sm text-muted-foreground">{c.phone}</p>
              )}
              {c.email && (
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  {c.email}
                </p>
              )}
              {c.notes && (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {c.notes}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NewClientDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, action, pending] = useActionState<ClientActionState, FormData>(
    createClientAction,
    null,
  );

  useEffect(() => {
    if (state?.success && state.id) {
      toast.success(state.success);
      setOpen(false);
      router.push(`/salon/clientes/${state.id}`);
    }
    if (state?.error) toast.error(state.error);
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({
          className: "px-6 py-3 uppercase tracking-wider",
        })}
      >
        Nuevo cliente
      </DialogTrigger>
      <DialogContent className="max-w-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            Registrar cliente
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="cli-name"
              className="text-xs uppercase tracking-[0.15em]"
            >
              Nombre completo
            </Label>
            <Input id="cli-name" name="name" required autoComplete="name" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="cli-phone"
                className="text-xs uppercase tracking-[0.15em]"
              >
                Teléfono
              </Label>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40">
                <span className="flex select-none items-center bg-secondary px-3 font-serif text-base text-primary">
                  +56
                </span>
                <Input
                  id="cli-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="971234567"
                  className="flex-1 rounded-none border-0 focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="cli-email"
                className="text-xs uppercase tracking-[0.15em]"
              >
                Email
              </Label>
              <Input id="cli-email" name="email" type="email" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="cli-notes"
              className="text-xs uppercase tracking-[0.15em]"
            >
              Notas
            </Label>
            <Textarea
              id="cli-notes"
              name="notes"
              rows={3}
              placeholder="Alergias, preferencias, color de pelo natural…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Crear cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
