"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildChilePhone } from "@/lib/phone";

const ReservationSchema = z.object({
  salon_id: z.string().uuid(),
  area_id: z.string().uuid().nullable(),
  service_id: z.string().uuid().nullable(),
  client_name: z.string().min(2, "Nombre muy corto").max(100),
  client_phone: z.string().min(6, "Teléfono inválido").max(40),
  client_notes: z.string().max(500).optional().nullable(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
});

export type ReserveState = {
  error?: string;
  ok?: {
    whatsappUrl: string | null;
  };
} | null;

export async function reserveAction(
  _prev: ReserveState,
  formData: FormData,
): Promise<ReserveState> {
  // El form envía solo los dígitos locales; prependemos +56.
  const clientPhone = buildChilePhone(
    formData.get("client_phone") as string | null,
  );

  const parsed = ReservationSchema.safeParse({
    salon_id: formData.get("salon_id"),
    area_id: formData.get("area_id") || null,
    service_id: formData.get("service_id") || null,
    client_name: String(formData.get("client_name") ?? "").trim(),
    client_phone: clientPhone,
    client_notes:
      String(formData.get("client_notes") ?? "").trim() || null,
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const data = parsed.data;
  const startsAt = new Date(data.starts_at);
  const endsAt = new Date(data.ends_at);

  if (startsAt <= new Date()) {
    return { error: "El horario seleccionado ya pasó." };
  }
  if (endsAt <= startsAt) {
    return { error: "Rango de tiempo inválido." };
  }

  const supabase = await createClient();

  // Re-validar que el slot sigue libre (alguien pudo reservarlo entre tanto)
  const { data: conflicts } = await supabase.rpc("get_busy_slots", {
    p_salon_id: data.salon_id,
    p_day: data.starts_at.slice(0, 10),
  });

  const overlap = (conflicts ?? []).some((b: { area_id: string | null; starts_at: string; ends_at: string }) => {
    if (b.area_id != null && data.area_id != null && b.area_id !== data.area_id) {
      return false;
    }
    const bs = new Date(b.starts_at).getTime();
    const be = new Date(b.ends_at).getTime();
    return startsAt.getTime() < be && endsAt.getTime() > bs;
  });

  if (overlap) {
    return { error: "Ese horario ya fue tomado. Elige otro slot." };
  }

  // No usamos .select() / .single() porque anon no tiene SELECT sobre
  // appointments (la policy de SELECT es solo para el dueño). Un INSERT
  // con RETURNING dispararía 42501 al no poder leer la fila recién creada.
  const { error } = await supabase.from("appointments").insert({
    salon_id: data.salon_id,
    area_id: data.area_id,
    service_id: data.service_id,
    client_name: data.client_name,
    client_phone: data.client_phone,
    client_notes: data.client_notes,
    starts_at: data.starts_at,
    ends_at: data.ends_at,
    status: "pending" as const,
    source: "form" as const,
  });

  if (error) {
    return { error: "No pudimos guardar la reserva. Intenta de nuevo." };
  }

  const whatsappUrl = (formData.get("whatsapp_url") as string | null) || null;

  return { ok: { whatsappUrl } };
}
