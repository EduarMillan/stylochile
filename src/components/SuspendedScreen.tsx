import { logoutAction } from "@/app/(admin)/actions";

/**
 * Pantalla mostrada al dueño cuando su salón está suspendido (sea por
 * acción manual del super-admin o por auto-suspensión post-grace). El
 * dueño no puede acceder al panel hasta coordinar con el admin.
 */
export function SuspendedScreen({
  salonName,
  adminWhatsapp,
}: {
  salonName: string;
  adminWhatsapp: string | null;
}) {
  const waUrl = adminWhatsapp
    ? `https://wa.me/${adminWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hola, soy dueño del salón "${salonName}" en StyloCuba. Mi cuenta fue suspendida, quiero coordinar el pago para reactivarla.`,
      )}`
    : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="card-glam mx-auto max-w-md p-8 sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/30">
          <svg
            className="size-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <h1 className="mt-6 font-serif text-2xl tracking-tight">
          Salón suspendido
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Tu salón <strong className="text-foreground">{salonName}</strong>{" "}
          está suspendido temporalmente. Mientras esté inactivo, no aparece
          en la vitrina pública y no puedes acceder al panel de gestión.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Para reactivarlo, coordina el pago de tu plan con el administrador.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold uppercase tracking-[0.15em] text-emerald-950 shadow-md shadow-emerald-500/30 transition-all hover:scale-[1.02] hover:bg-emerald-400"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contactar admin
            </a>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-full border border-border bg-background/40 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
