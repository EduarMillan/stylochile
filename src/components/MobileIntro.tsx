"use client";

import { useEffect, useState } from "react";
import { WomanLineDrawing } from "./WomanLineDrawing";

const MOBILE_BREAKPOINT = "(max-width: 1023px)";
const SEEN_KEY = "stylochile_intro_seen";

// Tiempos del flujo (ms desde el montaje):
//  - El último path empieza a dibujarse a ~3.6s (12*0.25 + 21*0.06)
//  - Cada path tarda 1.4s en completarse → drawing termina a ~5s
//  - Esperamos 2s adicionales → fade arranca a 7s
//  - Fade dura 1s → intro removido del DOM a 8s
const DRAWING_DONE_MS = 5000;
const HOLD_MS = 2000;
const FADE_MS = 1000;
const FADE_AT = DRAWING_DONE_MS + HOLD_MS; // 7000
const HIDE_AT = FADE_AT + FADE_MS; // 8000

export function MobileIntro() {
  const [phase, setPhase] = useState<"showing" | "fading" | "hidden">(
    "hidden",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Solo en mobile (< lg breakpoint)
    if (!window.matchMedia(MOBILE_BREAKPOINT).matches) return;

    // Una vez por sesión — refresh muestra de nuevo, navegar dentro del SPA no
    if (window.sessionStorage.getItem(SEEN_KEY)) return;
    window.sessionStorage.setItem(SEEN_KEY, "1");

    setPhase("showing");

    const fadeTimer = window.setTimeout(() => setPhase("fading"), FADE_AT);
    const hideTimer = window.setTimeout(() => setPhase("hidden"), HIDE_AT);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  // Bloquea el scroll del body mientras el intro está visible
  useEffect(() => {
    if (phase === "showing" || phase === "fading") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background transition-opacity ease-in-out ${
        phase === "fading"
          ? "pointer-events-none opacity-0 duration-1000"
          : "opacity-100 duration-300"
      }`}
    >
      {/* Halos dorados sutiles de fondo */}
      <div
        aria-hidden
        className="absolute -top-32 -left-32 -z-10 size-96 rounded-full bg-primary/10 blur-3xl animate-orb-slow"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -right-32 -z-10 size-96 rounded-full bg-primary/8 blur-3xl animate-orb-slower"
      />

      {/* Wordmark arriba */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <p className="font-serif text-3xl tracking-tight text-gold-gradient">
          STYLOCHILE
        </p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Salones de belleza · Chile
        </p>
      </div>

      {/* Mujer dibujándose en el centro */}
      <WomanLineDrawing className="max-h-[68vh] w-auto -scale-x-100" />

      {/* Tagline inferior — aparece cuando el dibujo está casi completo */}
      <div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center opacity-0"
        style={{
          animation: "fade-in-soft 800ms ease-out 4500ms forwards",
        }}
      >
        <p className="font-serif text-base italic text-foreground/80">
          Define tu legado
        </p>
      </div>
    </div>
  );
}
