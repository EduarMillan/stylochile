import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

/**
 * Sitemap generado dinámicamente por Next.js.
 *
 * Incluye:
 *  - Páginas estáticas públicas (home, directorio, registro/login).
 *  - Una entrada por cada salón publicado y no suspendido, leído de la
 *    DB. La `lastModified` viene de `salons.updated_at` para que Google
 *    re-crawlee cuando un dueño actualiza su salón.
 */
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://stylochile.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/salones`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Fichas individuales de salón. Si la DB no responde por algún motivo
  // (config faltante en preview, etc.), devuelve solo las estáticas en
  // lugar de hacer caer el sitemap entero.
  let salonEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("salons")
      .select("slug, updated_at")
      .eq("is_published", true)
      .is("suspended_at", null);

    if (data) {
      salonEntries = data.map((s) => ({
        url: `${BASE_URL}/s/${s.slug}`,
        lastModified: s.updated_at ? new Date(s.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // Fail-soft: el sitemap se genera con las rutas estáticas mientras
    // tanto.
  }

  return [...staticEntries, ...salonEntries];
}
