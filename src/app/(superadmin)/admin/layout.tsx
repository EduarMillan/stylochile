import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperAdminShell } from "./SuperAdminShell";

const SUPER_ADMIN_EMAIL = "eduarmillan00@gmail.com";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defensa en profundidad: el middleware ya filtra, pero validamos en server
  if (!user) redirect("/login");
  if (user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) redirect("/dashboard");

  return <SuperAdminShell email={user.email!}>{children}</SuperAdminShell>;
}
