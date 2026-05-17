"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listAllFilesUnder, removeStorageFiles } from "@/lib/storage";

const SUPER_ADMIN_EMAIL = "eduarmillan00@gmail.com";

/**
 * Verifica que la sesión actual pertenezca al super-admin. Usa el cliente
 * session-based (anon key + cookies) para leer el JWT del usuario.
 * Devuelve true si OK, o un objeto error que el caller debe devolver.
 */
async function ensureSuperAdmin(): Promise<true | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
    return { error: "No autorizado." };
  }
  return true;
}

export type AdminActionState = { error?: string; success?: string } | null;

export async function suspendSalonAction(
  salonId: string,
): Promise<AdminActionState> {
  const check = await ensureSuperAdmin();
  if (check !== true) return check;

  const admin = createSupabaseAdminClient();
  const { data: updated, error } = await admin
    .from("salons")
    .update({ suspended_at: new Date().toISOString() })
    .eq("id", salonId)
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Salón no encontrado." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/salones");
  return { success: "Salón suspendido." };
}

export async function restoreSalonAction(
  salonId: string,
): Promise<AdminActionState> {
  const check = await ensureSuperAdmin();
  if (check !== true) return check;

  const admin = createSupabaseAdminClient();
  const { data: updated, error } = await admin
    .from("salons")
    .update({ suspended_at: null })
    .eq("id", salonId)
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Salón no encontrado." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/salones");
  return { success: "Salón restaurado." };
}

/**
 * Marca un salón como pagado: extiende el período un mes desde la fecha
 * más tardía entre "ahora", current_period_ends_at y trial_ends_at (si
 * aún hay días de trial restantes — no se pierden). Status pasa a
 * "active" y se registra last_payment.
 */
export async function markSalonPaidAction(
  salonId: string,
  note?: string,
): Promise<AdminActionState> {
  const check = await ensureSuperAdmin();
  if (check !== true) return check;

  const admin = createSupabaseAdminClient();

  const [{ data: sub }, { data: settings }] = await Promise.all([
    admin
      .from("salon_subscriptions")
      .select("id, trial_ends_at, current_period_ends_at")
      .eq("salon_id", salonId)
      .maybeSingle(),
    admin
      .from("platform_settings")
      .select("monthly_price")
      .eq("id", true)
      .maybeSingle(),
  ]);

  if (!sub) return { error: "Subscription no encontrada." };

  // El nuevo período arranca desde la fecha más lejana entre:
  //   - now (caso vencido)
  //   - current_period_ends_at (renovación adelantada — acumulativo)
  //   - trial_ends_at (pago durante el trial — el plan kick-in al final
  //     del trial, no se pierden los días gratis restantes)
  const now = new Date();
  const candidates: Date[] = [now];
  if (sub.current_period_ends_at) {
    candidates.push(new Date(sub.current_period_ends_at));
  }
  if (sub.trial_ends_at) {
    const trialEnd = new Date(sub.trial_ends_at);
    if (trialEnd > now) candidates.push(trialEnd);
  }
  const baseDate = new Date(
    Math.max(...candidates.map((d) => d.getTime())),
  );
  const periodEnd = new Date(baseDate);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: updated, error } = await admin
    .from("salon_subscriptions")
    .update({
      status: "active",
      current_period_starts_at: baseDate.toISOString(),
      current_period_ends_at: periodEnd.toISOString(),
      last_payment_at: now.toISOString(),
      last_payment_amount: settings?.monthly_price ?? null,
      last_payment_note: note?.trim() || null,
    })
    .eq("id", sub.id)
    .select("id");

  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "No se actualizó ninguna fila." };
  }

  revalidatePath("/", "layout");
  return { success: "Pago registrado. Plan extendido un mes." };
}

export async function deleteSalonAction(
  salonId: string,
): Promise<AdminActionState> {
  const check = await ensureSuperAdmin();
  if (check !== true) return check;

  const admin = createSupabaseAdminClient();

  // Lista todos los archivos del salón ANTES de borrar la fila — la DB
  // cascade-elimina staff, gallery, facility, etc. pero Storage queda
  // intacto. Listar bajo `{salonId}/` cubre todas las subcarpetas
  // (staff/, gallery/, facility/, logo/, clients/...). El service role
  // bypassea RLS de storage también, así que no necesitamos la policy
  // admin que añadimos en migración 0016 — sigue siendo defensiva.
  const files = await listAllFilesUnder(admin, salonId);

  const { error } = await admin.from("salons").delete().eq("id", salonId);
  if (error) return { error: error.message };

  if (files.length > 0) {
    await removeStorageFiles(admin, files);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/salones");
  return { success: "Salón eliminado permanentemente." };
}
