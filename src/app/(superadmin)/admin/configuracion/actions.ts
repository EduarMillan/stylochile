"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SUPER_ADMIN_EMAIL = "eduarmillan00@gmail.com";

const SettingsSchema = z.object({
  trial_days: z.number().int().min(1).max(365),
  grace_period_days: z.number().int().min(0).max(30),
  monthly_price: z.number().min(0).max(10_000_000),
  currency: z.string().min(2).max(8),
  admin_whatsapp: z.string().max(40).optional().or(z.literal("")),
});

export type PlatformSettingsState =
  | { error?: string; success?: string }
  | null;

async function ensureSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
    redirect("/");
  }
}

export async function savePlatformSettingsAction(
  _prev: PlatformSettingsState,
  formData: FormData,
): Promise<PlatformSettingsState> {
  await ensureSuperAdmin();

  const trial = Number.parseInt(
    String(formData.get("trial_days") ?? "").trim(),
    10,
  );
  const grace = Number.parseInt(
    String(formData.get("grace_period_days") ?? "").trim(),
    10,
  );
  const price = Number.parseFloat(
    String(formData.get("monthly_price") ?? "").trim(),
  );
  const currency = String(formData.get("currency") ?? "")
    .trim()
    .toUpperCase();
  const whatsapp = String(formData.get("admin_whatsapp") ?? "")
    .trim()
    .replace(/\D/g, "");

  const parsed = SettingsSchema.safeParse({
    trial_days: trial,
    grace_period_days: grace,
    monthly_price: price,
    currency,
    admin_whatsapp: whatsapp,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  // Usamos admin client (service role) para bypassear RLS. Ya validamos
  // arriba que la sesión es super-admin via ensureSuperAdmin().
  const supabase = createSupabaseAdminClient();
  const { data: updated, error } = await supabase
    .from("platform_settings")
    .update({
      trial_days: parsed.data.trial_days,
      grace_period_days: parsed.data.grace_period_days,
      monthly_price: parsed.data.monthly_price,
      currency: parsed.data.currency,
      admin_whatsapp: parsed.data.admin_whatsapp || null,
    })
    .eq("id", true)
    .select();

  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return {
      error:
        "No se actualizó ninguna fila. Verifica que estés autenticado como super-admin y que la política RLS de platform_settings permita UPDATE para is_app_admin().",
    };
  }

  // Revalida desde la raíz para que TODAS las páginas con el layout admin
  // (que lee platform_settings) reciban el valor nuevo de admin_whatsapp.
  revalidatePath("/", "layout");
  return { success: "Configuración guardada." };
}
