"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/imageCompression";
import { Button } from "@/components/ui/button";

type Props = {
  salonId: string;
  folder: string; // ej. "gallery", "staff", "cover", `clients/${id}`
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: "square" | "portrait" | "landscape";
};

const ACCEPT = "image/png,image/jpeg,image/webp,image/heic,image/heif";
// Cap "duro" para evitar cargar archivos absurdos al canvas. La compresión
// reduce típicamente 30-50× así que aceptamos hasta 30MB de origen.
const MAX_INPUT_BYTES = 30 * 1024 * 1024;
// Cap "post-compresión" para limitar lo que sube a Storage. Suficiente
// para fotos grandes después de pasar por WebP @ 1600px.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function ImageUpload({
  salonId,
  folder,
  value,
  onChange,
  label = "Imagen",
  aspect = "square",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    if (file.size > MAX_INPUT_BYTES) {
      toast.error("La imagen es demasiado grande (máx 30MB).");
      return;
    }
    setUploading(true);
    try {
      // Comprime en cliente: típicamente reduce 3-5MB → 200-400KB.
      const compressed = await compressImage(file);

      if (compressed.blob.size > MAX_UPLOAD_BYTES) {
        toast.error(
          "La imagen sigue siendo muy pesada después de optimizar. Intenta con una más pequeña.",
        );
        return;
      }

      const supabase = createClient();
      const path = `${salonId}/${folder}/${crypto.randomUUID()}.${compressed.extension}`;

      const { error } = await supabase.storage
        .from("salon-media")
        .upload(path, compressed.blob, {
          contentType: compressed.blob.type || file.type,
          upsert: false,
        });

      if (error) {
        console.error("Image upload failed:", {
          path,
          bucket: "salon-media",
          error,
        });
        toast.error(`Upload falló: ${error.message}`);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("salon-media").getPublicUrl(path);

      onChange(publicUrl);
    } finally {
      setUploading(false);
    }
  }

  const aspectClass =
    aspect === "portrait"
      ? "aspect-[3/4]"
      : aspect === "landscape"
        ? "aspect-[4/3]"
        : "aspect-square";

  return (
    <div className="flex flex-col gap-2">
      <span className="sr-only text-xs uppercase tracking-[0.15em] text-muted-foreground sm:not-sr-only">
        {label}
      </span>
      <div
        className={`relative ${aspectClass} w-full max-w-[120px] border border-border bg-muted sm:max-w-xs`}
      >
        {value ? (
          <Image
            src={value}
            alt={label}
            fill
            sizes="320px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Sin imagen
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Subiendo…" : value ? "Reemplazar" : "Subir imagen"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
          >
            Quitar
          </Button>
        )}
      </div>
    </div>
  );
}
