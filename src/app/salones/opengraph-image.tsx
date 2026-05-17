import { ImageResponse } from "next/og";

// OG image para /salones — directorio público.

export const alt = "Directorio de salones de belleza · StyloChile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgSalones() {
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
            "radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.20) 0%, transparent 55%), radial-gradient(circle at 50% 110%, rgba(212, 175, 55, 0.10) 0%, transparent 50%)",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
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
            gap: 16,
            position: "absolute",
            top: 64,
            left: 88,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: "0.05em",
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
            fontSize: 28,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#d4af37",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          Directorio
        </div>

        <div
          style={{
            fontSize: 96,
            fontWeight: 400,
            letterSpacing: "-0.02em",
            background:
              "linear-gradient(135deg, #ffe6a0 0%, #d4af37 50%, #a8842a 100%)",
            backgroundClip: "text",
            color: "transparent",
            textAlign: "center",
            lineHeight: 1,
          }}
        >
          Salones de Chile
        </div>

        <div
          style={{
            marginTop: 36,
            fontSize: 26,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#c2b18a",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          Los mejores salones de belleza del país. Reserva en segundos.
        </div>
      </div>
    ),
    size,
  );
}
