"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { removeStorageFiles } from "@/lib/storage";

const PhotoSchema = z.object({
  client_id: z.string().uuid(),
  photo_url: z.string().url("Falta la foto."),
  caption: z.string().max(500).optional().or(z.literal("")),
  taken_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
});

export type PhotoActionState = { error?: string; success?: string } | null;

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

export async function addClientPhotoAction(
  _prev: PhotoActionState,
  formData: FormData,
): Promise<PhotoActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Sin salón." };

  const parsed = PhotoSchema.safeParse({
    client_id: formData.get("client_id"),
    photo_url: formData.get("photo_url"),
    caption: String(formData.get("caption") ?? "").trim(),
    taken_at: formData.get("taken_at"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();

  // Verifica que el cliente pertenece al salón del dueño
  const { data: client } = await supabase
    .from("clients")
    .select("id, salon_id")
    .eq("id", parsed.data.client_id)
    .eq("salon_id", salonId)
    .maybeSingle();
  if (!client) return { error: "Cliente no encontrado." };

  const { error } = await supabase.from("client_progress_photos").insert({
    client_id: parsed.data.client_id,
    salon_id: salonId,
    photo_url: parsed.data.photo_url,
    caption: parsed.data.caption || null,
    taken_at: parsed.data.taken_at,
  });
  if (error) return { error: error.message };

  revalidatePath(`/salon/clientes/${parsed.data.client_id}`);
  return { success: "Foto añadida al historial." };
}

export async function deleteClientPhotoAction(
  photoId: string,
  clientId: string,
): Promise<PhotoActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Sin salón." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("client_progress_photos")
    .select("photo_url")
    .eq("id", photoId)
    .eq("salon_id", salonId)
    .maybeSingle();

  const { error } = await supabase
    .from("client_progress_photos")
    .delete()
    .eq("id", photoId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };

  if (existing) {
    await removeStorageFiles(supabase, [existing.photo_url]);
  }

  revalidatePath(`/salon/clientes/${clientId}`);
  return { success: "Foto eliminada." };
}
