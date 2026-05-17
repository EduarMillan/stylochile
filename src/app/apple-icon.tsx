import { ImageResponse } from "next/og";

// Apple Touch Icon — Next.js lo renderiza a PNG en build via @vercel/og.
// SVG no es válido para apple-icon (iOS solo soporta PNG/JPG), así que
// generamos uno programáticamente.

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 22% 22%, #2a1c08 0%, #0c0905 100%)",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 500,
            fontStyle: "italic",
            fontFamily: "Georgia, serif",
            background:
              "linear-gradient(135deg, #ffe6a0 0%, #d4af37 50%, #8a6914 100%)",
            backgroundClip: "text",
            color: "transparent",
            lineHeight: 1,
          }}
        >
          S
        </div>
      </div>
    ),
    size,
  );
}
