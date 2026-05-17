import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { SuspendedScreen } from "@/components/SuspendedScreen";
import { shouldAutoSuspend } from "@/lib/subscription";
import type {
  PlatformSettings,
  SalonSubscription,
} from "@/lib/types";
import { AdminShell } from "./AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, slug, suspended_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Fetch subscription + platform settings en paralelo si hay salón.
  let subscription: SalonSubscription | null = null;
  let settings: PlatformSettings | null = null;
  let suspendedAt: string | null = salon?.suspended_at ?? null;
  if (salon) {
    const [subResult, settingsResult] = await Promise.all([
      supabase
        .from("salon_subscriptions")
        .select("*")
        .eq("salon_id", salon.id)
        .maybeSingle(),
      supabase
        .from("platform_settings")
        .select(
          "trial_days, grace_period_days, monthly_price, currency, admin_whatsapp, updated_at",
        )
        .eq("id", true)
        .maybeSingle(),
    ]);
    subscription = (subResult.data as SalonSubscription | null) ?? null;
    settings = (settingsResult.data as PlatformSettings | null) ?? null;

    // Auto-suspensión: si la subscription venció hace más días que el
    // grace period y el salón aún no está suspendido, lo suspendemos
    // ahora (vía service role para bypassear RLS) y marcamos la
    // subscription como expired. La pantalla de suspendido toma el
    // control abajo.
    if (
      !suspendedAt &&
      subscription &&
      settings &&
      shouldAutoSuspend(subscription, settings.grace_period_days)
    ) {
      const admin = createSupabaseAdminClient();
      const nowIso = new Date().toISOString();
      await Promise.all([
        admin
          .from("salons")
          .update({ suspended_at: nowIso })
          .eq("id", salon.id),
        admin
          .from("salon_subscriptions")
          .update({ status: "expired" })
          .eq("salon_id", salon.id),
      ]);
      suspendedAt = nowIso;
      // Refresca el snapshot local del subscription status para que el
      // banner/screen reflejen el nuevo estado sin necesidad de re-fetch.
      if (subscription) subscription = { ...subscription, status: "expired" };
    }
  }

  // Si el salón está suspendido (manual o auto), muestra pantalla
  // bloqueada con WhatsApp y logout. No renderiza el dashboard.
  if (salon && suspendedAt) {
    return (
      <SuspendedScreen
        salonName={salon.name}
        adminWhatsapp={settings?.admin_whatsapp ?? null}
      />
    );
  }

  const ownerName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";

  const isSuperAdmin =
    user.email?.toLowerCase() === "eduarmillan00@gmail.com";

  return (
    <AdminShell
      salon={salon}
      ownerName={ownerName}
      isSuperAdmin={isSuperAdmin}
      adminWhatsapp={settings?.admin_whatsapp ?? null}
    >
      {subscription && settings && (
        <div className="px-4 pt-4 sm:px-8 sm:pt-6 lg:px-16">
          <SubscriptionBanner
            status={subscription.status}
            trialEndsAt={subscription.trial_ends_at}
            periodEndsAt={subscription.current_period_ends_at}
            gracePeriodDays={settings.grace_period_days}
            monthlyPrice={Number(settings.monthly_price)}
            currency={settings.currency}
            adminWhatsapp={settings.admin_whatsapp}
          />
        </div>
      )}
      {children}
    </AdminShell>
  );
}
