"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  LayoutGrid,
  Sparkles,
  Images,
  Building2,
  Users,
  Calendar,
  UsersRound,
  Package,
  Star,
  Shield,
  LogOut,
  Menu,
  X,
  ExternalLink,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { logoutAction } from "./actions";

type SalonInfo = { id: string; name: string; slug: string } | null;

export function AdminShell({
  salon,
  ownerName,
  isSuperAdmin = false,
  adminWhatsapp = null,
  children,
}: {
  salon: SalonInfo;
  ownerName: string;
  isSuperAdmin?: boolean;
  adminWhatsapp?: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el drawer al navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquea scroll del body cuando el drawer está abierto en mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="admin-canvas min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Top bar móvil */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link
          href="/dashboard"
          className="font-serif text-lg tracking-tight text-gold-gradient"
        >
          STYLOCUBA
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <span className="sr-only">Menú</span>
          <Menu className="size-5" />
        </button>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar (drawer en mobile, fija en desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-sidebar transition-transform duration-200 ease-out lg:static lg:w-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-6">
          <div>
            <Link
              href="/dashboard"
              className="font-serif text-xl tracking-tight text-gold-gradient"
            >
              STYLOCUBA
            </Link>
            {salon ? (
              <>
                <p className="mt-3 text-sm text-foreground">{salon.name}</p>
                <Link
                  href={`/s/${salon.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-primary"
                >
                  Ver vitrina pública
                  <ExternalLink className="size-3" />
                </Link>
              </>
            ) : (
              <p className="mt-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Sin salón configurado
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto px-3 py-4 text-sm">
          <SidebarLink
            href="/dashboard"
            label="Dashboard"
            icon={LayoutDashboard}
            iconColor="text-sky-400"
            pathname={pathname}
          />
          <SidebarLink
            href="/salon/configuracion"
            label="Configuración"
            icon={Settings}
            iconColor="text-slate-400"
            pathname={pathname}
          />
          <SidebarSection label="Vitrina" />
          <SidebarLink
            href="/salon/areas"
            label="Áreas"
            icon={LayoutGrid}
            iconColor="text-violet-400"
            indent
            pathname={pathname}
          />
          <SidebarLink
            href="/salon/servicios"
            label="Servicios"
            icon={Sparkles}
            iconColor="text-rose-400"
            indent
            pathname={pathname}
          />
          <SidebarLink
            href="/salon/galeria"
            label="Galería"
            icon={Images}
            iconColor="text-pink-400"
            indent
            pathname={pathname}
          />
          <SidebarLink
            href="/salon/instalaciones"
            label="Instalaciones"
            icon={Building2}
            iconColor="text-emerald-400"
            indent
            pathname={pathname}
          />
          <SidebarLink
            href="/salon/staff"
            label="Equipo"
            icon={Users}
            iconColor="text-orange-400"
            indent
            pathname={pathname}
          />
          <SidebarLink
            href="/salon/agenda"
            label="Agenda"
            icon={Calendar}
            iconColor="text-blue-400"
            pathname={pathname}
          />
          <SidebarLink
            href="/salon/clientes"
            label="Clientes"
            icon={UsersRound}
            iconColor="text-indigo-400"
            pathname={pathname}
          />
          <SidebarLink
            href="/salon/almacen"
            label="Almacén"
            icon={Package}
            iconColor="text-teal-400"
            pathname={pathname}
          />
          <SidebarLink
            href="/salon/resenas"
            label="Reseñas"
            icon={Star}
            iconColor="text-yellow-400"
            pathname={pathname}
          />

          {isSuperAdmin && (
            <Link
              href="/admin"
              className="mt-6 flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <Shield className="size-4 shrink-0" />
              <span>Panel global</span>
              <span className="ml-auto text-xs">↗</span>
            </Link>
          )}

          {adminWhatsapp && (
            <a
              href={`https://wa.me/${adminWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                "Hola, soy dueño de un salón en StyloCuba y necesito ayuda.",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/15"
            >
              <MessageCircle className="size-4 shrink-0" />
              <span>Contactar admin</span>
              <span className="ml-auto text-xs">↗</span>
            </a>
          )}
        </nav>

        <div className="mt-auto border-t border-border px-6 py-4">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Sesión
          </p>
          <p className="mt-1 truncate text-sm text-foreground">{ownerName}</p>
          <form action={logoutAction} className="mt-4">
            <button
              type="submit"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-primary"
            >
              <LogOut className="size-3.5" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 overflow-x-hidden">{children}</main>

      <Toaster richColors position="bottom-right" />
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  iconColor,
  indent,
  pathname,
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
  iconColor?: string;
  indent?: boolean;
  pathname: string;
}) {
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg py-2 transition-colors ${
        indent ? "pl-6 pr-3" : "px-3"
      } ${
        active
          ? "bg-sidebar-accent text-primary"
          : "text-foreground hover:bg-sidebar-accent hover:text-primary"
      }`}
    >
      {Icon && (
        <Icon className={`size-4 shrink-0 ${iconColor ?? ""}`} />
      )}
      <span>{label}</span>
    </Link>
  );
}

function SidebarSection({ label }: { label: string }) {
  return (
    <span className="mt-3 block px-3 pt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
      {label}
    </span>
  );
}

function SidebarLinkDisabled({
  label,
  hint,
  icon: Icon,
  indent,
}: {
  label: string;
  hint: string;
  icon?: LucideIcon;
  indent?: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-3 py-2 text-muted-foreground/60 ${
        indent ? "pl-6 pr-3" : "px-3"
      }`}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      <span>{label}</span>
      <span className="ml-auto text-[10px] uppercase tracking-[0.15em]">
        {hint}
      </span>
    </span>
  );
}
