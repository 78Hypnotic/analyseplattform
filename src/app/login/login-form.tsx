"use client";

import { useActionState } from "react";
import { Button } from "@/components/button";
import { signInWithMagicLink, type LoginActionState } from "./actions";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInWithMagicLink, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm text-[var(--muted)]">E-Mail</span>
        <input
          required
          type="email"
          name="email"
          placeholder="name@example.com"
          className="w-full"
        />
      </label>
      {state.message ? (
        <p className="rounded-lg border border-[var(--warn)] bg-black/20 p-3 text-sm text-[var(--warn)]">
          {state.message}
        </p>
      ) : null}
      <Button variant="primary" className="w-full" disabled={isPending}>
        {isPending ? "Wird gesendet..." : "Link senden"}
      </Button>
    </form>
  );
}
