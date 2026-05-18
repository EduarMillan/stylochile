"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildChilePhone, validateChilePhone } from "@/lib/phone";

export type AuthState = { error?: string; info?: string } | null;

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const rawPhone = formData.get("phone") as string | null;

  if (!email || !password || !fullName) {
    return { error: "Todos los campos son requeridos." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const phoneCheck = validateChilePhone(rawPhone);
  if (!phoneCheck.ok) return { error: phoneCheck.error };
  const phone = buildChilePhone(rawPhone);

  const supabase = await createClient();

  // Pre-chequea unicidad del teléfono vía RPC security definer (anon
  // no puede leer profiles directamente). Sin esto, el trigger de
  // signup fallaría con "Database error saving new user" — error
  // genérico y confuso para el dueño.
  const { data: taken } = await supabase.rpc("phone_taken", {
    p_phone: phone,
  });
  if (taken === true) {
    return { error: "Ese teléfono ya está registrado." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } },
  });

  if (error) {
    // Email duplicado: Supabase devuelve "User already registered"
    // (mensaje en inglés). Lo traducimos.
    if (/already registered|already exists/i.test(error.message)) {
      return { error: "Ya existe una cuenta con ese email." };
    }
    return { error: error.message };
  }

  // Si el proyecto Supabase requiere confirmación por email, no hay sesión activa.
  if (!data.session) {
    return {
      info: "Cuenta creada. Revisa tu email para confirmar y luego inicia sesión.",
    };
  }

  redirect("/dashboard");
}
