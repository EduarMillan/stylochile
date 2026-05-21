"use client";

import { useEffect, useMemo, useState } from "react";
import type { SalonArea, Service } from "@/lib/types";
import { AREA_SELECT_EVENT } from "./AreaChips";

// Mismo mapeo de colores que los chips de áreas del hero — cada área
// conserva su color a lo largo de toda la página pública.
const AREA_COLORS: ReadonlyArray<[number, number, number]> = [
  [251, 113, 133], // rose-400
  [56, 189, 248], // sky-400
  [167, 139, 250], // violet-400
  [52, 211, 153], // emerald-400
  [251, 146, 60], // orange-400
  [244, 114, 182], // pink-400
];
const UNASSIGNED: [number, number, number] = [148, 163, 184]; // slate-400

type Group = {
  key: string;
  label: string;
  color: [number, number, number];
  description: string | null;
  services: Service[];
};

export function ServicesTabs({
  areas,
  services,
}: {
  areas: SalonArea[];
  services: Service[];
}) {
  // Agrupa servicios por área, conservando solo grupos con al menos uno.
  const groups: Group[] = useMemo(() => {
    const out: Group[] = [];
    areas.forEach((area, idx) => {
      const items = services.filter((s) => s.area_id === area.id);
      if (items.length === 0) return;
      out.push({
        key: area.id,
        label: area.name,
        color: AREA_COLORS[idx % AREA_COLORS.length],
        description: area.description,
        services: items,
      });
    });
    const orphans = services.filter((s) => s.area_id == null);
    if (orphans.length > 0) {
      out.push({
        key: "unassigned",
        label: "Otros servicios",
        color: UNASSIGNED,
        description: null,
        services: orphans,
      });
    }
    return out;
  }, [areas, services]);

  const [activeKey, setActiveKey] = useState<string>(groups[0]?.key ?? "");

  // Escucha clicks en los chips de áreas del hero. Si el área tiene
  // servicios (i.e. forma parte de los groups visibles aquí), la activa
  // como pestaña. Si no, lo ignora — el scroll a la sección lo dispara
  // el propio chip.
  useEffect(() => {
    function handle(e: Event) {
      const targetKey = (e as CustomEvent<string>).detail;
      if (groups.some((g) => g.key === targetKey)) {
        setActiveKey(targetKey);
      }
    }
    window.addEventListener(AREA_SELECT_EVENT, handle);
    return () => window.removeEventListener(AREA_SELECT_EVENT, handle);
  }, [groups]);

  const active = groups.find((g) => g.key === activeKey) ?? groups[0];
  if (!active) return null;

  return (
    <div className="mt-8">
      {/* Tabs — scroll horizontal en mobile */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
        {groups.map((g) => {
          const [r, gr, b] = g.color;
          const isActive = g.key === active.key;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setActiveKey(g.key)}
              aria-pressed={isActive}
              className="rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap"
              style={{
                borderColor: isActive
                  ? `rgb(${r}, ${gr}, ${b})`
                  : `rgba(${r}, ${gr}, ${b}, 0.35)`,
                backgroundColor: isActive
                  ? `rgba(${r}, ${gr}, ${b}, 0.18)`
                  : "transparent",
                color: isActive
                  ? `rgb(${r}, ${gr}, ${b})`
                  : "var(--muted-foreground)",
              }}
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: `rgb(${r}, ${gr}, ${b})` }}
                  aria-hidden
                />
                {g.label}
                <span
                  className="text-[10px] opacity-70"
                  aria-hidden
                >
                  ({g.services.length})
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Panel activo */}
      <ServicePanel group={active} />
    </div>
  );
}

function ServicePanel({ group }: { group: Group }) {
  const [r, g, b] = group.color;
  return (
    <div
      className="mt-6 rounded-2xl border bg-card/40 p-5 sm:p-6"
      style={{ borderColor: `rgba(${r}, ${g}, ${b}, 0.3)` }}
    >
      {group.description && (
        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {group.description}
        </p>
      )}
      <ul className="grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2">
        {group.services.map((s) => (
          <li
            key={s.id}
            className="flex items-baseline gap-3 border-b py-2.5 last:border-b-0 md:[&:nth-last-child(2)]:md:border-b-0"
            style={{ borderColor: `rgba(${r}, ${g}, ${b}, 0.12)` }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-3">
                <p className="font-serif text-base leading-tight">{s.name}</p>
                <span
                  aria-hidden
                  className="h-px flex-1 translate-y-1 border-b border-dotted"
                  style={{ borderColor: `rgba(${r}, ${g}, ${b}, 0.3)` }}
                />
                {s.price != null && (
                  <span
                    className="whitespace-nowrap font-medium"
                    style={{ color: `rgb(${r}, ${g}, ${b})` }}
                  >
                    {s.price.toLocaleString("es-CL")} {s.currency}
                  </span>
                )}
              </div>
              {(s.description || s.duration_minutes) && (
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                  {s.description && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {s.description}
                    </p>
                  )}
                  {s.duration_minutes != null && (
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-70 whitespace-nowrap"
                      style={{ color: `rgb(${r}, ${g}, ${b})` }}
                    >
                      {s.duration_minutes} min
                    </p>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
