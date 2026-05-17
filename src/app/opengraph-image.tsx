import { ImageResponse } from "next/og";

// OG image para la home (/) — se sirve en `/opengraph-image`.
// Diseño: fondo warm-dark con vignette dorada + wordmark + tagline.
//
// Next.js renderiza esto a PNG 1200×630 en build via @vercel/og.
// Si el JSX dentro de ImageResponse falla, Vercel logs muestran el
// error y la página fallback usa el icon como OG image.

export const alt = "StyloChile · Salones de belleza en Chile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgHome() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0c0905",
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(212, 175, 55, 0.18) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(212, 175, 55, 0.12) 0%, transparent 50%)",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Border interior dorado sutil */}
        <div
          style={{
            position: "absolute",
            top: 32,
            left: 32,
            right: 32,
            bottom: 32,
            border: "1px solid rgba(212, 175, 55, 0.25)",
            borderRadius: 24,
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              backgroundColor: "#1a1100",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 64,
              fontStyle: "italic",
              fontWeight: 500,
              background:
                "linear-gradient(135deg, #ffe6a0 0%, #d4af37 50%, #8a6914 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            S
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              background:
                "linear-gradient(135deg, #ffe6a0 0%, #d4af37 50%, #a8842a 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            STYLOCHILE
          </div>
        </div>

        <div
          style={{
            fontSize: 80,
            fontWeight: 400,
            color: "#f5ebd0",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: 1000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span>Domina tu salón.</span>
          <span
            style={{
              background:
                "linear-gradient(135deg, #ffe6a0 0%, #d4af37 50%, #a8842a 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Define tu legado.
          </span>
        </div>

        <div
          style={{
            marginTop: 36,
            fontSize: 22,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#c2b18a",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Salones de belleza · Chile
        </div>
      </div>
    ),
    size,
  );
}
