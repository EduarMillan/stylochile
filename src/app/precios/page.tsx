import type { Metadata } from "next";
import Link from "next/link";
import {
  Calendar,
  Camera,
  Images,
  Package,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Precios y plan mensual",
  description:
    "Plan único de StyloChile: trial gratuito, luego mensualidad. Sin contratos, paga por transferencia. Todo lo que necesita tu salón en una sola plataforma.",
  alternates: { canonical: "/precios" },
  openGraph: {
    title: "Precios y plan mensual · StyloChile",
    description:
      "Plan único: trial gratuito y luego mensualidad. Todo lo que necesita tu salón.",
    url: "/precios",
  },
};

const FEATURES = [
  {
    icon: Star,
    title: "Vitrina pública del salón",
    desc: "Tu salón visible en el directorio público. URL propia tipo stylochile.com/s/tu-salon con logo, horarios, ubicación y áreas que ofreces.",
  },
  {
    icon: Calendar,
    title: "Agenda con aprobación",
    desc: "Recibe reservas online. Aprueba, rechaza o reasigna. Sin pisar otras citas — el sistema valida disponibilidad por área.",
  },
  {
    icon: Sparkles,
    title: "Carta de servicios por área",
    desc: "Organiza tu oferta en tabs por área (peluquería, manicure, estética, …). Precios, duración y descripción de cada servicio.",
  },
  {
    icon: Images,
    title: "Galería antes & después",
    desc: "Hasta 4 trabajos por área. Imágenes comprimidas automáticamente para carga rápida. La vitrina los muestra paginados.",
  },
  {
    icon: Camera,
    title: "Fotos de instalaciones",
    desc: "Comparte el local, el equipamiento y los espacios. Refuerza confianza antes de que el cliente reserve.",
  },
  {
    icon: Users,
    title: "Equipo con especialidades",
    desc: "Cada miembro con foto, rol, años de experiencia, especialidades en tags e Instagram opcional.",
  },
  {
    icon: Package,
    title: "Almacén e inventario",
    desc: "Lleva el stock de productos. Registra entradas y salidas, ve historial y alertas de bajo stock.",
  },
];

const FAQ = [
  {
    q: "¿Cómo es el pago?",
    a: "Pagas por transferencia bancaria (CLP) o lo que coordines con el admin. Cada mes te recordamos por el banner del dashboard que el pago se acerca. Un WhatsApp directo te conecta con nosotros para coordinar.",
  },
  {
    q: "¿Qué pasa si no pago un mes?",
    a: "Tienes unos días de gracia después de que vence tu período (configurables). Si pasa la gracia, tu salón se suspende automáticamente — deja de aparecer en la vitrina pública. Al pagar, lo restauramos y queda como nuevo. No pierdes nada de tu información.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. No hay contrato. Si no pagas el siguiente mes, tu salón se suspende. Si después decides volver, lo reactivamos.",
  },
  {
    q: "¿Mis clientes ven mi número directamente?",
    a: "Sí. Tu WhatsApp aparece en tu vitrina pública para que los clientes te contacten directo. Las reservas pasan por la plataforma para que tengas agenda centralizada.",
  },
  {
    q: "¿Las fotos cuentan contra mi cuota de almacenamiento?",
    a: "Comprimimos cada imagen al subirla (~10× más pequeña) y limitamos cuántas puedes tener por sección. No te debes preocupar por costos extra.",
  },
];

function formatPrice(amount: number, currency: string) {
  return `${amount.toLocaleString("es-CL")} ${currency}`;
}

export default async function PreciosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("trial_days, monthly_price, currency, grace_period_days")
    .eq("id", true)
    .maybeSingle();

  const trialDays = data?.trial_days ?? 90;
  const monthlyPrice = Number(data?.monthly_price ?? 9990);
  const currency = data?.currency ?? "CLP";
  const graceDays = data?.grace_period_days ?? 5;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader variant="solid" current="precios" />

      <main className="flex flex-1 flex-col gap-16 px-4 py-12 sm:gap-20 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
        {/* Hero */}
        <section className="mx-auto w-full max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Plan mensual · Sin contratos
          </p>
          <h1 className="mt-4 font-serif text-5xl tracking-tight sm:text-6xl lg:text-7xl">
            Un plan, todo el salón.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Empieza con <strong className="text-primary">{trialDays} días gratis</strong>.
            Luego una mensualidad pequeña por transferencia. Sin sorpresas, sin
            permanencia.
          </p>

          {/* Price card */}
          <div className="card-glam mx-auto mt-12 max-w-md p-8 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Plan StyloChile
            </p>
            <div className="mt-4 flex items-baseline justify-center gap-2">
              <span className="font-serif text-6xl tracking-tight text-gold-gradient sm:text-7xl">
                {monthlyPrice.toLocaleString("es-CL")}
              </span>
              <span className="font-serif text-xl text-muted-foreground">
                {currency}/mes
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {trialDays} días de prueba gratis al crear tu salón.
            </p>
            <Link
              href="/signup"
              className="bg-gold-gradient cta-pulse mt-8 inline-flex items-center justify-center rounded-full px-10 py-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:scale-105 hover:brightness-110"
            >
              Empezar gratis
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Qué incluye
          </p>
          <h2 className="mt-3 text-center font-serif text-4xl tracking-tight sm:text-5xl">
            Todo lo que tu salón necesita
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <article
                key={title}
                className="card-glam flex flex-col gap-3 p-6"
              >
                <Icon className="size-6 text-primary" />
                <h3 className="font-serif text-xl leading-tight">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto w-full max-w-3xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Preguntas frecuentes
          </p>
          <h2 className="mt-3 text-center font-serif text-4xl tracking-tight sm:text-5xl">
            ¿Dudas?
          </h2>

          <div className="mt-10 flex flex-col gap-3">
            {FAQ.map(({ q, a }) => (
              <details
                key={q}
                className="card-glam group p-6 transition-colors"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-serif text-lg leading-tight">
                  {q}
                  <span className="shrink-0 font-sans text-2xl text-primary transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {a}
                </p>
              </details>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Nota: cuando un plan vence, tienes {graceDays} días de gracia
            antes de que el salón se suspenda. Al pagar, lo restauramos sin
            perder información.
          </p>
        </section>

        {/* CTA final */}
        <section className="mx-auto w-full max-w-3xl text-center">
          <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
            Empieza hoy.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Crea tu salón en menos de 5 minutos. {trialDays} días para
            probarlo todo. Sin tarjeta, sin compromiso.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="bg-gold-gradient cta-pulse rounded-full px-10 py-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:scale-105 hover:brightness-110"
            >
              Crear mi salón
            </Link>
            <Link
              href="/salones"
              className="rounded-full border border-primary/60 bg-background/30 px-10 py-4 text-sm font-semibold uppercase tracking-wider text-primary backdrop-blur-md transition-all hover:scale-105 hover:border-primary hover:bg-primary/10"
            >
              Ver salones publicados
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 px-4 py-6 text-center text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground sm:px-8 lg:px-16 lg:py-8">
        © 2026 StyloChile
      </footer>
    </div>
  );
}
