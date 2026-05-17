import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service role key — BYPASSEA RLS.
 *
 * **Solo se debe usar desde server actions/route handlers después de
 * verificar que el usuario es super-admin** (ej. via ensureSuperAdmin()).
 * Nunca exponer este cliente al browser ni pasarlo a un componente cliente.
 *
 * Necesita la variable de entorno SUPABASE_SERVICE_ROLE_KEY (NO debe
 * tener el prefijo NEXT_PUBLIC_ porque eso la expondría al cliente).
 *
 * La service role key está en el dashboard de Supabase:
 *   Project Settings → API → service_role key
 *
 * Útil para operaciones administrativas donde RLS no debe aplicar:
 * actualizar platform_settings, marcar pagos, suspender/restaurar
 * salones, etc.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin client requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.",
    );
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
