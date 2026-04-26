"use client";

import { useActionState } from "react";
import { Button } from "@/components/button";
import { updateProfile, type ProfileActionState } from "./actions";

export function ProfileForm({
  email,
  fullName,
}: {
  email: string;
  fullName: string;
}) {
  const [state, formAction, isPending] = useActionState<ProfileActionState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form action={formAction} className="surface mt-8 max-w-2xl space-y-5 p-6">
      <label className="grid gap-2 text-sm">
        Name
        <input name="fullName" defaultValue={fullName} placeholder="Dein Name" />
      </label>
      <label className="grid gap-2 text-sm">
        E-Mail
        <input value={email} disabled />
      </label>
      {state.message ? (
        <p className="rounded-lg border border-[var(--line)] bg-black/20 p-3 text-sm text-[var(--muted)]">
          {state.message}
        </p>
      ) : null}
      <Button variant="primary" disabled={isPending}>
        {isPending ? "Speichert..." : "Profil speichern"}
      </Button>
    </form>
  );
}
