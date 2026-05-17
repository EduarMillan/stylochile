"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_HOURS, type Salon, type WeeklyHours } from "@/lib/types";
import { slugify } from "@/lib/slug";
import { CUBA_MUNICIPIOS, CUBA_PROVINCIAS } from "@/lib/cuba";
import { ImageUpload } from "@/components/ImageUpload";
import { saveSalonAction, type SaveSalonState } from "./actions";
import { HoursEditor } from "./HoursEditor";

// Normaliza el WhatsApp guardado a solo dígitos para mostrarlo.
function digitsOnly(stored: string | null): string {
  if (!stored) return "";
  return stored.replace(/\D/g, "");
}

export function SalonForm({ salon }: { salon: Salon | null }) {
  const [state, action, pending] = useActionState<SaveSalonState, FormData>(
    saveSalonAction,
    null,
  );

  const [name, setName] = useState(salon?.name ?? "");
  const [slug, setSlug] = useState(salon?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(salon?.slug));
  const [hours, setHours] = useState<WeeklyHours>(
    salon?.hours ?? DEFAULT_HOURS,
  );
  const [isPublished, setIsPublished] = useState(salon?.is_published ?? false);

  const [provincia, setProvincia] = useState<string>(salon?.provincia ?? "");
  const [municipio, setMunicipio] = useState<string>(salon?.municipio ?? "");
  const municipios = provincia ? (CUBA_MUNICIPIOS[provincia] ?? []) : [];

  const [logoUrl, setLogoUrl] = useState<string | null>(salon?.logo_url ?? null);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  useEffect(() => {
    if (state?.success) toast.success(state.success);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-12">
      <input type="hidden" name="hours_json" value={JSON.stringify(hours)} />
      <input type="hidden" name="provincia" value={provincia} />
      <input type="hidden" name="municipio" value={municipio} />
      <input type="hidden" name="logo_url" value={logoUrl ?? ""} />

      {/* Identidad */}
      <Section
        label="Identidad"
        title="Nombre y descripción"
        description="Esto es lo que verán los clientes en tu vitrina pública."
      >
        <FieldGroup>
          <Field label="Nombre del salón">
            <Input
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Salón Maison de Luxe"
            />
          </Field>
          <Field
            label="URL pública"
            hint={`Tu salón estará en stylocuba.com/s/${slug || "tu-salon"}`}
          >
            <Input
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="maison-de-luxe"
            />
          </Field>
        </FieldGroup>
        <Field label="Descripción">
          <Textarea
            name="description"
            rows={4}
            defaultValue={salon?.description ?? ""}
            placeholder="Cuenta la historia y especialidades de tu salón."
          />
        </Field>
      </Section>

      <Divider />

      {/* Logo */}
      <Section
        label="Logo"
        title="Logo del salón"
        description="Una imagen cuadrada (PNG o JPG) que aparecerá en tu tarjeta en la vitrina pública. Recomendamos al menos 400×400px."
      >
        {salon ? (
          <ImageUpload
            salonId={salon.id}
            folder="logo"
            value={logoUrl}
            onChange={setLogoUrl}
            label="Logo"
            aspect="square"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Guarda primero los datos básicos del salón para poder subir tu logo.
          </p>
        )}
      </Section>

      <Divider />

      {/* Contacto */}
      <Section
        label="Contacto"
        title="Cómo te contactan"
        description="El WhatsApp se usa para recibir las solicitudes de reserva. Escribe el número con código de país, sin espacios ni símbolos (ej. para Cuba: 5358123456; para Chile: 56971363610)."
      >
        <FieldGroup>
          <Field label="Teléfono fijo (opcional)">
            <Input
              name="phone"
              type="tel"
              defaultValue={salon?.phone ?? ""}
              placeholder="7 123 4567"
            />
          </Field>
          <Field label="WhatsApp">
            <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40">
              <span className="flex select-none items-center bg-secondary px-4 font-serif text-base text-primary">
                +
              </span>
              <Input
                name="whatsapp"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={15}
                defaultValue={digitsOnly(salon?.whatsapp ?? null)}
                placeholder="5358123456"
                className="flex-1 rounded-none border-0 focus-visible:ring-0"
              />
            </div>
          </Field>
        </FieldGroup>
      </Section>

      <Divider />

      {/* Ubicación */}
      <Section
        label="Ubicación"
        title="Dirección del salón"
        description="Los clientes usarán esta información para llegar y abrir Google Maps."
      >
        <FieldGroup>
          <Field label="Calle">
            <Input
              name="calle"
              defaultValue={salon?.calle ?? ""}
              placeholder="Ej. Calle 23"
            />
          </Field>
          <Field label="Número" hint="Ej. 234, 234A o «s/n»">
            <Input
              name="numero"
              defaultValue={salon?.numero ?? ""}
              placeholder="234"
            />
          </Field>
        </FieldGroup>
        <FieldGroup>
          <Field label="Entre calle">
            <Input
              name="entre_calle_a"
              defaultValue={salon?.entre_calle_a ?? ""}
              placeholder="L"
            />
          </Field>
          <Field label="Y calle">
            <Input
              name="entre_calle_b"
              defaultValue={salon?.entre_calle_b ?? ""}
              placeholder="M"
            />
          </Field>
        </FieldGroup>
        <Field label="Reparto / Barrio">
          <Input
            name="reparto"
            defaultValue={salon?.reparto ?? ""}
            placeholder="Ej. Vedado"
          />
        </Field>
        <FieldGroup>
          <Field label="Provincia">
            <Select
              value={provincia}
              onValueChange={(v) => {
                const next = v ?? "";
                setProvincia(next);
                setMunicipio(""); // resetea al cambiar provincia
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una provincia" />
              </SelectTrigger>
              <SelectContent>
                {CUBA_PROVINCIAS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Municipio">
            <Select
              value={municipio}
              onValueChange={(v) => setMunicipio(v ?? "")}
              disabled={!provincia}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    provincia
                      ? "Selecciona un municipio"
                      : "Selecciona una provincia primero"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {municipios.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </Section>

      <Divider />

      {/* Horario */}
      <Section label="Horario" title="Días y horas de atención">
        <HoursEditor value={hours} onChange={setHours} />
      </Section>

      <Divider />

      {/* Publicación */}
      <Section label="Publicación" title="¿Tu salón está listo?">
        <PublishToggle
          isPublished={isPublished}
          setIsPublished={setIsPublished}
          slug={slug}
        />
      </Section>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={pending}
          className="px-10 py-6 text-sm uppercase tracking-wider"
        >
          {pending ? "Guardando…" : salon ? "Guardar cambios" : "Crear salón"}
        </Button>
        {state?.error && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
      </div>
    </form>
  );
}

function PublishToggle({
  isPublished,
  setIsPublished,
  slug,
}: {
  isPublished: boolean;
  setIsPublished: (v: boolean) => void;
  slug: string;
}) {
  return (
    <div
      className={`flex flex-col gap-5 rounded-3xl border-2 p-7 transition-all ${
        isPublished
          ? "border-primary bg-primary/[0.06] shadow-[0_8px_40px_-8px_rgba(212,175,55,0.35)]"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <p
            className={`text-xs font-bold uppercase tracking-[0.2em] ${
              isPublished ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {isPublished ? "● Visible al público" : "○ Aún no visible"}
          </p>
          <p className="mt-3 max-w-xl text-base leading-relaxed">
            {isPublished
              ? "Tu salón aparece en la web y los clientes pueden reservar citas. Si necesitas hacer cambios sin que se vean, vuelve a desactivarlo."
              : "Solo tú puedes ver tu salón ahora mismo. Cuando todo esté listo (datos, fotos, servicios), actívalo para que los clientes lo encuentren."}
          </p>
          {isPublished && slug && (
            <p className="mt-3 text-sm text-muted-foreground">
              Enlace público:{" "}
              <span className="text-primary">stylocuba.com/s/{slug}</span>
            </p>
          )}
        </div>
        <Switch
          name="is_published"
          checked={isPublished}
          onCheckedChange={setIsPublished}
          className="mt-1"
        />
      </div>
    </div>
  );
}

function Section({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {label}
        </p>
        <h2 className="mt-2 font-serif text-3xl tracking-tight">{title}</h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

function Divider() {
  return (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs uppercase tracking-[0.15em]">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
