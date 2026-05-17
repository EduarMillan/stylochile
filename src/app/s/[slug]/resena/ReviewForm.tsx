"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { submitReviewAction, type ReviewState } from "./actions";

export function ReviewForm({
  salonSlug,
  salonName,
}: {
  salonSlug: string;
  salonName: string;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [state, action, pending] = useActionState<ReviewState, FormData>(
    submitReviewAction,
    null,
  );

  useEffect(() => {
    if (state?.success) toast.success(state.success);
    if (state?.error) toast.error(state.error);
  }, [state]);

  if (state?.success) {
    return (
      <div className="flex flex-col items-start gap-6 rounded-3xl border-2 border-primary/40 bg-card p-10 shadow-glam">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Reseña enviada
        </p>
        <h2 className="font-serif text-3xl text-gold-gradient">¡Gracias!</h2>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
          Tu reseña ya está publicada en la vitrina de {salonName}. Tu opinión
          ayuda a otros clientes a elegir.
        </p>
        <Link
          href={`/s/${salonSlug}`}
          className={buttonVariants({
            variant: "outline",
            className: "rounded-full uppercase tracking-wider",
          })}
        >
          Volver al salón
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-7">
      <input type="hidden" name="salon_slug" value={salonSlug} />
      <input type="hidden" name="rating" value={rating} />

      {/* Estrellas */}
      <div className="flex flex-col gap-3">
        <Label className="text-xs uppercase tracking-[0.15em]">
          Tu calificación
        </Label>
        <div
          className="flex items-center gap-2"
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hovered || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                aria-label={`${n} estrellas`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                className="text-4xl transition-transform hover:scale-110"
              >
                <span
                  className={
                    active
                      ? "text-gold-gradient"
                      : "text-muted-foreground/40"
                  }
                >
                  ★
                </span>
              </button>
            );
          })}
          {rating > 0 && (
            <span className="ml-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
              {["Mala", "Regular", "Buena", "Muy buena", "Excelente"][rating - 1]}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="rev-name"
            className="text-xs uppercase tracking-[0.15em]"
          >
            Tu nombre
          </Label>
          <Input
            id="rev-name"
            name="client_name"
            required
            autoComplete="name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="rev-phone"
            className="text-xs uppercase tracking-[0.15em]"
          >
            Teléfono usado en tu cita
          </Label>
          <Input
            id="rev-phone"
            name="client_phone"
            required
            type="tel"
            autoComplete="tel"
            placeholder="+56 9 1234 5678"
          />
          <p className="text-xs text-muted-foreground">
            Solo verificamos que tuviste una cita en este salón. No mostramos
            tu teléfono.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="rev-comment"
          className="text-xs uppercase tracking-[0.15em]"
        >
          Comentario (opcional)
        </Label>
        <Textarea
          id="rev-comment"
          name="comment"
          rows={5}
          maxLength={1000}
          placeholder="Cuenta cómo fue tu experiencia."
        />
      </div>

      {state?.error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={pending || rating === 0}
          className="rounded-full uppercase tracking-wider"
        >
          {pending ? "Enviando…" : "Publicar reseña"}
        </Button>
        <Link
          href={`/s/${salonSlug}`}
          className={buttonVariants({
            variant: "ghost",
            size: "lg",
            className: "rounded-full uppercase tracking-wider",
          })}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
