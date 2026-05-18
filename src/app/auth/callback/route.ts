import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback que cierra el flujo PKCE de Supabase (signup confirm,
 * password recovery, magic link). El email lleva al usuario aquí con
 * un `code` que intercambiamos por sesión, luego redirigimos al
 * destino indicado en `next`. Si no hay code o falla el exchange,
 * volvemos al login con un mensaje genérico.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  // Solo permitimos paths internos como `next` para evitar open-redirect.
  const next = nextParam.startsWith("/") ? nextParam : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=invalid_link`);
}
