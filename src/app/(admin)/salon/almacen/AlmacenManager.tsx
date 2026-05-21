"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
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
import { createClient } from "@/lib/supabase/client";
import {
  MOVEMENT_LABEL,
  type InventoryItem,
  type InventoryMovement,
  type MovementType,
} from "@/lib/types";
import {
  deleteItemAction,
  recordMovementAction,
  saveItemAction,
  type ItemActionState,
  type MovementActionState,
} from "./actions";

const CURRENCIES = ["CLP", "USD", "EUR"];
const COMMON_UNITS = ["u", "ml", "g", "kg", "L"];

export function AlmacenManager({ items }: { items: InventoryItem[] }) {
  const [filter, setFilter] = useState<"all" | "low">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = items;
    if (filter === "low") {
      list = list.filter((i) => i.quantity <= i.min_quantity);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) =>
        [i.name, i.sku, i.supplier]
          .filter(Boolean)
          .some((f) => (f as string).toLowerCase().includes(q)),
      );
    }
    return list;
  }, [items, filter, query]);

  const lowCount = items.filter((i) => i.quantity <= i.min_quantity).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats + acciones */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Stat label="Items totales" value={items.length.toString()} />
        <Stat
          label="Stock bajo"
          value={lowCount.toString()}
          warn={lowCount > 0}
        />
        <Stat
          label="Valor estimado"
          value={formatTotalValue(items)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, SKU o proveedor…"
          className="max-w-md"
        />
        <FilterTab
          label="Todos"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterTab
          label={`Bajo stock${lowCount > 0 ? ` (${lowCount})` : ""}`}
          active={filter === "low"}
          onClick={() => setFilter("low")}
        />
        <ItemDialog />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {items.length === 0
            ? "Aún no tienes items en el almacén. Empieza creando el primero."
            : "Ningún item coincide con la búsqueda."}
        </p>
      ) : (
        <div className="card-glam overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/30">
              <tr>
                <Th>Producto</Th>
                <Th align="right">Cantidad</Th>
                <Th align="right">Min</Th>
                <Th align="right">Costo</Th>
                <Th>Proveedor</Th>
                <Th align="right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="card-glam p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-3 font-serif text-3xl ${warn ? "text-destructive" : "text-gold-gradient"}`}
      >
        {value}
      </p>
    </div>
  );
}

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
        active
          ? "border-b-2 border-primary text-primary"
          : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      className={`px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function ItemRow({ item }: { item: InventoryItem }) {
  const [pending, startTransition] = useTransition();
  const isLow = item.quantity <= item.min_quantity;

  function remove() {
    if (!confirm(`¿Eliminar "${item.name}"? Se perderá su historial.`)) return;
    startTransition(async () => {
      const res = await deleteItemAction(item.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  return (
    <tr className="border-t border-border first:border-t-0">
      <td className="px-4 py-4">
        <p className="font-serif text-base">{item.name}</p>
        {item.sku && (
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {item.sku}
          </p>
        )}
      </td>
      <td className="px-4 py-4 text-right">
        <span
          className={`font-serif text-lg ${isLow ? "text-destructive" : "text-foreground"}`}
        >
          {formatNumber(item.quantity)}
        </span>{" "}
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
          {item.unit}
        </span>
      </td>
      <td className="px-4 py-4 text-right text-muted-foreground">
        {formatNumber(item.min_quantity)}
      </td>
      <td className="px-4 py-4 text-right">
        {item.unit_cost != null ? (
          <span className="text-foreground">
            {formatNumber(item.unit_cost)}{" "}
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              {item.currency}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-4 text-muted-foreground">
        {item.supplier ?? "—"}
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap justify-end gap-1">
          <MovementDialog item={item} type="in" />
          <MovementDialog item={item} type="out" />
          <HistoryDialog item={item} />
          <ItemDialog initial={item} />
          <Button
            variant="ghost"
            size="sm"
            onClick={remove}
            disabled={pending}
          >
            ×
          </Button>
        </div>
      </td>
    </tr>
  );
}

function ItemDialog({ initial }: { initial?: InventoryItem }) {
  const [open, setOpen] = useState(false);
  // Snapshot estable de `initial` durante la apertura del diálogo. Evita
  // que los defaultValue cambien post-save (warning de Base UI). Se
  // refresca cuando el diálogo se cierra para que la próxima apertura
  // muestre datos frescos.
  const [snap, setSnap] = useState(initial);
  useEffect(() => {
    if (!open) setSnap(initial);
  }, [open, initial]);

  const [unit, setUnit] = useState(snap?.unit ?? "u");
  const [currency, setCurrency] = useState(snap?.currency ?? "CLP");
  const [state, action, pending] = useActionState<ItemActionState, FormData>(
    saveItemAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  const triggerLabel = initial ? "Editar" : "Nuevo item";
  const triggerProps = initial
    ? {
        variant: "outline" as const,
        size: "sm" as const,
        className: "",
      }
    : {
        variant: "default" as const,
        size: "default" as const,
        className: "ml-auto px-6 py-3 uppercase tracking-wider",
      };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({
          variant: triggerProps.variant,
          size: triggerProps.size,
          className: triggerProps.className,
        })}
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {initial ? "Editar item" : "Nuevo item"}
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          {snap && <input type="hidden" name="id" value={snap.id} />}
          <input type="hidden" name="unit" value={unit} />
          <input type="hidden" name="currency" value={currency} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="col-span-2 flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Nombre
              </Label>
              <Input
                name="name"
                required
                defaultValue={snap?.name ?? ""}
                placeholder="Ej. Tinte L'Oréal castaño 6.0"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                SKU
              </Label>
              <Input name="sku" defaultValue={snap?.sku ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {!snap && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs uppercase tracking-[0.15em]">
                  Cantidad inicial
                </Label>
                <Input
                  name="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue="0"
                />
              </div>
            )}
            {snap && <input type="hidden" name="quantity" value={snap.quantity} />}
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Mínimo
              </Label>
              <Input
                name="min_quantity"
                type="number"
                step="0.01"
                min="0"
                defaultValue={snap?.min_quantity ?? "0"}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Unidad
              </Label>
              <Select value={unit} onValueChange={(v) => setUnit(v ?? "u")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="col-span-2 flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Costo unitario
              </Label>
              <Input
                name="unit_cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={snap?.unit_cost ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-[0.15em]">
                Moneda
              </Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v ?? "CLP")}
              >
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
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-[0.15em]">
              Proveedor
            </Label>
            <Input
              name="supplier"
              defaultValue={snap?.supplier ?? ""}
              placeholder="Ej. Distribuidora Santiago"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-[0.15em]">
              Notas
            </Label>
            <Textarea
              name="notes"
              rows={2}
              defaultValue={snap?.notes ?? ""}
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

function MovementDialog({
  item,
  type,
}: {
  item: InventoryItem;
  type: MovementType;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<
    MovementActionState,
    FormData
  >(recordMovementAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  const label = type === "in" ? "+" : type === "out" ? "−" : "≈";
  const title =
    type === "in"
      ? "Registrar entrada"
      : type === "out"
        ? "Registrar salida"
        : "Ajustar inventario";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({
          variant: type === "in" ? "default" : "outline",
          size: "sm",
        })}
      >
        {label}
      </DialogTrigger>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{title}</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="item_id" value={item.id} />
          <input type="hidden" name="type" value={type} />

          <p className="text-sm text-muted-foreground">
            <span className="font-serif text-base text-foreground">
              {item.name}
            </span>
            {" — saldo actual "}
            <span className="text-foreground">
              {formatNumber(item.quantity)} {item.unit}
            </span>
          </p>

          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-[0.15em]">
              {type === "adjustment" ? "Nuevo saldo" : "Cantidad"}
            </Label>
            <Input
              name="quantity"
              type="number"
              step="0.01"
              min="0"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-[0.15em]">
              Motivo (opcional)
            </Label>
            <Textarea
              name="reason"
              rows={2}
              placeholder={
                type === "in"
                  ? "Ej. Compra a proveedor X"
                  : type === "out"
                    ? "Ej. Servicio a cliente / consumo interno"
                    : "Ej. Conteo físico de fin de mes"
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Registrando…" : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ item }: { item: InventoryItem }) {
  const [open, setOpen] = useState(false);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("inventory_movements")
          .select("*")
          .eq("item_id", item.id)
          .order("created_at", { ascending: false });
        if (cancelled) return;
        if (error) {
          toast.error(error.message);
          return;
        }
        setMovements((data as InventoryMovement[]) ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, item.id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Historial
      </DialogTrigger>
      <DialogContent className="max-w-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            Historial — {item.name}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin movimientos registrados.
          </p>
        ) : (
          <ul className="flex max-h-[60vh] flex-col overflow-y-auto">
            {movements.map((m) => (
              <li
                key={m.id}
                className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                    {MOVEMENT_LABEL[m.type]}
                  </p>
                  {m.reason && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {m.reason}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {new Date(m.created_at).toLocaleString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="font-serif text-xl">
                  {m.type === "in"
                    ? "+"
                    : m.type === "out"
                      ? "−"
                      : "≈"}
                  {formatNumber(m.quantity)}{" "}
                  <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {item.unit}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function formatNumber(n: number): string {
  return Number(n).toLocaleString("es-CL", {
    maximumFractionDigits: 2,
  });
}

function formatTotalValue(items: InventoryItem[]): string {
  const byCurrency = new Map<string, number>();
  for (const i of items) {
    if (i.unit_cost == null) continue;
    const total = i.quantity * i.unit_cost;
    byCurrency.set(i.currency, (byCurrency.get(i.currency) ?? 0) + total);
  }
  if (byCurrency.size === 0) return "—";
  return Array.from(byCurrency.entries())
    .map(([cur, total]) => `${formatNumber(total)} ${cur}`)
    .join(" · ");
}
