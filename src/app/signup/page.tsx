import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader variant="solid" current="signup" />

      <main className="flex flex-1 items-center justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Para dueños de salón
          </p>
          <h1 className="mt-2 mb-2 font-serif text-3xl">Crear cuenta</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Registra tu salón y empieza a aceptar reservas en minutos.
          </p>

          <SignupForm />

          <p className="mt-8 text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
