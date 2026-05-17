"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteReviewAction } from "@/app/s/[slug]/resena/actions";
import type { Review } from "@/lib/types";

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no tienes reseñas. Cuando un cliente atendido las deje, aparecerán
        aquí.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-5">
      {reviews.map((r) => (
        <ReviewRow key={r.id} review={r} />
      ))}
    </ul>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (
      !confirm(
        `¿Eliminar la reseña de "${review.client_name}"? Esto solo se hace si es spam o lenguaje inapropiado.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteReviewAction(review.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  return (
    <li className="rounded-3xl border border-border/60 bg-card p-6 shadow-glam">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Stars value={review.rating} />
            <span className="text-sm">
              <span className="font-serif text-base text-foreground">
                {review.client_name}
              </span>
              <span className="ml-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {review.client_phone}
              </span>
            </span>
          </div>
          <time className="mt-1 block text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {new Date(review.created_at).toLocaleString("es-CU", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
          {review.comment && (
            <p className="mt-4 text-base leading-relaxed">
              “{review.comment}”
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={remove}
          disabled={pending}
        >
          Eliminar
        </Button>
      </div>
    </li>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5 text-xl leading-none">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={
            value >= n ? "text-gold-gradient" : "text-muted-foreground/30"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}
