import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = {
  title: "Establecer nueva contraseña",
};

export default async function ResetPasswordPage() {
  // Acceso solo con sesión activa (debe llegar desde /auth/callback con
  // type=recovery). Sin sesión, no hay nada que actualizar.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader variant="solid" />

      <main className="flex flex-1 items-center justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Casi listo
          </p>
          <h1 className="mt-2 mb-2 font-serif text-3xl">
            Establecer nueva contraseña
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Elige una contraseña que recuerdes. Al guardarla iniciarás
            sesión automáticamente.
          </p>

          <ResetPasswordForm />
        </div>
      </main>
    </div>
  );
}
