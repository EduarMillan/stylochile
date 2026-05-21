"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { removeStorageFiles } from "@/lib/storage";

const EventSchema = z
  .object({
    type: z.enum(["course", "event", "workshop"]),
    title: z.string().min(2, "El título es muy corto.").max(140),
    description: z.string().max(2000).optional().or(z.literal("")),
    cover_image_url: z.string().url().max(500).optional().or(z.literal("")),
    starts_at: z.string().min(1, "Fecha de inicio requerida."),
    ends_at: z.string().optional().or(z.literal("")),
    price: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (v) => !v || /^\d+(\.\d{1,2})?$/.test(v),
        "Precio inválido (ej. 25000 o 25000.50).",
      ),
    currency: z.string().min(3).max(3),
    capacity_label: z.string().max(60).optional().or(z.literal("")),
    whatsapp_message: z.string().max(500).optional().or(z.literal("")),
    is_published: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.ends_at) return true;
      return new Date(data.ends_at).getTime() >= new Date(data.starts_at).getTime();
    },
    { message: "La fecha de fin no puede ser anterior al inicio." },
  );

export type EventActionState = { error?: string; success?: string } | null;

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

function toIsoOrNull(local: string | null | undefined): string | null {
  if (!local) return null;
  // El input datetime-local devuelve "YYYY-MM-DDTHH:mm" en hora local del
  // navegador. new Date(...).toISOString() lo convierte a UTC respetando
  // la zona del usuario — Postgres timestamptz luego lo muestra en la
  // zona configurada al leer.
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function saveEventAction(
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Crea tu salón primero." };

  const id = String(formData.get("id") ?? "").trim() || null;

  const parsed = EventSchema.safeParse({
    type: String(formData.get("type") ?? "event"),
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    cover_image_url: String(formData.get("cover_image_url") ?? "").trim(),
    starts_at: String(formData.get("starts_at") ?? "").trim(),
    ends_at: String(formData.get("ends_at") ?? "").trim(),
    price: String(formData.get("price") ?? "").trim(),
    currency: String(formData.get("currency") ?? "CLP").trim().toUpperCase(),
    capacity_label: String(formData.get("capacity_label") ?? "").trim(),
    whatsapp_message: String(formData.get("whatsapp_message") ?? "").trim(),
    is_published: formData.get("is_published") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;

  const startsAt = toIsoOrNull(d.starts_at);
  if (!startsAt) return { error: "Fecha de inicio inválida." };

  const supabase = await createClient();
  const payload = {
    salon_id: salonId,
    type: d.type,
    title: d.title,
    description: d.description || null,
    cover_image_url: d.cover_image_url || null,
    starts_at: startsAt,
    ends_at: toIsoOrNull(d.ends_at),
    price: d.price ? Number(d.price) : null,
    currency: d.currency,
    capacity_label: d.capacity_label || null,
    whatsapp_message: d.whatsapp_message || null,
    is_published: d.is_published,
  };

  if (id) {
    const { data: previous } = await supabase
      .from("salon_events")
      .select("cover_image_url")
      .eq("id", id)
      .eq("salon_id", salonId)
      .maybeSingle();

    const { error } = await supabase
      .from("salon_events")
      .update(payload)
      .eq("id", id)
      .eq("salon_id", salonId);
    if (error) return { error: error.message };

    if (
      previous?.cover_image_url &&
      previous.cover_image_url !== payload.cover_image_url
    ) {
      await removeStorageFiles(supabase, [previous.cover_image_url]);
    }
  } else {
    const { error } = await supabase.from("salon_events").insert(payload);
    if (error) return { error: error.message };
  }

  // Revalida raíz para que la vitrina pública también actualice el ribbon
  // y la sección de eventos.
  revalidatePath("/", "layout");
  return { success: id ? "Evento actualizado." : "Evento creado." };
}

export async function deleteEventAction(
  id: string,
): Promise<EventActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Sin salón." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("salon_events")
    .select("cover_image_url")
    .eq("id", id)
    .eq("salon_id", salonId)
    .maybeSingle();

  const { error } = await supabase
    .from("salon_events")
    .delete()
    .eq("id", id)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };

  if (existing?.cover_image_url) {
    await removeStorageFiles(supabase, [existing.cover_image_url]);
  }

  revalidatePath("/", "layout");
  return { success: "Evento eliminado." };
}
