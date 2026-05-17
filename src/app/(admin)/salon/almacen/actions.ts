"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { MovementType } from "@/lib/types";

const ItemSchema = z.object({
  name: z.string().min(2, "Nombre muy corto").max(120),
  sku: z.string().max(60).optional().or(z.literal("")),
  unit: z.string().min(1).max(8).default("u"),
  quantity: z.coerce.number().min(0).default(0),
  min_quantity: z.coerce.number().min(0).default(0),
  unit_cost: z
    .union([z.string().length(0), z.coerce.number().min(0)])
    .nullable()
    .optional(),
  currency: z.string().min(1).max(8).default("CUP"),
  supplier: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

const MovementSchema = z.object({
  item_id: z.string().uuid(),
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.coerce.number().min(0),
  reason: z.string().max(500).optional().or(z.literal("")),
});

export type ItemActionState = { error?: string; success?: string } | null;
export type MovementActionState = { error?: string; success?: string } | null;

async function getSalonId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase
    .from("salons")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

function pickNumber(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function saveItemAction(
  _prev: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Crea tu salón primero." };

  const id = String(formData.get("id") ?? "").trim() || null;

  const parsed = ItemSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    sku: String(formData.get("sku") ?? "").trim(),
    unit: String(formData.get("unit") ?? "u").trim() || "u",
    quantity: formData.get("quantity") ?? 0,
    min_quantity: formData.get("min_quantity") ?? 0,
    unit_cost: pickNumber(formData.get("unit_cost")),
    currency: String(formData.get("currency") ?? "CUP").trim() || "CUP",
    supplier: String(formData.get("supplier") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const supabase = await createClient();
  const payload = {
    salon_id: salonId,
    name: data.name,
    sku: data.sku || null,
    unit: data.unit,
    quantity: data.quantity,
    min_quantity: data.min_quantity,
    unit_cost: data.unit_cost ?? null,
    currency: data.currency,
    supplier: data.supplier || null,
    notes: data.notes || null,
  };

  if (id) {
    // No tocamos quantity en updates regulares (solo via movimientos)
    const { quantity: _omit, ...rest } = payload;
    void _omit;
    const { error } = await supabase
      .from("inventory_items")
      .update(rest)
      .eq("id", id)
      .eq("salon_id", salonId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("inventory_items").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/salon/almacen");
  return { success: id ? "Item actualizado." : "Item creado." };
}

export async function deleteItemAction(
  id: string,
): Promise<ItemActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Sin salón." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", id)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };

  revalidatePath("/salon/almacen");
  return { success: "Item eliminado." };
}

export async function recordMovementAction(
  _prev: MovementActionState,
  formData: FormData,
): Promise<MovementActionState> {
  const parsed = MovementSchema.safeParse({
    item_id: formData.get("item_id"),
    type: formData.get("type"),
    quantity: formData.get("quantity") ?? 0,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_inventory_movement", {
    p_item_id: parsed.data.item_id,
    p_type: parsed.data.type as MovementType,
    p_quantity: parsed.data.quantity,
    p_reason: parsed.data.reason || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/salon/almacen");
  return { success: "Movimiento registrado." };
}
