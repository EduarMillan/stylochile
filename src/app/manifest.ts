import type { MetadataRoute } from "next";

/**
 * Web App Manifest generado por Next.js. Permite que Chrome muestre
 * "Add to Home Screen" en móvil con icono y splash screen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StyloChile · Salones de belleza en Chile",
    short_name: "StyloChile",
    description:
      "Directorio y plataforma de gestión para salones de belleza en Chile.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0905",
    theme_color: "#d4af37",
    lang: "es-CL",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
