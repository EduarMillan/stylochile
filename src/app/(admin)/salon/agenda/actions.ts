"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/lib/types";

export type AgendaActionState = { error?: string; success?: string } | null;

const VALID_STATUSES: AppointmentStatus[] = [
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
];

async function ensureOwner(
  appointmentId: string,
): Promise<
  | { ok: true; salonId: string; userId: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, salon_id, salons!inner(owner_id)")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appt) return { ok: false, error: "Cita no encontrada." };

  // RLS ya garantiza el ownership pero validamos por claridad
  const ownerId = (appt as unknown as { salons: { owner_id: string } }).salons
    .owner_id;
  if (ownerId !== user.id)
    return { ok: false, error: "No autorizado." };

  return { ok: true, salonId: appt.salon_id, userId: user.id };
}

export async function setAppointmentStatusAction(
  appointmentId: string,
  status: AppointmentStatus,
  rejectionReason?: string,
): Promise<AgendaActionState> {
  if (!VALID_STATUSES.includes(status)) return { error: "Estado inválido." };

  const check = await ensureOwner(appointmentId);
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "rejected" && rejectionReason) {
    patch.rejection_reason = rejectionReason;
  }

  const { error } = await supabase
    .from("appointments")
    .update(patch)
    .eq("id", appointmentId);
  if (error) return { error: error.message };

  revalidatePath("/salon/agenda");
  revalidatePath("/dashboard");
  return { success: "Estado actualizado." };
}

export async function deleteAppointmentAction(
  appointmentId: string,
): Promise<AgendaActionState> {
  const check = await ensureOwner(appointmentId);
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId);
  if (error) return { error: error.message };

  revalidatePath("/salon/agenda");
  return { success: "Cita eliminada." };
}
