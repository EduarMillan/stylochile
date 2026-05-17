import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader variant="solid" />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="card-glam mx-auto max-w-xl p-10 text-center sm:p-14">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Error 404
          </p>
          <h1 className="mt-4 font-serif text-5xl tracking-tight text-gold-gradient sm:text-6xl">
            Página no encontrada
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            La ruta que buscas no existe o el salón fue retirado. Quizás
            quieras volver al directorio o a la página principal.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/salones"
              className="bg-gold-gradient cta-pulse rounded-full px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:scale-105 hover:brightness-110"
            >
              Explorar salones
            </Link>
            <Link
              href="/"
              className="rounded-full border border-primary/60 bg-background/30 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-primary backdrop-blur-md transition-all hover:scale-105 hover:border-primary hover:bg-primary/10"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 px-4 py-6 text-center text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground sm:px-8 lg:px-16 lg:py-8">
        © 2026 StyloChile
      </footer>
    </div>
  );
}
