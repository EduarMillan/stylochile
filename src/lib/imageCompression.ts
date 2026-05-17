/**
 * Comprime una imagen en el cliente antes de subirla. Redimensiona al
 * tamaño máximo y convierte a WebP con calidad alta. Reduce típicamente
 * fotos de 3-5MB a 200-400KB sin pérdida visual perceptible.
 *
 * Si el archivo no es procesable (SVG, error de decode), retorna el
 * archivo original tal cual.
 */

const MAX_DIMENSION = 1600;
const QUALITY = 0.85;
const SKIP_BELOW_BYTES = 150 * 1024; // < 150KB ya están comprimidos

export type CompressionResult = {
  blob: Blob;
  extension: "webp" | "jpg" | "png";
  originalBytes: number;
  finalBytes: number;
  compressed: boolean;
};

export async function compressImage(file: File): Promise<CompressionResult> {
  const original = {
    originalBytes: file.size,
    finalBytes: file.size,
    compressed: false,
  };

  // Archivos pequeños: no merece la pena
  if (file.size < SKIP_BELOW_BYTES) {
    return passthrough(file, original);
  }
  // SVG: no se procesa con canvas
  if (file.type === "image/svg+xml") {
    return passthrough(file, original);
  }

  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    return passthrough(file, original);
  }

  const sourceWidth =
    "naturalWidth" in bitmap ? bitmap.naturalWidth : bitmap.width;
  const sourceHeight =
    "naturalHeight" in bitmap ? bitmap.naturalHeight : bitmap.height;
  if (!sourceWidth || !sourceHeight) {
    return passthrough(file, original);
  }

  const { width, height } = fitWithin(sourceWidth, sourceHeight, MAX_DIMENSION);

  let blob: Blob;
  try {
    blob = await renderToBlob(bitmap, width, height, QUALITY);
  } catch {
    return passthrough(file, original);
  } finally {
    if ("close" in bitmap) bitmap.close();
  }

  // Si la "compresión" resulta más grande que el original, devuelve el
  // original (puede pasar con PNG o imágenes ya muy optimizadas).
  if (blob.size >= file.size) {
    return passthrough(file, original);
  }

  return {
    blob,
    extension: blob.type === "image/webp" ? "webp" : "jpg",
    originalBytes: file.size,
    finalBytes: blob.size,
    compressed: true,
  };
}

function passthrough(file: File, base: { originalBytes: number }): CompressionResult {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const extension =
    ext === "png" ? "png" : ext === "webp" ? "webp" : "jpg";
  return {
    blob: file,
    extension,
    originalBytes: base.originalBytes,
    finalBytes: file.size,
    compressed: false,
  };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap es el camino rápido (sin pasar por el DOM).
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // continúa al fallback
    }
  }

  // Fallback con <img>
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function fitWithin(
  width: number,
  height: number,
  maxDim: number,
): { width: number; height: number } {
  if (width <= maxDim && height <= maxDim) {
    return { width, height };
  }
  const ratio = Math.min(maxDim / width, maxDim / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

async function renderToBlob(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  // OffscreenCanvas es más rápido (no toca el DOM).
  if (typeof OffscreenCanvas !== "undefined") {
    const off = new OffscreenCanvas(width, height);
    const ctx = off.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
    try {
      return await off.convertToBlob({ type: "image/webp", quality });
    } catch {
      return await off.convertToBlob({ type: "image/jpeg", quality });
    }
  }

  // Fallback con <canvas>
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  return await new Promise<Blob>((resolve, reject) => {
    const tryWebp = () =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : tryJpeg()),
        "image/webp",
        quality,
      );
    const tryJpeg = () =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        quality,
      );
    tryWebp();
  });
}
