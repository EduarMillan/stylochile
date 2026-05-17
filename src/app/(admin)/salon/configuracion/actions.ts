"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { CUBA_MUNICIPIOS } from "@/lib/cuba";
import { DEFAULT_HOURS, type WeeklyHours } from "@/lib/types";
import { removeStorageFiles } from "@/lib/storage";

const TimeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const DayHoursSchema = z.object({
  closed: z.boolean(),
  open: z.string().regex(TimeRegex, "Formato HH:mm"),
  close: z.string().regex(TimeRegex, "Formato HH:mm"),
});

const HoursSchema = z.object({
  mon: DayHoursSchema,
  tue: DayHoursSchema,
  wed: DayHoursSchema,
  thu: DayHoursSchema,
  fri: DayHoursSchema,
  sat: DayHoursSchema,
  sun: DayHoursSchema,
});

const SalonSchema = z.object({
  name: z.string().min(2, "Nombre muy corto").max(100),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  description: z.string().max(2000).optional().or(z.literal("")),
  calle: z.string().max(120).optional().or(z.literal("")),
  numero: z.string().max(40).optional().or(z.literal("")),
  entre_calle_a: z.string().max(120).optional().or(z.literal("")),
  entre_calle_b: z.string().max(120).optional().or(z.literal("")),
  reparto: z.string().max(120).optional().or(z.literal("")),
  municipio: z.string().max(120).optional().or(z.literal("")),
  provincia: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  whatsapp: z.string().max(40).optional().or(z.literal("")),
  logo_url: z.string().url().max(500).optional().or(z.literal("")),
  hours: HoursSchema,
  is_published: z.boolean(),
});

export type SaveSalonState = {
  error?: string;
  success?: string;
} | null;

function digitsOnly(v: FormDataEntryValue | null): string {
  return String(v ?? "").replace(/\D/g, "");
}

export async function saveSalonAction(
  _prev: SaveSalonState,
  formData: FormData,
): Promise<SaveSalonState> {
  let hours: WeeklyHours = DEFAULT_HOURS;
  const hoursRaw = formData.get("hours_json");
  if (typeof hoursRaw === "string" && hoursRaw.length > 0) {
    try {
      hours = JSON.parse(hoursRaw);
    } catch {
      return { error: "Horario inválido." };
    }
  }

  // WhatsApp: el form envía el número internacional completo en dígitos
  // (código de país incluido). Lo guardamos tal cual.
  const whatsappFull = digitsOnly(formData.get("whatsapp"));

  const provincia = String(formData.get("provincia") ?? "").trim();
  const municipio = String(formData.get("municipio") ?? "").trim();

  // Valida combinación provincia/municipio
  if (provincia && !(provincia in CUBA_MUNICIPIOS)) {
    return { error: "Provincia no válida." };
  }
  if (municipio && provincia) {
    const valid = CUBA_MUNICIPIOS[provincia] ?? [];
    if (!valid.includes(municipio)) {
      return { error: "Municipio no pertenece a la provincia seleccionada." };
    }
  }

  const input = {
    name: String(formData.get("name") ?? "").trim(),
    slug: slugify(String(formData.get("slug") ?? "").trim()),
    description: String(formData.get("description") ?? "").trim(),
    calle: String(formData.get("calle") ?? "").trim(),
    numero: String(formData.get("numero") ?? "").trim(),
    entre_calle_a: String(formData.get("entre_calle_a") ?? "").trim(),
    entre_calle_b: String(formData.get("entre_calle_b") ?? "").trim(),
    reparto: String(formData.get("reparto") ?? "").trim(),
    municipio,
    provincia,
    phone: String(formData.get("phone") ?? "").trim(),
    whatsapp: whatsappFull,
    logo_url: String(formData.get("logo_url") ?? "").trim(),
    hours,
    is_published: formData.get("is_published") === "on",
  };

  const parsed = SalonSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("salons")
    .select("id, logo_url")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const payload = {
    owner_id: user.id,
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    calle: data.calle || null,
    numero: data.numero || null,
    entre_calle_a: data.entre_calle_a || null,
    entre_calle_b: data.entre_calle_b || null,
    reparto: data.reparto || null,
    municipio: data.municipio || null,
    provincia: data.provincia || null,
    phone: data.phone || null,
    whatsapp: data.whatsapp || null,
    logo_url: data.logo_url || null,
    hours: data.hours,
    is_published: data.is_published,
  };

  if (existing) {
    const { error } = await supabase
      .from("salons")
      .update(payload)
      .eq("id", existing.id);
    if (error) {
      return {
        error:
          error.code === "23505"
            ? "Ese identificador (URL) ya está en uso."
            : error.message,
      };
    }
    // Si el logo cambió, borra el archivo anterior del Storage.
    if (
      existing.logo_url &&
      existing.logo_url !== payload.logo_url
    ) {
      await removeStorageFiles(supabase, [existing.logo_url]);
    }
  } else {
    const { error } = await supabase.from("salons").insert(payload);
    if (error) {
      return {
        error:
          error.code === "23505"
            ? "Ese identificador (URL) ya está en uso."
            : error.message,
      };
    }
  }

  // Revalida desde la raíz para incluir el layout admin (banner +
  // sidebar) y todas las páginas públicas (/, /salones, /s/[slug]).
  revalidatePath("/", "layout");
  return { success: "Cambios guardados." };
}
