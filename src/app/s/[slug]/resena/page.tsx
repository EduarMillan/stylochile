import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/PublicHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ReviewForm } from "./ReviewForm";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: salon } = await supabase
    .from("salons")
    .select("name, slug, is_published")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!salon) notFound();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader variant="solid" />

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-12 lg:px-16 lg:py-16">
        <Breadcrumbs
          items={[
            { label: "Salones", href: "/salones" },
            { label: salon.name, href: `/s/${salon.slug}` },
            { label: "Reseña" },
          ]}
          className="mb-6"
        />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Deja tu reseña
        </p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-gold-gradient sm:text-4xl lg:text-5xl">
          ¿Cómo fue tu visita?
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          Tu opinión sobre <strong className="text-foreground">{salon.name}</strong>{" "}
          ayuda a otros a elegir bien. Solo los clientes con cita aprobada
          pueden dejar una reseña.
        </p>

        <div className="mt-12">
          <ReviewForm salonSlug={salon.slug} salonName={salon.name} />
        </div>
      </section>
    </div>
  );
}
