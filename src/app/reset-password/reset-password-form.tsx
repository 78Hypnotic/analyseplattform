"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/button";
import { requestPasswordReset, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm text-[var(--muted)]">E-Mail</span>
        <input required type="email" name="email" placeholder="name@example.com" className="w-full" />
      </label>

      {state.message ? (
        <p className="rounded-lg border border-[var(--warn)] bg-[var(--raised-bg)] p-3 text-sm text-[var(--warn)]">
          {state.message}
        </p>
      ) : null}

      <Button variant="primary" className="w-full" disabled={isPending}>
        {isPending ? "Wird gesendet..." : "Reset-Link senden"}
      </Button>

      <Link href="/login" className="block text-center text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        Zurück zum Login
      </Link>
    </form>
  );
}
