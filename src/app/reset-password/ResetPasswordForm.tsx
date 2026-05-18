"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resetPasswordAction, type ResetState } from "./actions";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(
    resetPasswordAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-xs uppercase tracking-[0.15em]"
        >
          Nueva contraseña
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

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="confirm"
          className="text-xs uppercase tracking-[0.15em]"
        >
          Confirma la contraseña
        </Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="self-start uppercase tracking-wider"
      >
        {pending ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
