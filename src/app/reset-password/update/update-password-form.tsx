"use client";

import { useActionState } from "react";
import { Button } from "@/components/button";
import { updatePassword, type ResetPasswordState } from "../actions";

const initialState: ResetPasswordState = {};

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm text-[var(--muted)]">Neues Passwort</span>
        <input required type="password" name="password" minLength={8} className="w-full" />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm text-[var(--muted)]">Passwort bestätigen</span>
        <input required type="password" name="confirmPassword" minLength={8} className="w-full" />
      </label>

      {state.message ? (
        <p className="rounded-lg border border-[var(--warn)] bg-black/20 p-3 text-sm text-[var(--warn)]">
          {state.message}
        </p>
      ) : null}

      <Button variant="primary" className="w-full" disabled={isPending}>
        {isPending ? "Wird gespeichert..." : "Passwort speichern"}
      </Button>
    </form>
  );
}
