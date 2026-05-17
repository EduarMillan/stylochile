import type { SupabaseClient } from "@supabase/supabase-js";

export const SALON_MEDIA_BUCKET = "salon-media";

/**
 * Extrae el path interno del bucket desde una URL pública de Supabase
 * Storage. Devuelve null si la URL no pertenece al bucket esperado.
 *
 * Ejemplo:
 *   https://x.supabase.co/storage/v1/object/public/salon-media/abc/staff/uuid.webp
 *   → "abc/staff/uuid.webp"
 */
export function extractStoragePath(
  url: string | null | undefined,
  bucket: string = SALON_MEDIA_BUCKET,
): string | null {
  if (!url) return null;
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const after = url.slice(idx + marker.length);
  // Quita query string si existe
  const clean = after.split("?")[0];
  return clean || null;
}

/**
 * Borra uno o más archivos del bucket salon-media. Acepta URLs públicas
 * o paths internos directamente. Ignora silenciosamente entradas null/no
 * reconocidas — el cleanup no debe bloquear la operación principal.
 */
export async function removeStorageFiles(
  supabase: SupabaseClient,
  urlsOrPaths: Array<string | null | undefined>,
): Promise<void> {
  const paths = urlsOrPaths
    .map((u) =>
      typeof u === "string" && u.includes("/")
        ? (extractStoragePath(u) ?? u)
        : null,
    )
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return;

  const { error } = await supabase.storage
    .from(SALON_MEDIA_BUCKET)
    .remove(paths);
  if (error) {
    // No bloqueamos: si falla el cleanup, la op principal ya tuvo éxito.
    // Solo loggeamos para poder debuggear orphans persistentes.
    console.error("Storage cleanup failed:", { paths, error });
  }
}

/**
 * Enumera recursivamente todos los archivos bajo un prefix dentro del
 * bucket salon-media. Útil para limpiar el folder entero de un salón
 * (`{salonId}/`) que tiene subcarpetas (staff, gallery, facility,
 * clients/...).
 */
export async function listAllFilesUnder(
  supabase: SupabaseClient,
  prefix: string,
): Promise<string[]> {
  const found: string[] = [];
  const queue: string[] = [prefix];

  while (queue.length > 0) {
    const path = queue.shift()!;
    const { data, error } = await supabase.storage
      .from(SALON_MEDIA_BUCKET)
      .list(path, { limit: 1000 });
    if (error || !data) {
      if (error) {
        console.error("Storage list failed:", { path, error });
      }
      continue;
    }
    for (const item of data) {
      const full = `${path}/${item.name}`;
      // En Supabase Storage, un "folder" tiene id null y no expone
      // metadata. Un file tiene id no-null y metadata como size.
      if (item.id == null) {
        queue.push(full);
      } else {
        found.push(full);
      }
    }
  }
  return found;
}
