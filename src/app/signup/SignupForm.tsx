"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
          Nombre completo
        </Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
        />
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
        <Label
          htmlFor="password"
          className="text-xs uppercase tracking-[0.15em]"
        >
          Contraseña
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
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
