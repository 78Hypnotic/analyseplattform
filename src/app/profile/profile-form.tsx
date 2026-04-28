"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { Circle, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/button";
import { updateProfile, type ProfileActionState } from "./actions";

type Gender = "weiblich" | "maennlich" | "divers";

type ProfileFormProps = {
  email: string;
  fullName: string;
  age: number | null;
  gender: Gender | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  fitnessLevel: number | null;
};

const FITNESS_LABELS = [
  { value: 1, label: "Anfänger" },
  { value: 4, label: "Fortgeschritten" },
  { value: 6, label: "Mittelstufe" },
  { value: 8, label: "Ambitioniert" },
  { value: 10, label: "Master" },
] as const;

const BODY_FAT_RANGES = [
  { label: "Athletisch", range: "10-16%" },
  { label: "Fit", range: "17-22%" },
  { label: "Normal", range: "23-28%" },
  { label: "Erhöht", range: "29-34%" },
  { label: "Hoch", range: "35%+" },
] as const;

/**
 * Renders the editable athlete profile form with sectioned inputs and sticky save controls.
 */
export function ProfileForm({
  email,
  fullName,
  age,
  gender,
  heightCm,
  weightKg,
  bodyFatPercentage,
  fitnessLevel,
}: ProfileFormProps) {
  const initialName = splitName(fullName);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(gender);
  const [selectedFitnessLevel, setSelectedFitnessLevel] = useState<number | null>(fitnessLevel);
  const [hasChanges, setHasChanges] = useState(false);
  const [state, formAction, isPending] = useActionState<ProfileActionState, FormData>(submitProfile, {});
  const resolvedFitnessLevel = selectedFitnessLevel ?? 5;
  const fitnessLabel = getFitnessLabel(selectedFitnessLevel);
  const bodyFatStatus = getBodyFatStatus(bodyFatPercentage);
  const bodyFatSliderValue = Math.min(40, Math.max(10, bodyFatPercentage ?? 22));
  const fullNameValue = `${firstName} ${lastName}`.trim();

  function resetControlledFields() {
    setFirstName(initialName.firstName);
    setLastName(initialName.lastName);
    setSelectedGender(gender);
    setSelectedFitnessLevel(fitnessLevel);
    setHasChanges(false);
  }

  function setSelectedGenderValue(nextGender: Gender | null) {
    setSelectedGender(nextGender);
    setHasChanges(true);
  }

  async function submitProfile(previousState: ProfileActionState, formData: FormData) {
    const result = await updateProfile(previousState, formData);
    if (result.message === "Profil gespeichert.") {
      setHasChanges(false);
    }
    return result;
  }

  return (
    <form
      id="profile-form"
      action={formAction}
      className="space-y-6 pb-4"
      onChange={() => setHasChanges(true)}
    >
      <input type="hidden" name="fullName" value={fullNameValue} />

      <ProfileSection title="Stammdaten" eyebrow="01 · Wer bist du" description="Wir nutzen Alter, Größe und Gewicht, um deine Tests im richtigen Kontext einzuordnen.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Vorname"
            value={firstName}
            onChange={(value) => {
              setFirstName(value);
              setHasChanges(true);
            }}
            placeholder="Vorname"
          />
          <TextField
            label="Nachname"
            value={lastName}
            onChange={(value) => {
              setLastName(value);
              setHasChanges(true);
            }}
            placeholder="Nachname"
          />
          <label className="grid gap-2 text-sm">
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">E-Mail</span>
            <input value={email} disabled className="w-full" />
          </label>
          <NumberField label="Alter" name="age" min={8} max={100} defaultValue={age} placeholder="z. B. 34" />
          <div className="grid gap-2 text-sm md:col-span-2">
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
              Biologisches Geschlecht
            </span>
            <input type="hidden" name="gender" value={selectedGender ?? ""} />
            <div className="grid overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--soft-bg)] sm:grid-cols-4">
              <SegmentButton label="Weiblich" active={selectedGender === "weiblich"} onClick={() => setSelectedGenderValue("weiblich")} />
              <SegmentButton label="Männlich" active={selectedGender === "maennlich"} onClick={() => setSelectedGenderValue("maennlich")} />
              <SegmentButton label="Divers" active={selectedGender === "divers"} onClick={() => setSelectedGenderValue("divers")} />
              <SegmentButton label="Keine Angabe" active={selectedGender === null} onClick={() => setSelectedGenderValue(null)} />
            </div>
            <span className="text-xs text-[var(--subtle)]">Beeinflusst Normwerte für Test- und Pace-Bereiche.</span>
          </div>
          <NumberField label="Körpergröße" name="heightCm" min={100} max={230} defaultValue={heightCm} suffix="cm" placeholder="z. B. 172" />
          <NumberField label="Körpergewicht" name="weightKg" min={25} max={180} defaultValue={weightKg} suffix="kg" placeholder="z. B. 64" />
        </div>
      </ProfileSection>

      <ProfileSection title="Fitnessniveau" eyebrow="02 · Selbsteinschätzung" description="Schiebe den Regler dorthin, wo du dich aktuell am ehesten siehst.">
        <input type="hidden" name="fitnessLevel" value={selectedFitnessLevel ?? ""} />
        <div className="grid gap-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">Aktuelles Niveau</p>
              <h3 className="display-serif mt-2 text-4xl text-[var(--foreground)]">{fitnessLabel}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                {getFitnessDescription(selectedFitnessLevel)}
              </p>
            </div>
            <div className="text-right">
              <p className="display-serif text-5xl text-[var(--accent)]">{selectedFitnessLevel ?? "-"}</p>
              <p className="mono text-xs text-[var(--muted)]">/ 10</p>
            </div>
          </div>
          <div className="grid gap-3">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={resolvedFitnessLevel}
              className="w-full accent-[var(--accent)]"
              onChange={(event) => {
                setSelectedFitnessLevel(Number(event.target.value));
                setHasChanges(true);
              }}
            />
            <div className="grid grid-cols-5 gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--subtle)]">
              {FITNESS_LABELS.map((item) => (
                <span key={item.value} className={item.value === 10 ? "text-right" : item.value > 4 ? "text-center" : ""}>
                  {item.label}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="justify-self-start text-sm text-[var(--muted)] underline underline-offset-4 hover:text-[var(--foreground)]"
              onClick={() => {
                setSelectedFitnessLevel(null);
                setHasChanges(true);
              }}
            >
              Fitnesslevel zurücksetzen
            </button>
          </div>
        </div>
      </ProfileSection>

      <ProfileSection title="Körperzusammensetzung" eyebrow="03 · Körper" description="Hilft beim Schätzen der relativen Leistung. Wenn du keinen gemessenen KFA hast, schätze visuell.">
        <div className="grid gap-4 md:grid-cols-2">
          <NumberField
            label="Körperfett"
            name="bodyFatPercentage"
            min={3}
            max={60}
            step="0.1"
            defaultValue={bodyFatPercentage}
            suffix="%"
            placeholder="-"
          />
          <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
            <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">Visuelle Einschätzung</p>
            <p className="display-serif mt-3 text-3xl text-[var(--foreground)]">
              {bodyFatPercentage ? `${bodyFatPercentage.toFixed(1)}%` : "Kein Messwert"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {bodyFatPercentage
                ? `Aktuell eingeordnet als ${bodyFatStatus.toLowerCase()}.`
                : "Trage einen KFA-Wert ein, wenn du einen Messwert oder eine solide Schätzung hast."}
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          {BODY_FAT_RANGES.map((item) => (
            <div
              key={item.label}
              className={
                item.label === bodyFatStatus
                  ? "rounded-lg border border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_12%,var(--panel))] p-4 text-center"
                  : "rounded-lg border border-[var(--line)] bg-[var(--soft-bg)] p-4 text-center"
              }
            >
              <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">{item.label}</p>
              <p className="display-serif mt-3 text-xl">{item.range}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-2">
          <input
            type="range"
            min={10}
            max={40}
            value={bodyFatSliderValue}
            readOnly
            className="w-full accent-[var(--accent)]"
          />
          <div className="grid grid-cols-5 gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--subtle)]">
            {BODY_FAT_RANGES.map((item) => (
              <span key={item.label} className="text-center">{item.label}</span>
            ))}
          </div>
        </div>
      </ProfileSection>

      <ProfileSection title="Leistungsmetriken" eyebrow="00 · Performance" description="Deine zentralen Schwellenwerte entstehen aus deinen gespeicherten Analysen. Manuelle Laborwerte lassen wir hier bewusst leer.">
        <div className="grid gap-4 md:grid-cols-3">
          <ReadOnlyMetric label="VO2max" value="-" unit="ml/kg/min" text="Maximale aerobe Kapazität." />
          <ReadOnlyMetric label="VLamax" value="-" unit="mmol/l/s" text="Maximale Laktatbildungsrate." />
          <ReadOnlyMetric label="CSS" value="aus Analyse" unit="/100 m" text="Schwellenpace aus deinem Test." />
        </div>
      </ProfileSection>

      {state.message ? (
        <p className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-3 text-sm text-[var(--muted)]">
          {state.message}
        </p>
      ) : null}

      <div className="sticky bottom-4 z-20 rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_94%,black)] p-4 shadow-2xl shadow-[var(--shadow-color)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Circle size={10} className={hasChanges ? "fill-[var(--warn)] text-[var(--warn)]" : "fill-[var(--accent)] text-[var(--accent)]"} />
            {hasChanges ? "Ungespeicherte Änderungen" : "Profil ist gespeichert"}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="reset" variant="secondary" onClick={resetControlledFields} disabled={isPending}>
              <RotateCcw size={16} />
              Verwerfen
            </Button>
            <Button variant="primary" disabled={isPending || !fullNameValue}>
              <Save size={16} />
              {isPending ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function ProfileSection({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="surface p-6 sm:p-7">
      <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row">
        <div>
          <h2 className="display-serif text-3xl text-[var(--foreground)]">{title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">{description}</p>
        </div>
        <p className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--subtle)]">{eyebrow}</p>
      </div>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="w-full" />
    </label>
  );
}

function NumberField({
  label,
  name,
  min,
  max,
  defaultValue,
  suffix,
  placeholder,
  step,
}: {
  label: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number | null;
  suffix?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">{label}</span>
      <span className="relative block">
        <input
          name={name}
          type="number"
          min={min}
          max={max}
          step={step}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          className={suffix ? "w-full pr-12" : "w-full"}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-[var(--subtle)]">
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function SegmentButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={
        active
          ? "bg-[var(--brand-bg)] px-3 py-3 text-sm text-[var(--brand-fg)]"
          : "px-3 py-3 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      }
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ReadOnlyMetric({
  label,
  value,
  unit,
  text,
}: {
  label: string;
  value: string;
  unit: string;
  text: string;
}) {
  return (
    <div>
      <p className="mono mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">{label}</p>
      <div className="flex h-11 items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--soft-bg)] px-4">
        <span>{value}</span>
        <span className="mono text-[10px] text-[var(--subtle)]">{unit}</span>
      </div>
      <p className="mt-2 text-xs text-[var(--subtle)]">{text}</p>
    </div>
  );
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: fullName.trim(), lastName: "" };
  }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? "",
  };
}

function getFitnessLabel(value: number | null) {
  if (!value) return "Nicht eingeordnet";
  if (value <= 2) return "Anfänger";
  if (value <= 4) return "Fortgeschritten";
  if (value <= 6) return "Mittelstufe";
  if (value <= 8) return "Ambitioniert";
  return "Master";
}

function getFitnessDescription(value: number | null) {
  if (!value) return "Optional: Lege eine Selbsteinschätzung fest, wenn du dein aktuelles Trainingsgefühl einordnen möchtest.";
  if (value <= 2) return "Erste strukturierte Schritte. Wir starten mit klaren Basis-Tests und sanften Bereichen.";
  if (value <= 4) return "Regelmäßiges Training, solide Grundlagen und erste gezielte Belastungssteuerung.";
  if (value <= 6) return "Stabiler Trainingsrhythmus mit kontrollierten Intensitäten und klaren Zielen.";
  if (value <= 8) return "Ambitioniertes Training mit höherer Belastbarkeit und stärkerer Wettkampforientierung.";
  return "Sehr hohe Trainingsroutine mit präziser Steuerung und starker Leistungsorientierung.";
}

function getBodyFatStatus(value: number | null) {
  if (!value) return "Fit";
  if (value <= 16) return "Athletisch";
  if (value <= 22) return "Fit";
  if (value <= 28) return "Normal";
  if (value <= 34) return "Erhöht";
  return "Hoch";
}
