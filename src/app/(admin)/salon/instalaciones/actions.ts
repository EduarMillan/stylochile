"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { removeStorageFiles } from "@/lib/storage";

const FacilitySchema = z.object({
  image_url: z.string().url("Falta la imagen."),
  caption: z.string().max(200).optional().or(z.literal("")),
});

export type FacilityActionState = { error?: string; success?: string } | null;

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

export async function saveFacilityPhotoAction(
  _prev: FacilityActionState,
  formData: FormData,
): Promise<FacilityActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Crea tu salón primero." };

  const id = String(formData.get("id") ?? "").trim() || null;

  const parsed = FacilitySchema.safeParse({
    image_url: String(formData.get("image_url") ?? "").trim(),
    caption: String(formData.get("caption") ?? "").trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const payload = {
    salon_id: salonId,
    image_url: parsed.data.image_url,
    caption: parsed.data.caption || null,
  };

  if (id) {
    const { data: previous } = await supabase
      .from("salon_facility_photos")
      .select("image_url")
      .eq("id", id)
      .eq("salon_id", salonId)
      .maybeSingle();

    const { error } = await supabase
      .from("salon_facility_photos")
      .update(payload)
      .eq("id", id)
      .eq("salon_id", salonId);
    if (error) return { error: error.message };

    if (
      previous?.image_url &&
      previous.image_url !== payload.image_url
    ) {
      await removeStorageFiles(supabase, [previous.image_url]);
    }
  } else {
    const { error } = await supabase
      .from("salon_facility_photos")
      .insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/salon/instalaciones");
  return { success: id ? "Foto actualizada." : "Foto añadida." };
}

export async function deleteFacilityPhotoAction(
  id: string,
): Promise<FacilityActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Sin salón." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("salon_facility_photos")
    .select("image_url")
    .eq("id", id)
    .eq("salon_id", salonId)
    .maybeSingle();

  const { error } = await supabase
    .from("salon_facility_photos")
    .delete()
    .eq("id", id)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };

  if (existing) {
    await removeStorageFiles(supabase, [existing.image_url]);
  }

  revalidatePath("/salon/instalaciones");
  return { success: "Foto eliminada." };
}
