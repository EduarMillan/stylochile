import type { MetadataRoute } from "next";

/**
 * robots.txt generado dinámicamente por Next.js.
 *
 * Permite indexar las páginas públicas (home, directorio, fichas de
 * salón, registro/login) y bloquea todo el área privada (paneles de
 * dueño y super-admin) y flujos transaccionales (reservar/reseña) que
 * no aportan SEO.
 */
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://stylocuba.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/salones", "/s/", "/login", "/signup"],
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/salon/",
          "/s/*/reservar",
          "/s/*/resena",
          "/api/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
