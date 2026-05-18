"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/PasswordInput";
import { signupAction, type AuthState } from "./actions";

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signupAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="full_name"
          className="text-xs uppercase tracking-[0.15em]"
        >
          Tu nombre completo
        </Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
        />
        <p className="text-xs text-muted-foreground">
          Tu nombre, no el del salón. El nombre del salón lo configuras
          después.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-xs uppercase tracking-[0.15em]">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone" className="text-xs uppercase tracking-[0.15em]">
          Teléfono
        </Label>
        <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40">
          <span className="flex select-none items-center bg-secondary px-3 font-serif text-base text-primary">
            +56
          </span>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{9}"
            minLength={9}
            maxLength={9}
            autoComplete="tel"
            required
            placeholder="971234567"
            title="9 dígitos sin código de país"
            className="flex-1 rounded-none border-0 focus-visible:ring-0"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Te lo pedimos para que el admin pueda contactarte si hay algún
          problema con tu cuenta o pago.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-xs uppercase tracking-[0.15em]"
        >
          Contraseña
        </Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.info && (
        <p className="text-sm text-primary">{state.info}</p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="self-start uppercase tracking-wider"
      >
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
