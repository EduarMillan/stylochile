/**
 * Divisor decorativo entre secciones: SVG con líneas tipo "circuito" donde un
 * segmento dorado brillante viaja por el camino. Inspirado en los dividers de
 * nextjs.org. Animación CSS pura (stroke-dasharray + stroke-dashoffset).
 *
 * Usar como separador entre dos secciones del salón público. Es decorativo,
 * `aria-hidden`. No incluir más de 2-3 por página o pierde sutileza.
 */
type Props = {
  className?: string;
};

const PATH_A = "M 0 40 L 380 40 L 420 20 L 760 20 L 800 50 L 1200 50";
const PATH_B = "M 1200 60 L 880 60 L 840 35 L 360 35 L 320 65 L 0 65";

export function SectionDivider({ className = "" }: Props) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none relative w-full ${className}`}
    >
      <svg
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        className="block h-16 w-full sm:h-20"
      >
        {/* Pistas base — apenas perceptibles */}
        <path
          d={PATH_A}
          fill="none"
          stroke="#d4af37"
          strokeWidth="0.75"
          strokeOpacity="0.12"
        />
        <path
          d={PATH_B}
          fill="none"
          stroke="#d4af37"
          strokeWidth="0.75"
          strokeOpacity="0.12"
        />

        {/* Nodos en los vértices */}
        {[
          [380, 40],
          [420, 20],
          [760, 20],
          [800, 50],
          [880, 60],
          [840, 35],
          [360, 35],
          [320, 65],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="1"
            fill="#d4af37"
            fillOpacity="0.25"
          />
        ))}

        {/* Segmentos viajeros: tenues, con glow suave */}
        <path
          d={PATH_A}
          fill="none"
          stroke="#e4c66f"
          strokeWidth="1.25"
          strokeOpacity="0.75"
          strokeLinecap="round"
          className="animate-circuit-travel"
          style={{
            animationDuration: "12s",
            filter: "drop-shadow(0 0 2px rgba(228, 198, 111, 0.45))",
          }}
        />
        <path
          d={PATH_B}
          fill="none"
          stroke="#e4c66f"
          strokeWidth="1.25"
          strokeOpacity="0.75"
          strokeLinecap="round"
          className="animate-circuit-travel"
          style={{
            animationDuration: "14s",
            animationDelay: "-4s",
            filter: "drop-shadow(0 0 2px rgba(228, 198, 111, 0.45))",
          }}
        />
      </svg>
    </div>
  );
}
