import { createClient } from "@/lib/supabase/server";
import type { PlatformSettings } from "@/lib/types";
import { PlatformSettingsForm } from "./PlatformSettingsForm";

export default async function PlatformSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select(
      "trial_days, grace_period_days, monthly_price, currency, admin_whatsapp, updated_at",
    )
    .eq("id", true)
    .maybeSingle();

  const settings: PlatformSettings = data
    ? {
        ...(data as PlatformSettings),
        monthly_price: Number(data.monthly_price),
      }
    : {
        trial_days: 90,
        grace_period_days: 5,
        monthly_price: 9990,
        currency: "CLP",
        admin_whatsapp: null,
        updated_at: new Date().toISOString(),
      };

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Plataforma · Super-admin
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        Configuración global
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Define cuántos días de trial reciben los salones nuevos, el precio
        mensual del plan, y el número de WhatsApp donde te contactan para
        coordinar pagos.
      </p>

      <div className="mt-10">
        {/* key fuerza remount cuando cambia updated_at (después de
            un save). Sin esto, los inputs uncontrolled de base-ui
            mantienen su valor inicial y emiten warning. */}
        <PlatformSettingsForm
          key={settings.updated_at}
          initial={settings}
        />
      </div>
    </div>
  );
}
