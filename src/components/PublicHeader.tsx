"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type Current = "explorar" | "precios" | "login" | "signup" | null;

type Props = {
  current?: Current;
  variant?: "transparent" | "solid";
  sticky?: boolean;
};

export function PublicHeader({
  current = null,
  variant = "transparent",
  sticky = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el drawer al navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquea scroll cuando el drawer está abierto
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

  const base =
    "z-30 flex items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5 lg:px-16";
  const skin =
    variant === "solid" ? "border-b border-border/60 bg-background" : "";
  const pos = sticky ? "sticky top-0 backdrop-blur-md bg-background/85" : "";
  const position = sticky ? "sticky" : "relative";

  return (
    <>
      <header className={`${base} ${position} ${skin} ${pos}`}>
        <Link
          href="/"
          className="font-serif text-2xl tracking-tight text-gold-gradient"
        >
          STYLOCUBA
        </Link>

        {/* Nav desktop — visible desde sm+ */}
        <nav className="hidden items-center gap-4 text-xs font-bold uppercase tracking-[0.15em] sm:flex sm:gap-7">
          <NavLink href="/salones" active={current === "explorar"}>
            Explorar
          </NavLink>
          <NavLink href="/precios" active={current === "precios"}>
            Precios
          </NavLink>
          <NavLink href="/login" active={current === "login"}>
            Entrar
          </NavLink>
          <SignupCTA active={current === "signup"} />
        </nav>

        {/* Toggle hamburger — solo mobile */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted hover:text-primary sm:hidden"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Drawer mobile */}
      {open && (
        <>
          <div
            aria-hidden
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal
            aria-label="Menú principal"
            className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col border-l border-border bg-sidebar sm:hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="font-serif text-xl tracking-tight text-gold-gradient"
              >
                STYLOCUBA
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 px-3 py-4 text-sm">
              <DrawerLink
                href="/salones"
                active={current === "explorar"}
              >
                Explorar salones
              </DrawerLink>
              <DrawerLink
                href="/precios"
                active={current === "precios"}
              >
                Precios
              </DrawerLink>
              <DrawerLink
                href="/login"
                active={current === "login"}
              >
                Entrar
              </DrawerLink>
            </nav>

            <div className="mt-auto border-t border-border px-6 py-5">
              <Link
                href="/signup"
                aria-current={current === "signup" ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`bg-gold-gradient flex items-center justify-center rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-primary-foreground transition-all hover:scale-105 hover:brightness-110 ${
                  current === "signup" ? "ring-2 ring-primary/60" : "cta-pulse"
                }`}
              >
                Registrar salón
              </Link>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`link-gold transition-colors ${
        active ? "text-primary" : "text-foreground/85"
      }`}
    >
      {children}
    </Link>
  );
}

function SignupCTA({ active }: { active: boolean }) {
  return (
    <Link
      href="/signup"
      aria-current={active ? "page" : undefined}
      className={`bg-gold-gradient rounded-full px-4 py-2.5 font-semibold text-primary-foreground transition-all hover:scale-105 hover:brightness-110 sm:px-7 sm:py-3.5 ${
        active ? "ring-2 ring-primary/60" : "cta-pulse"
      }`}
    >
      <span className="sm:hidden">Registrar</span>
      <span className="hidden sm:inline">Registrar salón</span>
    </Link>
  );
}

function DrawerLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-[0.15em] transition-colors ${
        active
          ? "bg-sidebar-accent text-primary"
          : "text-foreground hover:bg-sidebar-accent hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );
}
