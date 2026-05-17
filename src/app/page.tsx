import Image from "next/image";
import Link from "next/link";
import { WomanLineDrawing } from "@/components/WomanLineDrawing";
import { MobileIntro } from "@/components/MobileIntro";
import { PublicHeader } from "@/components/PublicHeader";

export default function Home() {
  return (
    <main className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden">
      <MobileIntro />
      {/* Imagen de fondo */}
      <div className="absolute inset-0 -z-30">
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Overlay degradado vertical para legibilidad */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,9,5,0.45) 0%, rgba(12,9,5,0.78) 60%, rgba(12,9,5,0.95) 100%)",
        }}
      />

      {/* Vignette dorado en esquinas */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(212,175,55,0.12), transparent 55%), radial-gradient(ellipse at bottom left, rgba(212,175,55,0.08), transparent 60%)",
        }}
      />

      {/* Orbes dorados flotantes — animación sutil */}
      <div
        aria-hidden
        className="animate-orb-slow absolute -top-40 -left-40 -z-10 size-[28rem] rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-orb-slower absolute -bottom-32 right-0 -z-10 size-[32rem] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-orb-slow absolute top-1/3 right-1/4 -z-10 size-64 rounded-full bg-primary/8 blur-3xl"
        style={{ animationDelay: "2s" }}
      />

      <PublicHeader />


      {/* Hero con todo el contenido */}
      <section className="relative flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-16">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
        <div className="max-w-2xl">
          <p
            className="text-xs font-bold uppercase tracking-[0.25em] text-primary drop-shadow animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150"
          >
            Plataforma de salones de belleza · Cuba
          </p>

          <h1
            className="mt-6 font-serif text-5xl font-normal leading-[1.02] tracking-tight drop-shadow-lg sm:text-6xl lg:text-7xl xl:text-8xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
          >
            Domina tu salón.
            <br />
            <span className="text-gold-shimmer">Define tu legado.</span>
          </h1>

          <p
            className="mt-8 max-w-xl text-base leading-relaxed text-foreground/90 drop-shadow sm:text-lg animate-in fade-in duration-700 delay-300"
          >
            Vitrina pública, agenda con aprobación, historial fotográfico de
            clientes y gestión de almacén. Diseñado para los mejores salones de
            Cuba.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-[400ms] sm:gap-4">
            <Link
              href="/signup"
              className="bg-gold-gradient cta-pulse rounded-full px-8 py-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:scale-105 hover:brightness-110 sm:px-10"
            >
              Crear mi salón
            </Link>
            <Link
              href="/salones"
              className="rounded-full border border-primary/60 bg-background/30 px-8 py-4 text-sm font-semibold uppercase tracking-wider text-primary backdrop-blur-md transition-all hover:scale-105 hover:border-primary hover:bg-primary/10 sm:px-10"
            >
              Explorar salones
            </Link>
          </div>

        </div>

        {/* Line-drawing dorado de la mujer — animación de trazo. Volteado
            horizontalmente para que mire hacia el headline. */}
        <div className="relative hidden self-stretch lg:flex lg:items-center lg:justify-center">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 m-auto size-[80%] rounded-full bg-gold-gradient-soft opacity-50 blur-3xl animate-orb-slow"
          />
          <WomanLineDrawing className="h-[min(72vh,640px)] w-auto -scale-x-100" />
        </div>
        </div>

        {/* Feature chips compactos con auto-cycle (full-width debajo del grid) */}
        <div className="mt-12 grid max-w-4xl grid-cols-1 gap-3 sm:mt-16 sm:grid-cols-3 sm:gap-4">
          <FeatureChip
            kicker="Vitrina"
            title="Antes & después"
            entranceDelay={500}
            pulseDelay={1500}
          />
          <FeatureChip
            kicker="Agenda"
            title="Reservas con aprobación"
            entranceDelay={650}
            pulseDelay={3500}
          />
          <FeatureChip
            kicker="Almacén"
            title="Inventario en vivo"
            entranceDelay={800}
            pulseDelay={5500}
          />
        </div>
      </section>

      <footer className="relative border-t border-border/40 px-4 py-5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground sm:px-8 sm:text-left lg:px-16">
        © 2026 StyloCuba · Todos los derechos reservados
      </footer>
    </main>
  );
}

function FeatureChip({
  kicker,
  title,
  entranceDelay,
  pulseDelay,
}: {
  kicker: string;
  title: string;
  entranceDelay: number;
  pulseDelay: number;
}) {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 duration-700"
      style={{
        animationDelay: `${entranceDelay}ms`,
        animationFillMode: "both",
      }}
    >
      <div
        className="auto-feature-pulse relative flex items-center gap-3.5 overflow-hidden rounded-2xl border p-4 backdrop-blur-md"
        style={{ animationDelay: `${pulseDelay}ms` }}
      >
        <div
          className="auto-feature-halo absolute -right-6 -top-6 size-20 rounded-full bg-gold-gradient-soft blur-2xl"
          style={{ animationDelay: `${pulseDelay}ms` }}
        />
        <span className="bg-gold-gradient relative flex size-10 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-md shadow-primary/30">
          <span className="text-base font-bold">✦</span>
        </span>
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            {kicker}
          </p>
          <p className="mt-0.5 font-serif text-base leading-tight text-foreground">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}
