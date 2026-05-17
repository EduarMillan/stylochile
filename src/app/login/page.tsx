import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader variant="solid" current="login" />

      <main className="flex flex-1 items-center justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Panel de dueños de salón
          </p>
          <h1 className="mt-2 mb-8 font-serif text-3xl">Iniciar sesión</h1>

          <LoginForm next={next} />

          <p className="mt-8 text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
