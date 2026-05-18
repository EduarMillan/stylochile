"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildChilePhone, digitsOnly } from "@/lib/phone";

const ReviewSchema = z.object({
  salon_slug: z.string().min(1),
  client_name: z.string().min(2, "Nombre muy corto").max(100),
  client_phone: z.string().min(6, "Teléfono inválido").max(40),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().or(z.literal("")),
});

export type ReviewState = {
  error?: string;
  success?: string;
} | null;

export async function submitReviewAction(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  // El form envía solo los dígitos locales; prependemos +56.
  const clientPhone = buildChilePhone(
    formData.get("client_phone") as string | null,
  );

  const parsed = ReviewSchema.safeParse({
    salon_slug: formData.get("salon_slug"),
    client_name: String(formData.get("client_name") ?? "").trim(),
    client_phone: clientPhone,
    rating: formData.get("rating") ?? 0,
    comment: String(formData.get("comment") ?? "").trim(),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;

  const supabase = await createClient();

  // Resuelve el salón por slug (solo publicados)
  const { data: salon } = await supabase
    .from("salons")
    .select("id, is_published")
    .eq("slug", data.salon_slug)
    .maybeSingle();
  if (!salon || !salon.is_published) {
    return { error: "Salón no encontrado." };
  }

  // Verifica que el teléfono pertenece a una cita aprobada/completada
  const phoneFull = digitsOnly(data.client_phone);
  const { data: canReview, error: rpcError } = await supabase.rpc(
    "can_review_salon",
    { p_salon_id: salon.id, p_phone: phoneFull },
  );
  if (rpcError) return { error: rpcError.message };
  if (!canReview) {
    return {
      error:
        "No encontramos una cita aprobada con ese teléfono. Solo los clientes que han sido atendidos pueden dejar reseñas.",
    };
  }

  // Asocia la reseña a la cita más reciente (informativo)
  const { data: apptId } = await supabase.rpc("find_appointment_for_review", {
    p_salon_id: salon.id,
    p_phone: phoneFull,
  });

  const { error } = await supabase.from("reviews").insert({
    salon_id: salon.id,
    appointment_id: apptId ?? null,
    client_name: data.client_name,
    client_phone: phoneFull,
    rating: data.rating,
    comment: data.comment || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/s/${data.salon_slug}`);
  revalidatePath(`/s/${data.salon_slug}/resena`);
  revalidatePath("/salon/resenas");
  return { success: "¡Gracias! Tu reseña ha sido publicada." };
}

export async function deleteReviewAction(
  reviewId: string,
): Promise<ReviewState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId);
  if (error) return { error: error.message };

  revalidatePath("/salon/resenas");
  return { success: "Reseña eliminada." };
}
