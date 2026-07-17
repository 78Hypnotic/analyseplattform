"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/button";
import { createCoachAthlete, type CoachActionState } from "./actions";

const initialState: CoachActionState = {};

export function CreateCoachAthleteForm() {
  const [state, formAction, isPending] = useActionState(createCoachAthlete, initialState);

  return (
    <form action={formAction} className="surface grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto]">
      <label className="grid gap-2 text-sm">
        Name
        <input required name="fullName" type="text" maxLength={80} placeholder="Max Mustermann" />
      </label>
      <label className="grid gap-2 text-sm">
        E-Mail
        <input required name="email" type="email" placeholder="name@example.com" />
      </label>
      <div className="flex items-end">
        <Button type="submit" variant="primary" className="w-full" disabled={isPending}>
          <UserPlus size={16} />
          {isPending ? "Sendet..." : "Athlet einladen"}
        </Button>
      </div>
      {state.message ? (
        <p
          className={
            state.success
              ? "rounded-lg border border-[var(--accent)] p-3 text-sm text-[var(--accent)] md:col-span-3"
              : "rounded-lg border border-[var(--warn)] p-3 text-sm text-[var(--warn)] md:col-span-3"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
