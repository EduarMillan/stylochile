"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type ForgotState = {
  error?: string;
  info?: string;
} | null;

export async function forgotPasswordAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Ingresa tu email." };

  // Construye la URL absoluta de callback usando el host del request,
  // así funciona tanto en localhost como en Vercel sin hardcodear.
  const headersList = await headers();
  const host = headersList.get("host");
  const proto =
    headersList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const origin =
    host && proto
      ? `${proto}://${host}`
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Por seguridad, no revelamos si el email existe o no. Mostramos el
  // mismo mensaje en éxito y cuando Supabase falla silenciosamente.
  if (error) {
    console.error("[forgotPasswordAction]", error.message);
  }

  return {
    info: "Si la cuenta existe, te enviamos un enlace para restablecer tu contraseña. Revisa tu email (también la carpeta de spam).",
  };
}
