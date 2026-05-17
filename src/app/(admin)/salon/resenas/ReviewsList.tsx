"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
    <li className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-5 shadow-glam sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Stars value={review.rating} />
        <span className="font-serif text-base text-foreground">
          {review.client_name}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
        <span className="break-all">{review.client_phone}</span>
        <span aria-hidden className="text-muted-foreground/50">
          ·
        </span>
        <time>
          {new Date(review.created_at).toLocaleString("es-CL", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
      {review.comment && (
        <p className="text-base leading-relaxed">“{review.comment}”</p>
      )}
      <div className="mt-1 flex justify-end border-t border-border/60 pt-3">
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          aria-label={`Eliminar reseña de ${review.client_name}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-destructive transition-colors hover:border-destructive/60 hover:bg-destructive/10 disabled:opacity-50 disabled:hover:border-destructive/30 disabled:hover:bg-destructive/5"
        >
          <Trash2 className="size-3.5" />
          {pending ? "Eliminando…" : "Eliminar"}
        </button>
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
