"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { removeStorageFiles } from "@/lib/storage";

const InstagramRegex = /^[A-Za-z0-9._]{1,30}$/;

const StaffSchema = z.object({
  area_id: z.string().uuid().nullable(),
  name: z.string().min(2, "Nombre muy corto").max(120),
  role: z.string().max(80).optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
  photo_url: z.string().url().optional().or(z.literal("")),
  specialties: z.array(z.string().min(1).max(60)).max(12),
  years_experience: z
    .number()
    .int()
    .min(0)
    .max(80)
    .nullable(),
  instagram_handle: z
    .string()
    .regex(InstagramRegex, "Instagram inválido")
    .optional()
    .or(z.literal("")),
  certifications: z.string().max(500).optional().or(z.literal("")),
});

export type StaffActionState = { error?: string; success?: string } | null;

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

export async function saveStaffAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Crea tu salón primero." };

  const id = String(formData.get("id") ?? "").trim() || null;
  const areaIdRaw = String(formData.get("area_id") ?? "").trim();
  const areaId = areaIdRaw && areaIdRaw !== "none" ? areaIdRaw : null;

  const specialties = String(formData.get("specialties") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);

  const yearsRaw = String(formData.get("years_experience") ?? "").trim();
  const yearsExperience = yearsRaw === "" ? null : Number.parseInt(yearsRaw, 10);
  if (yearsRaw !== "" && Number.isNaN(yearsExperience)) {
    return { error: "Años de experiencia inválidos." };
  }

  const instagramRaw = String(formData.get("instagram_handle") ?? "").trim();
  const instagramHandle = instagramRaw.replace(/^@/, "");

  const parsed = StaffSchema.safeParse({
    area_id: areaId,
    name: String(formData.get("name") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    photo_url: String(formData.get("photo_url") ?? "").trim(),
    specialties,
    years_experience: yearsExperience,
    instagram_handle: instagramHandle,
    certifications: String(formData.get("certifications") ?? "").trim(),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const supabase = await createClient();
  const payload = {
    salon_id: salonId,
    area_id: data.area_id,
    name: data.name,
    role: data.role || null,
    bio: data.bio || null,
    photo_url: data.photo_url || null,
    specialties: data.specialties,
    years_experience: data.years_experience,
    instagram_handle: data.instagram_handle || null,
    certifications: data.certifications || null,
  };

  if (id) {
    const { data: previous } = await supabase
      .from("staff")
      .select("photo_url")
      .eq("id", id)
      .eq("salon_id", salonId)
      .maybeSingle();

    const { error } = await supabase
      .from("staff")
      .update(payload)
      .eq("id", id)
      .eq("salon_id", salonId);
    if (error) return { error: error.message };

    if (
      previous?.photo_url &&
      previous.photo_url !== payload.photo_url
    ) {
      await removeStorageFiles(supabase, [previous.photo_url]);
    }
  } else {
    const { error } = await supabase.from("staff").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/salon/staff");
  return { success: id ? "Miembro actualizado." : "Miembro añadido." };
}

export async function deleteStaffAction(
  id: string,
): Promise<StaffActionState> {
  const salonId = await getSalonId();
  if (!salonId) return { error: "Sin salón." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("staff")
    .select("photo_url")
    .eq("id", id)
    .eq("salon_id", salonId)
    .maybeSingle();

  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", id)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };

  if (existing) {
    await removeStorageFiles(supabase, [existing.photo_url]);
  }

  revalidatePath("/salon/staff");
  return { success: "Miembro eliminado." };
}
