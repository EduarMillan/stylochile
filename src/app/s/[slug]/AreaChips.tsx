"use client";

import type { CSSProperties } from "react";

// Tripletes RGB para la animación area-pulse. Cada chip rota por uno
// distinto vía idx % length. Se pasan como --pulse-r/g/b (propiedades
// registradas con @property como <number>) para que var() funcione
// correctamente dentro de @keyframes.
const AREA_PULSE_COLORS: ReadonlyArray<[number, number, number]> = [
  [251, 113, 133], // rose-400
  [56, 189, 248], // sky-400
  [167, 139, 250], // violet-400
  [52, 211, 153], // emerald-400
  [251, 146, 60], // orange-400
  [244, 114, 182], // pink-400
];

// Duración del ciclo de la animación area-pulse (debe coincidir con el
// valor en globals.css). El stagger se calcula como cycle / N para que la
// secuencia sea perfecta sin importar cuántas áreas haya.
const AREA_PULSE_CYCLE_MS = 6000;

// Evento custom que ServicesTabs escucha para activar la pestaña de un
// área específica. Lo usamos para conectar los chips del hero con los
// tabs de la carta de servicios sin acoplar los dos componentes.
export const AREA_SELECT_EVENT = "salon:area-select";

export function AreaChips({
  areas,
}: {
  areas: Array<{ id: string; name: string }>;
}) {
  function handleClick(areaId: string) {
    window.dispatchEvent(
      new CustomEvent<string>(AREA_SELECT_EVENT, { detail: areaId }),
    );
    document
      .getElementById("servicios")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <ul className="mt-6 flex flex-wrap gap-2">
      {areas.map((a, idx) => {
        const [r, g, b] = AREA_PULSE_COLORS[idx % AREA_PULSE_COLORS.length];
        const stagger = AREA_PULSE_CYCLE_MS / areas.length;
        return (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => handleClick(a.id)}
              aria-label={`Ver servicios de ${a.name}`}
              className="area-pulse cursor-pointer rounded-full border bg-background/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-primary backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
              style={
                {
                  "--pulse-r": r,
                  "--pulse-g": g,
                  "--pulse-b": b,
                  animationDelay: `${idx * stagger}ms`,
                } as CSSProperties
              }
            >
              {a.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
