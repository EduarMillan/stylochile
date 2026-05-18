import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = {
  title: "Recuperar contraseña",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader variant="solid" />

      <main className="flex flex-1 items-center justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Recuperar acceso
          </p>
          <h1 className="mt-2 mb-2 font-serif text-3xl">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Escribe el email con el que te registraste y te enviamos un
            enlace para crear una nueva.
          </p>

          <ForgotPasswordForm />

          <p className="mt-8 text-sm text-muted-foreground">
            ¿Te acordaste?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
