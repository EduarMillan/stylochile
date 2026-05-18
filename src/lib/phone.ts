/**
 * Helpers para teléfonos chilenos. Los formularios capturan solo los
 * dígitos locales (típicamente 9 para móvil, comenzando con 9) y
 * prepend +56 en el servidor antes de guardar. Al cargar para editar,
 * strippeamos el +56 para mostrar solo los dígitos locales.
 */

export function digitsOnly(s: string | null | undefined): string {
  return String(s ?? "").replace(/\D/g, "");
}

// Quita el código país 56 si está presente. Para defaultValue de
// inputs que solo aceptan los dígitos locales.
export function stripChilePrefix(stored: string | null | undefined): string {
  const d = digitsOnly(stored);
  if (d.startsWith("56") && d.length > 9) return d.slice(2);
  return d;
}

// Construye el teléfono canónico "+56XXXXXXXXX". Devuelve "" si el
// input está vacío. Tolera que el usuario haya escrito el 56
// (no lo duplica).
export function buildChilePhone(raw: string | null | undefined): string {
  const d = digitsOnly(raw);
  if (!d) return "";
  return d.startsWith("56") ? `+${d}` : `+56${d}`;
}

// Valida que el input sea un teléfono local chileno: exactamente 9
// dígitos, o 11 dígitos comenzando con 56 (por si el usuario pegó el
// código de país). Si `allowEmpty` es true, acepta vacío para campos
// opcionales.
export function validateChilePhone(
  raw: string | null | undefined,
  options: { allowEmpty?: boolean } = {},
): { ok: true } | { ok: false; error: string } {
  const d = digitsOnly(raw);
  if (d.length === 0) {
    return options.allowEmpty
      ? { ok: true }
      : { ok: false, error: "El teléfono es obligatorio." };
  }
  if (d.length === 9) return { ok: true };
  if (d.length === 11 && d.startsWith("56")) return { ok: true };
  return {
    ok: false,
    error: "El teléfono debe tener 9 dígitos (sin código de país).",
  };
}
