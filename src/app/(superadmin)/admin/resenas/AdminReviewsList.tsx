"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminDeleteReviewAction } from "./actions";

export type AdminReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string;
  client_phone: string;
  created_at: string;
  salon_id: string;
  salon_name: string | null;
  salon_slug: string | null;
};

export function AdminReviewsList({ reviews }: { reviews: AdminReviewRow[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no hay reseñas en la plataforma.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((r) => (
        <ReviewRow key={r.id} review={r} />
      ))}
    </ul>
  );
}

function ReviewRow({ review }: { review: AdminReviewRow }) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (
      !confirm(
        `¿Eliminar la reseña de "${review.client_name}" para "${review.salon_name ?? "(sin salón)"}"?\n\nSolo hazlo si es spam o lenguaje inapropiado.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await adminDeleteReviewAction(review.id);
      if (res?.error) toast.error(res.error);
      if (res?.success) toast.success(res.success);
    });
  }

  return (
    <li className="card-tone-deep grid grid-cols-1 gap-4 p-6 md:grid-cols-[1fr_auto] md:items-start">
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
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
              Salón:
            </span>{" "}
            {review.salon_slug ? (
              <Link
                href={`/s/${review.salon_slug}`}
                target="_blank"
                className="hover:text-primary"
              >
                {review.salon_name ?? "(sin nombre)"} ↗
              </Link>
            ) : (
              <span>{review.salon_name ?? "(eliminado)"}</span>
            )}
          </span>
          <span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
              Fecha:
            </span>{" "}
            {new Date(review.created_at).toLocaleDateString("es-CL", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {review.comment && (
          <p className="mt-3 text-base leading-relaxed">“{review.comment}”</p>
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={remove}
        className="text-destructive hover:text-destructive md:self-start"
      >
        Eliminar
      </Button>
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
