import type { Metadata } from "next";
import { Manrope, Noto_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import {
  jsonLdScriptProps,
  organizationJsonLd,
  siteJsonLd,
} from "@/lib/schema";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const notoSerif = Noto_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://stylochile.vercel.app";

const SITE_DESCRIPTION =
  "Directorio y plataforma de gestión para salones de belleza en Chile. Vitrina pública, reservas con aprobación, historial de clientes y almacén — todo en un solo lugar.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "StyloChile · Salones de belleza en Chile",
    template: "%s · StyloChile",
  },
  description: SITE_DESCRIPTION,
  applicationName: "StyloChile",
  keywords: [
    "salones de belleza",
    "Chile",
    "peluquería",
    "manicure",
    "estética",
    "barbería",
    "reservar hora",
  ],
  authors: [{ name: "StyloChile" }],
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: SITE_URL,
    siteName: "StyloChile",
    title: "StyloChile · Salones de belleza en Chile",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "StyloChile · Salones de belleza en Chile",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`dark ${manrope.variable} ${notoSerif.variable}`}
    >
      <body
        className="min-h-screen flex flex-col font-sans"
        suppressHydrationWarning
      >
        {/* JSON-LD: WebSite (sitelinks search box) + Organization (logo
            en knowledge panel). Se renderizan en cada página. */}
        <script {...jsonLdScriptProps(siteJsonLd())} />
        <script {...jsonLdScriptProps(organizationJsonLd())} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
