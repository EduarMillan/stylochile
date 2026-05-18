"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction, type ForgotState } from "./actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(
    forgotPasswordAction,
    null,
  );

  if (state?.info) {
    return (
      <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 text-sm text-foreground">
        {state.info}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
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
        <p className="text-xs text-muted-foreground">
          Te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="self-start uppercase tracking-wider"
      >
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
    </form>
  );
}
