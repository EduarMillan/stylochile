"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { removeStorageFiles } from "@/lib/storage";

const ClientSchema = z.object({
  name: z.string().min(2, "Nombre muy corto").max(120),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z
    .union([z.string().email("Email inválido"), z.literal("")])
    .optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type ClientActionState = { error?: string; success?: string; id?: string } | null;

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

export async function createClientAction(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Crea tu salón primero." };

  const parsed = ClientSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      salon_id: salonId,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/salon/clientes");
  return { success: "Cliente creado.", id: data.id };
}

export async function updateClientAction(
  id: string,
  patch: { name: string; phone: string | null; email: string | null; notes: string | null },
): Promise<ClientActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Sin salón." };

  const parsed = ClientSchema.safeParse({
    name: patch.name,
    phone: patch.phone ?? "",
    email: patch.email ?? "",
    notes: patch.notes ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };

  revalidatePath("/salon/clientes");
  revalidatePath(`/salon/clientes/${id}`);
  return { success: "Cliente actualizado." };
}

export async function deleteClientAction(id: string): Promise<ClientActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Sin salón." };

  const supabase = await createClient();

  // Recupera todas las URLs de progress photos antes de borrar el cliente
  // (la cascade DB las elimina pero deja los archivos en Storage).
  const { data: progressPhotos } = await supabase
    .from("client_progress_photos")
    .select("photo_url")
    .eq("client_id", id)
    .eq("salon_id", salonId);

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };

  if (progressPhotos && progressPhotos.length > 0) {
    await removeStorageFiles(
      supabase,
      progressPhotos.map((p) => p.photo_url),
    );
  }

  revalidatePath("/salon/clientes");
  return { success: "Cliente eliminado." };
}
