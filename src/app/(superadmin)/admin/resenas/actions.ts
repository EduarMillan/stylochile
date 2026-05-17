"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SUPER_ADMIN_EMAIL = "eduarmillan00@gmail.com";

export type AdminReviewState = { error?: string; success?: string } | null;

export async function adminDeleteReviewAction(
  reviewId: string,
): Promise<AdminReviewState> {
  // Identifica al usuario con la sesión actual (anon key + cookies)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
    return { error: "No autorizado." };
  }

  // El delete corre con service role (bypassea RLS)
  const admin = createSupabaseAdminClient();
  const { data: deleted, error } = await admin
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .select("id");
  if (error) return { error: error.message };
  if (!deleted || deleted.length === 0) {
    return { error: "Reseña no encontrada." };
  }

  revalidatePath("/admin/resenas");
  return { success: "Reseña eliminada." };
}
