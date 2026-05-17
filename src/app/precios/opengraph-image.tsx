import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

// OG image para /precios — incluye el precio y trial actuales leídos
// de platform_settings, así cualquier cambio en el panel admin se
// refleja al regenerarse la imagen (no cache estática).

export const alt = "Plan StyloCuba · Salones de belleza en Cuba";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgPrecios() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("trial_days, monthly_price, currency")
    .eq("id", true)
    .maybeSingle();

  const trialDays = data?.trial_days ?? 90;
  const monthlyPrice = Number(data?.monthly_price ?? 1000);
  const currency = data?.currency ?? "CUP";

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
            "radial-gradient(circle at 30% 20%, rgba(212, 175, 55, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 90%, rgba(212, 175, 55, 0.12) 0%, transparent 50%)",
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
            STYLOCUBA
          </div>
        </div>

        <div
          style={{
            fontSize: 24,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#d4af37",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          Plan mensual · sin contratos
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 180,
              fontWeight: 400,
              letterSpacing: "-0.04em",
              background:
                "linear-gradient(135deg, #ffe6a0 0%, #d4af37 50%, #a8842a 100%)",
              backgroundClip: "text",
              color: "transparent",
              lineHeight: 1,
            }}
          >
            {monthlyPrice.toLocaleString("es-CU")}
          </span>
          <span
            style={{
              fontSize: 44,
              color: "#c2b18a",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 400,
            }}>
            {currency}/mes
          </span>
        </div>

        <div
          style={{
            fontSize: 36,
            color: "#f5ebd0",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {trialDays} días de prueba gratis.
        </div>

        <div
          style={{
            marginTop: 16,
            fontSize: 22,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#a8a08a",
            letterSpacing: "0.05em",
          }}
        >
          Sin tarjeta · sin permanencia
        </div>
      </div>
    ),
    size,
  );
}
