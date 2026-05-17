"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { removeStorageFiles } from "@/lib/storage";

const GallerySchema = z.object({
  area_id: z.string().uuid().nullable(),
  title: z.string().max(120).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
  before_url: z.string().url("URL inválida"),
  after_url: z.string().url("URL inválida"),
});

const MAX_ITEMS_PER_AREA = 4;

export type GalleryActionState = { error?: string; success?: string } | null;

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

export async function saveGalleryAction(
  _prev: GalleryActionState,
  formData: FormData,
): Promise<GalleryActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Crea tu salón primero." };

  const id = String(formData.get("id") ?? "").trim() || null;
  const areaIdRaw = String(formData.get("area_id") ?? "").trim();
  const areaId = areaIdRaw && areaIdRaw !== "none" ? areaIdRaw : null;

  const parsed = GallerySchema.safeParse({
    area_id: areaId,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    before_url: String(formData.get("before_url") ?? "").trim(),
    after_url: String(formData.get("after_url") ?? "").trim(),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error:
        issue?.path[0] === "before_url"
          ? "Falta la imagen 'antes'."
          : issue?.path[0] === "after_url"
            ? "Falta la imagen 'después'."
            : (issue?.message ?? "Datos inválidos."),
    };
  }

  const supabase = await createClient();
  const payload = {
    salon_id: salonId,
    area_id: parsed.data.area_id,
    title: parsed.data.title || null,
    description: parsed.data.description || null,
    before_url: parsed.data.before_url,
    after_url: parsed.data.after_url,
  };

  // Verifica el límite de 4 por área. En updates excluye el propio id
  // (mover de una área llena a la misma área no es problema).
  const overLimitError = await checkAreaLimit(
    supabase,
    salonId,
    parsed.data.area_id,
    id,
  );
  if (overLimitError) return { error: overLimitError };

  if (id) {
    // Captura URLs anteriores antes de update para limpiar las
    // reemplazadas en Storage.
    const { data: previous } = await supabase
      .from("gallery_items")
      .select("before_url, after_url")
      .eq("id", id)
      .eq("salon_id", salonId)
      .maybeSingle();

    const { error } = await supabase
      .from("gallery_items")
      .update(payload)
      .eq("id", id)
      .eq("salon_id", salonId);
    if (error) return { error: error.message };

    if (previous) {
      const replaced: Array<string | null> = [];
      if (previous.before_url && previous.before_url !== payload.before_url) {
        replaced.push(previous.before_url);
      }
      if (previous.after_url && previous.after_url !== payload.after_url) {
        replaced.push(previous.after_url);
      }
      if (replaced.length > 0) {
        await removeStorageFiles(supabase, replaced);
      }
    }
  } else {
    const { error } = await supabase.from("gallery_items").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/salon/galeria");
  return { success: id ? "Trabajo actualizado." : "Trabajo añadido." };
}

async function checkAreaLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  salonId: string,
  areaId: string | null,
  currentId: string | null,
): Promise<string | null> {
  let query = supabase
    .from("gallery_items")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salonId);
  if (areaId == null) {
    query = query.is("area_id", null);
  } else {
    query = query.eq("area_id", areaId);
  }
  if (currentId) {
    query = query.neq("id", currentId);
  }
  const { count, error } = await query;
  if (error) return error.message;
  if ((count ?? 0) >= MAX_ITEMS_PER_AREA) {
    const where = areaId == null ? "Sin área" : "esta área";
    return `${where} ya tiene ${MAX_ITEMS_PER_AREA} trabajos (el máximo). Elimina uno o súbelo a otra área.`;
  }
  return null;
}

export async function deleteGalleryItemAction(
  id: string,
): Promise<GalleryActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Sin salón." };

  const supabase = await createClient();

  // Fetch primero para tener las URLs y poder limpiar Storage después.
  const { data: existing } = await supabase
    .from("gallery_items")
    .select("before_url, after_url")
    .eq("id", id)
    .eq("salon_id", salonId)
    .maybeSingle();

  const { error } = await supabase
    .from("gallery_items")
    .delete()
    .eq("id", id)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };

  if (existing) {
    await removeStorageFiles(supabase, [
      existing.before_url,
      existing.after_url,
    ]);
  }

  revalidatePath("/salon/galeria");
  return { success: "Trabajo eliminado." };
}
