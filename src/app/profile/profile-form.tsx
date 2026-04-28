"use client";

import { useActionState } from "react";
import { Button } from "@/components/button";
import { updateProfile, type ProfileActionState } from "./actions";

export function ProfileForm({
  email,
  fullName,
  age,
  gender,
  heightCm,
  weightKg,
  bodyFatPercentage,
}: {
  email: string;
  fullName: string;
  age: number | null;
  gender: "weiblich" | "maennlich" | "divers" | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyFatPercentage: number | null;
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
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Alter
          <input name="age" type="number" min={8} max={100} defaultValue={age ?? ""} placeholder="z. B. 34" />
        </label>
        <label className="grid gap-2 text-sm">
          Geschlecht
          <select name="gender" defaultValue={gender ?? ""}>
            <option value="">Nicht angegeben</option>
            <option value="weiblich">weiblich</option>
            <option value="maennlich">männlich</option>
            <option value="divers">divers</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Größe (cm)
          <input name="heightCm" type="number" min={100} max={230} defaultValue={heightCm ?? ""} placeholder="z. B. 172" />
        </label>
        <label className="grid gap-2 text-sm">
          Gewicht (kg)
          <input name="weightKg" type="number" min={25} max={180} defaultValue={weightKg ?? ""} placeholder="z. B. 63" />
        </label>
        <label className="grid gap-2 text-sm md:col-span-2">
          KFA (%)
          <input
            name="bodyFatPercentage"
            type="number"
            min={3}
            max={60}
            step="0.1"
            defaultValue={bodyFatPercentage ?? ""}
            placeholder="z. B. 21.5"
          />
        </label>
      </div>
      {state.message ? (
        <p className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-3 text-sm text-[var(--muted)]">
          {state.message}
        </p>
      ) : null}
      <Button variant="primary" disabled={isPending}>
        {isPending ? "Speichert..." : "Profil speichern"}
      </Button>
    </form>
  );
}
