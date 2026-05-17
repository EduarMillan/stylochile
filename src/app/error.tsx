"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundary global. Captura excepciones en cualquier ruta y
 * muestra un fallback con CTA para reintentar o volver al inicio.
 *
 * Es Client Component (obligatorio para error.tsx) y no puede usar
 * server-only imports.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log al server-side de Vercel para visibility. En producción los
    // errores aparecen en el dashboard de Vercel → Logs.
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5 lg:px-16">
        <Link
          href="/"
          className="font-serif text-2xl tracking-tight text-gold-gradient"
        >
          STYLOCUBA
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="card-glam mx-auto max-w-xl p-10 text-center sm:p-14">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-destructive">
            Algo salió mal
          </p>
          <h1 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
            Tuvimos un problema
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Encontramos un error inesperado al procesar tu solicitud. Puedes
            intentar de nuevo o volver al inicio. Si el problema persiste,
            contacta al administrador.
          </p>
          {error.digest && (
            <p className="mt-4 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/60">
              Ref: {error.digest}
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="bg-gold-gradient rounded-full px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:scale-105 hover:brightness-110"
            >
              Reintentar
            </button>
            <Link
              href="/"
              className="rounded-full border border-primary/60 bg-background/30 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-primary backdrop-blur-md transition-all hover:scale-105 hover:border-primary hover:bg-primary/10"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
