"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  Store,
  Users,
  Star,
  Settings,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { logoutAction } from "@/app/(admin)/actions";

export function SuperAdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-destructive/40 bg-sidebar/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="font-serif text-lg tracking-tight text-gold-gradient"
          >
            STYLOCHILE
          </Link>
          <span className="rounded-full border border-destructive/60 bg-destructive/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-destructive">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-destructive/30 bg-sidebar transition-transform duration-200 ease-out lg:static lg:w-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-destructive/30 px-6 py-6">
          <div>
            <Link
              href="/admin"
              className="font-serif text-xl tracking-tight text-gold-gradient"
            >
              STYLOCHILE
            </Link>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-destructive/60 bg-destructive/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">
              <span className="size-1.5 rounded-full bg-destructive" />
              Panel global
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Estás administrando toda la plataforma
            </p>
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
            href="/admin"
            label="Resumen"
            icon={Gauge}
            pathname={pathname}
            exact
          />
          <SidebarLink
            href="/admin/salones"
            label="Salones"
            icon={Store}
            pathname={pathname}
          />
          <SidebarLink
            href="/admin/usuarios"
            label="Usuarios"
            icon={Users}
            pathname={pathname}
          />
          <SidebarLink
            href="/admin/resenas"
            label="Reseñas"
            icon={Star}
            pathname={pathname}
          />
          <SidebarLink
            href="/admin/configuracion"
            label="Configuración"
            icon={Settings}
            pathname={pathname}
          />

          <div className="mt-6 border-t border-border/50 pt-4">
            <SidebarLink
              href="/dashboard"
              label="Mi salón"
              icon={ArrowLeft}
              pathname={pathname}
            />
          </div>
        </nav>

        <div className="mt-auto border-t border-border/50 px-6 py-4">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Super-admin
          </p>
          <p className="mt-1 truncate text-sm text-foreground">{email}</p>
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
  pathname,
  exact,
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
  pathname: string;
  exact?: boolean;
}) {
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        active
          ? "bg-sidebar-accent text-primary"
          : "text-foreground hover:bg-sidebar-accent hover:text-primary"
      }`}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      <span>{label}</span>
    </Link>
  );
}
