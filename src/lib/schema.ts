/**
 * Helpers para generar JSON-LD (Schema.org).
 *
 * Google usa estos datos estructurados para mostrar rich results:
 *   - BeautySalon → estrellas, dirección, horarios, mapa, teléfono.
 *   - WebSite con SearchAction → sitelinks search box.
 *   - Organization → logo en knowledge panel.
 *
 * Cada función devuelve un objeto plano que se inyecta tal cual con
 * <script type="application/ld+json">.
 */

import type { Review, Salon, Service } from "@/lib/types";
import { composeAddress } from "@/lib/chile";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://stylochile.vercel.app";

const DAY_MAP = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
} as const;

/**
 * JSON-LD para la home y vitrinas públicas — describe el sitio entero
 * para que Google muestre el search box en SERP.
 */
export function siteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "StyloChile",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/salones?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * JSON-LD de la organización detrás del sitio. Habilita el logo en el
 * knowledge panel de Google.
 */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StyloChile",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description:
      "Directorio y plataforma de gestión para salones de belleza en Chile.",
  };
}

/**
 * JSON-LD de un salón individual. Usa BeautySalon (más específico que
 * LocalBusiness) y mezcla dirección, teléfono, horario, servicios y
 * reseñas agregadas.
 */
export function salonJsonLd(
  salon: Salon,
  services: Service[],
  reviews: Review[],
): Record<string, unknown> {
  const url = `${SITE_URL}/s/${salon.slug}`;

  const address = composeAddress({
    calle: salon.calle,
    numero: salon.numero,
    sector: salon.sector,
    comuna: salon.comuna,
    region: salon.region,
  });

  const ratingAvg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  const openingHours = salon.hours
    ? Object.entries(salon.hours)
        .filter(([, d]) => d && !d.closed)
        .map(([key, d]) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: `https://schema.org/${DAY_MAP[key as keyof typeof DAY_MAP]}`,
          opens: d.open,
          closes: d.close,
        }))
    : [];

  const offers = services
    .filter((s) => s.price != null)
    .slice(0, 20) // límite razonable para no inflar el payload
    .map((s) => ({
      "@type": "Offer",
      name: s.name,
      ...(s.description ? { description: s.description } : {}),
      price: s.price,
      priceCurrency: s.currency,
    }));

  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "@id": url,
    name: salon.name,
    ...(salon.description ? { description: salon.description } : {}),
    url,
    ...(salon.logo_url ? { image: salon.logo_url, logo: salon.logo_url } : {}),
    ...(salon.phone ? { telephone: salon.phone } : {}),
    ...(address
      ? {
          address: {
            "@type": "PostalAddress",
            ...(salon.calle && salon.numero
              ? { streetAddress: `${salon.calle} ${salon.numero}` }
              : salon.calle
                ? { streetAddress: salon.calle }
                : {}),
            ...(salon.comuna ? { addressLocality: salon.comuna } : {}),
            ...(salon.region ? { addressRegion: salon.region } : {}),
            addressCountry: "CL",
          },
        }
      : {}),
    ...(openingHours.length > 0
      ? { openingHoursSpecification: openingHours }
      : {}),
    ...(offers.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Servicios",
            itemListElement: offers,
          },
        }
      : {}),
    ...(ratingAvg !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingAvg.toFixed(1),
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

/**
 * Componente de utilidad: serializa un objeto JSON-LD como un <script>
 * que Next.js mete en el <head>. Uso:
 *   <JsonLd data={salonJsonLd(salon, services, reviews)} />
 */
export function jsonLdScriptProps(
  data: Record<string, unknown>,
): {
  type: "application/ld+json";
  dangerouslySetInnerHTML: { __html: string };
} {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  };
}
