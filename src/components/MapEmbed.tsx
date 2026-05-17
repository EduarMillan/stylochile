type Props = {
  query: string | null;
  className?: string;
};

export function MapEmbed({ query, className }: Props) {
  if (!query || !query.trim()) return null;

  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;

  return (
    <iframe
      src={src}
      title="Ubicación del salón"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={className}
      style={{ border: 0, width: "100%", height: "100%" }}
    />
  );
}

export function mapsLink(query: string | null): string | null {
  if (!query || !query.trim()) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
