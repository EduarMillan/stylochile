"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { PlatformSettings } from "@/lib/types";
import {
  savePlatformSettingsAction,
  type PlatformSettingsState,
} from "./actions";

export function PlatformSettingsForm({
  initial,
}: {
  initial: PlatformSettings;
}) {
  const [state, action, pending] = useActionState<
    PlatformSettingsState,
    FormData
  >(savePlatformSettingsAction, null);

  useEffect(() => {
    if (state?.success) toast.success(state.success);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label className="text-xs uppercase tracking-[0.15em]">
            Días de trial
          </Label>
          <Input
            name="trial_days"
            type="number"
            min={1}
            max={365}
            defaultValue={initial.trial_days}
            required
          />
          <p className="text-xs text-muted-foreground">
            Período gratis al crear un salón. Entre 1 y 365.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-xs uppercase tracking-[0.15em]">
            Días de gracia
          </Label>
          <Input
            name="grace_period_days"
            type="number"
            min={0}
            max={30}
            defaultValue={initial.grace_period_days}
            required
          />
          <p className="text-xs text-muted-foreground">
            Días extra después de vencer el período antes de suspender.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
        <div className="flex flex-col gap-2">
          <Label className="text-xs uppercase tracking-[0.15em]">
            Precio mensual
          </Label>
          <Input
            name="monthly_price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={initial.monthly_price}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-xs uppercase tracking-[0.15em]">
            Moneda
          </Label>
          <Input
            name="currency"
            maxLength={8}
            defaultValue={initial.currency}
            required
            placeholder="CLP"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs uppercase tracking-[0.15em]">
          WhatsApp admin
        </Label>
        <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40">
          <span className="flex select-none items-center bg-secondary px-3 font-serif text-base text-primary">
            +
          </span>
          <Input
            name="admin_whatsapp"
            defaultValue={initial.admin_whatsapp ?? ""}
            placeholder="56971363610"
            className="flex-1 rounded-none border-0 focus-visible:ring-0"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Número al que se envía el dueño cuando hace clic en &quot;Contactar
          admin&quot; en el banner. Solo dígitos, código de país incluido.
        </p>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="self-start px-8 py-3 uppercase tracking-wider"
      >
        {pending ? "Guardando…" : "Guardar configuración"}
      </Button>
    </form>
  );
}
