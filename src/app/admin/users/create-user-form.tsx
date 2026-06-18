"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/button";
import { createAdminUser, type CreateUserActionState } from "./actions";

const initialState: CreateUserActionState = {};

export function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(createAdminUser, initialState);

  return (
    <form action={formAction} className="surface grid gap-4 p-5 md:grid-cols-[1fr_1fr_1fr_auto]">
      <label className="grid gap-2 text-sm">
        Name
        <input required name="fullName" type="text" placeholder="Max Mustermann" maxLength={80} />
      </label>
      <label className="grid gap-2 text-sm">
        E-Mail
        <input required name="email" type="email" placeholder="name@example.com" />
      </label>
      <label className="grid gap-2 text-sm">
        Initialpasswort
        <input required name="password" type="password" minLength={10} maxLength={128} />
      </label>
      <div className="flex items-end">
        <Button type="submit" variant="primary" className="w-full" disabled={isPending}>
          <UserPlus size={16} />
          {isPending ? "Legt an..." : "Anlegen"}
        </Button>
      </div>
      {state.message ? (
        <p
          className={
            state.success
              ? "rounded-lg border border-[var(--accent)] bg-[var(--raised-bg)] p-3 text-sm text-[var(--accent)] md:col-span-4"
              : "rounded-lg border border-[var(--warn)] bg-[var(--raised-bg)] p-3 text-sm text-[var(--warn)] md:col-span-4"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
