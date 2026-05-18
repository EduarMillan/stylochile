"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginAction, type AuthState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-6">
      {next && <input type="hidden" name="next" value={next} />}

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
        <div className="flex items-baseline justify-between gap-3">
          <Label
            htmlFor="password"
            className="text-xs uppercase tracking-[0.15em]"
          >
            Contraseña
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
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
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
