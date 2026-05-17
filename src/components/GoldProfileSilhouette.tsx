/**
 * Silueta de perfil femenino animada con trazo dorado.
 *
 * Cada path tiene `pathLength="100"` para normalizar la longitud, lo que
 * permite controlar el dibujo con stroke-dashoffset (definido en globals.css
 * vía la clase `.draw-line`). Los `animationDelay` escalonados crean el
 * efecto de dibujo secuencial: primero la cara, luego la cabeza, luego los
 * mechones de cabello, y al final los detalles.
 *
 * ViewBox 400x600. Perfil orientado a la izquierda (cara mirando hacia el
 * headline cuando la silueta vive a la derecha del hero).
 */
export function GoldProfileSilhouette({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id="gold-line" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde08a" />
          <stop offset="35%" stopColor="#f5d061" />
          <stop offset="65%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8a6914" />
        </linearGradient>
        <filter id="gold-glow">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g
        stroke="url(#gold-line)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#gold-glow)"
      >
        {/* 1. Perfil de la cara — frente, nariz, labios, mentón, cuello */}
        <path
          className="draw-line"
          pathLength="100"
          style={{ animationDelay: "0s" }}
          d="M 200 95
             C 178 105, 165 135, 162 178
             C 160 192, 152 208, 130 225
             C 148 234, 158 244, 160 252
             C 155 257, 154 263, 158 268
             C 163 273, 158 278, 159 284
             C 167 292, 178 303, 182 312
             C 200 326, 222 348, 225 380
             L 225 470"
        />

        {/* 2. Cráneo — top of head + back of head bajando hacia el cuello */}
        <path
          className="draw-line"
          pathLength="100"
          style={{ animationDelay: "0.4s" }}
          d="M 200 95
             C 248 68, 290 95, 300 168
             C 308 232, 298 290, 280 322"
        />

        {/* 3. Mechón corto cayendo sobre la frente */}
        <path
          className="draw-line"
          pathLength="100"
          style={{ animationDelay: "0.8s" }}
          d="M 200 95
             C 195 112, 198 130, 208 148"
        />

        {/* 4. Mechón sobre la coronilla — más sutil */}
        <path
          className="draw-line"
          pathLength="100"
          style={{ animationDelay: "1.1s" }}
          d="M 222 78
             C 268 105, 290 165, 290 235"
        />

        {/* 5. Mechón intermedio — empieza atrás de la cabeza */}
        <path
          className="draw-line"
          pathLength="100"
          style={{ animationDelay: "1.4s" }}
          d="M 285 195
             C 322 268, 338 345, 332 425
             C 327 478, 315 512, 298 534"
        />

        {/* 6. Mechón largo — el más dramático, define la cascada */}
        <path
          className="draw-line"
          pathLength="100"
          style={{ animationDelay: "1.7s" }}
          d="M 292 258
             C 338 328, 360 408, 362 478
             C 360 522, 345 552, 322 570"
        />

        {/* 7. Mechón en la nuca / cuello */}
        <path
          className="draw-line"
          pathLength="100"
          style={{ animationDelay: "2.0s" }}
          d="M 268 322
             C 285 358, 290 395, 282 428"
        />

        {/* 8. Ceja */}
        <path
          className="draw-line"
          pathLength="100"
          strokeWidth="1.2"
          style={{ animationDelay: "2.3s" }}
          d="M 155 168 L 178 164"
        />

        {/* 9. Pestaña / línea del ojo (sutil) */}
        <path
          className="draw-line"
          pathLength="100"
          strokeWidth="1.1"
          style={{ animationDelay: "2.45s" }}
          d="M 153 184 C 162 181, 174 183, 184 181"
        />

        {/* 10. Línea de los labios */}
        <path
          className="draw-line"
          pathLength="100"
          strokeWidth="1.2"
          style={{ animationDelay: "2.6s" }}
          d="M 152 268 L 172 268"
        />
      </g>
    </svg>
  );
}
