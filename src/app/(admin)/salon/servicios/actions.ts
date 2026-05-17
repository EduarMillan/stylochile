"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ServiceSchema = z.object({
  area_id: z.string().uuid().nullable(),
  name: z.string().min(2, "Nombre muy corto").max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  price: z
    .union([z.string().length(0), z.coerce.number().min(0)])
    .nullable()
    .optional(),
  currency: z.string().min(1).max(8).default("CLP"),
  duration_minutes: z
    .union([z.string().length(0), z.coerce.number().int().min(1).max(720)])
    .nullable()
    .optional(),
});

export type ServiceActionState = { error?: string; success?: string } | null;

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

function pickString(v: FormDataEntryValue | null): string {
  return v == null ? "" : String(v).trim();
}

export async function saveServiceAction(
  _prev: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Crea tu salón primero." };

  const id = pickString(formData.get("id")) || null;
  const areaIdRaw = pickString(formData.get("area_id"));
  const areaId = areaIdRaw && areaIdRaw !== "none" ? areaIdRaw : null;

  const parsed = ServiceSchema.safeParse({
    area_id: areaId,
    name: pickString(formData.get("name")),
    description: pickString(formData.get("description")),
    price: pickNumber(formData.get("price")),
    currency: pickString(formData.get("currency")) || "CLP",
    duration_minutes: pickNumber(formData.get("duration_minutes")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const payload = {
    salon_id: salonId,
    area_id: parsed.data.area_id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    price: parsed.data.price ?? null,
    currency: parsed.data.currency,
    duration_minutes: parsed.data.duration_minutes ?? null,
  };

  if (id) {
    const { error } = await supabase
      .from("services")
      .update(payload)
      .eq("id", id)
      .eq("salon_id", salonId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("services").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/salon/servicios");
  return { success: id ? "Servicio actualizado." : "Servicio creado." };
}

export async function deleteServiceAction(
  id: string,
): Promise<ServiceActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Sin salón." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };

  revalidatePath("/salon/servicios");
  return { success: "Servicio eliminado." };
}
