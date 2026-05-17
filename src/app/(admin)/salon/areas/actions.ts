"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const AreaSchema = z.object({
  name: z.string().min(2, "Nombre muy corto").max(80),
  description: z.string().max(500).optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type AreaActionState = { error?: string; success?: string } | null;

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

function revalidate() {
  revalidatePath("/salon/areas");
  revalidatePath("/salon/servicios");
  revalidatePath("/salon/galeria");
}

export async function createAreaAction(
  _prev: AreaActionState,
  formData: FormData,
): Promise<AreaActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Crea tu salón primero." };

  const parsed = AreaSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    sort_order: formData.get("sort_order") ?? 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("salon_areas").insert({
    salon_id: salonId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    sort_order: parsed.data.sort_order,
  });
  if (error) return { error: error.message };

  revalidate();
  return { success: "Área creada." };
}

export async function updateAreaAction(
  id: string,
  patch: { name: string; description: string | null; sort_order: number },
): Promise<AreaActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Sin salón." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("salon_areas")
    .update(patch)
    .eq("id", id)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };

  revalidate();
  return { success: "Área actualizada." };
}

export async function deleteAreaAction(id: string): Promise<AreaActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Sin salón." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("salon_areas")
    .delete()
    .eq("id", id)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };

  revalidate();
  return { success: "Área eliminada." };
}
