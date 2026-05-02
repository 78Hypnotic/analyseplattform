"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { Check, Circle, RotateCcw, Save } from "lucide-react";
import { BodyFatVisualSelector } from "@/components/body-fat-visual-selector";
import { Button } from "@/components/button";
import { updateProfile, type ProfileActionState } from "./actions";

type Gender = "weiblich" | "maennlich" | "divers";
type BodyFatSex = "female" | "male";
type ProfileTab = "profile" | "privacy";
type ProfileVisibility = "private" | "public";

type ProfileFormProps = {
  email: string;
  fullName: string;
  city: string | null;
  age: number | null;
  gender: Gender | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  fitnessLevel: number | null;
  vo2max: number | null;
  vlamax: number | null;
  ftpRad: number | null;
  muscleMassKg: number | null;
  disciplines: string[];
  profileVisibility: ProfileVisibility;
};

const DISCIPLINE_OPTIONS = [
  "Schwimmen",
  "Laufen",
  "Radfahren",
  "Triathlon",
  "Open Water",
  "Crosstraining",
  "Krafttraining",
  "Yoga / Mobility",
] as const;

const DEFAULT_DISCIPLINES = ["Schwimmen", "Laufen", "Radfahren", "Triathlon"];

const FITNESS_LEVELS = [
  {
    value: 1,
    label: "Anfänger",
    description: "Erste strukturierte Schritte. Wir starten mit klaren Basis-Tests und sanften Bereichen.",
  },
  {
    value: 2,
    label: "Fortgeschritten",
    description: "Regelmäßiges Training, erste Wettkämpfe. Wir bauen auf solide aerobe Basis.",
  },
  {
    value: 3,
    label: "Mittelstufe",
    description: "Konstantes strukturiertes Training, regelmäßige Wettkämpfe in der Altersklasse.",
  },
  {
    value: 4,
    label: "Ambitioniert",
    description: "Mehrere Saisons strukturiertes Training, AK-Podiumsplätze, hohe Trainingsumfänge.",
  },
  {
    value: 5,
    label: "Master",
    description: "Elite-Niveau oder langjährige hochstrukturierte Trainingshistorie. Marginale Gains zählen.",
  },
] as const;

/**
 * Renders the editable athlete profile form with sectioned inputs and sticky save controls.
 */
export function ProfileForm({
  email,
  fullName,
  city,
  age,
  gender,
  heightCm,
  weightKg,
  bodyFatPercentage,
  fitnessLevel,
  vo2max,
  vlamax,
  ftpRad,
  muscleMassKg,
  disciplines,
  profileVisibility,
}: ProfileFormProps) {
  const initialName = splitName(fullName);
  const initialFitnessLevel = normalizeFitnessLevel(fitnessLevel);
  const initialVisualSex: BodyFatSex = gender === "maennlich" ? "male" : "female";
  const initialDisciplines = disciplines.length > 0 ? disciplines : DEFAULT_DISCIPLINES;
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(gender);
  const [selectedFitnessLevel, setSelectedFitnessLevel] = useState<number | null>(initialFitnessLevel);
  const [bodyFatValue, setBodyFatValue] = useState<number | null>(bodyFatPercentage);
  const [visualSex, setVisualSex] = useState<BodyFatSex>(initialVisualSex);
  const [selectedDisciplines, setSelectedDisciplines] = useState(() => new Set(initialDisciplines));
  const [selectedVisibility, setSelectedVisibility] = useState<ProfileVisibility>(profileVisibility);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [isSaveBarMounted, setIsSaveBarMounted] = useState(false);
  const [isSaveBarVisible, setIsSaveBarVisible] = useState(false);
  const [state, formAction, isPending] = useActionState<ProfileActionState, FormData>(submitProfile, {});
  const fullNameValue = `${firstName} ${lastName}`.trim();
  const resolvedFitnessLevel = selectedFitnessLevel ?? 3;
  const fitnessMeta = getFitnessMeta(selectedFitnessLevel);

  function markChanged() {
    setIsSaveBarMounted(true);
    window.requestAnimationFrame(() => setIsSaveBarVisible(true));
  }

  function clearChanges() {
    setIsSaveBarVisible(false);
  }

  function resetControlledFields() {
    setFirstName(initialName.firstName);
    setLastName(initialName.lastName);
    setSelectedGender(gender);
    setSelectedFitnessLevel(initialFitnessLevel);
    setBodyFatValue(bodyFatPercentage);
    setVisualSex(initialVisualSex);
    setSelectedDisciplines(new Set(initialDisciplines));
    setSelectedVisibility(profileVisibility);
    clearChanges();
  }

  function setSelectedGenderValue(nextGender: Gender | null) {
    setSelectedGender(nextGender);
    if (nextGender === "weiblich") setVisualSex("female");
    if (nextGender === "maennlich") setVisualSex("male");
    markChanged();
  }

  function setMeasuredBodyFat(nextValue: number | null) {
    setBodyFatValue(nextValue);
    markChanged();
  }

  function setVisualBodyFat(nextValue: number | null) {
    setBodyFatValue(nextValue);
    markChanged();
  }

  function toggleDiscipline(label: string) {
    setSelectedDisciplines((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
    markChanged();
  }

  async function submitProfile(previousState: ProfileActionState, formData: FormData) {
    const result = await updateProfile(previousState, formData);
    if (result.message === "Profil gespeichert.") {
      clearChanges();
    }
    return result;
  }

  return (
    <form
      id="profile-form"
      action={formAction}
      className="space-y-6 pb-4"
    >
      <input type="hidden" name="fullName" value={fullNameValue} />
      <input type="hidden" name="profileVisibility" value={selectedVisibility} />
      {[...selectedDisciplines].map((discipline) => (
        <input key={discipline} type="hidden" name="disciplines" value={discipline} />
      ))}

      <ProfileTabs activeTab={activeTab} onSelect={setActiveTab} />

      <div className={activeTab === "profile" ? "space-y-6" : "hidden"}>
      <ProfileSection title="Stammdaten" eyebrow="01 · Wer bist du" description="Wir nutzen Alter, Größe und Gewicht, um deine Tests im richtigen Kontext einzuordnen.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Vorname"
            value={firstName}
            onChange={(value) => {
              setFirstName(value);
              markChanged();
            }}
            placeholder="Vorname"
          />
          <TextField
            label="Nachname"
            value={lastName}
            onChange={(value) => {
              setLastName(value);
              markChanged();
            }}
            placeholder="Nachname"
          />
          <label className="grid gap-2 text-sm">
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">E-Mail</span>
            <input value={email} disabled className="w-full" />
          </label>
          <TextInput label="Stadt" name="city" defaultValue={city} placeholder="z. B. Hamburg" onDirty={markChanged} />
          <NumberField label="Alter" name="age" min={8} max={100} defaultValue={age} placeholder="z. B. 34" onDirty={markChanged} />
          <div className="grid gap-2 text-sm">
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
              Biologisches Geschlecht
            </span>
            <input type="hidden" name="gender" value={selectedGender ?? ""} />
            <div className="grid grid-cols-4 gap-1 rounded-lg border border-[var(--line)] bg-[var(--soft-bg)] p-1">
              <SegmentButton label="Weiblich" active={selectedGender === "weiblich"} onClick={() => setSelectedGenderValue("weiblich")} />
              <SegmentButton label="Männlich" active={selectedGender === "maennlich"} onClick={() => setSelectedGenderValue("maennlich")} />
              <SegmentButton label="Divers" active={selectedGender === "divers"} onClick={() => setSelectedGenderValue("divers")} />
              <SegmentButton label="Keine Angabe" active={selectedGender === null} onClick={() => setSelectedGenderValue(null)} />
            </div>
            <span className="text-xs text-[var(--subtle)]">Beeinflusst Normwerte für VO₂max, FTP und Pace-Bereiche.</span>
          </div>
          <NumberField label="Körpergröße" name="heightCm" min={100} max={230} defaultValue={heightCm} suffix="cm" placeholder="z. B. 172" onDirty={markChanged} />
          <NumberField label="Körpergewicht" name="weightKg" min={25} max={180} defaultValue={weightKg} suffix="kg" placeholder="z. B. 64" onDirty={markChanged} />
        </div>
      </ProfileSection>

      <DisciplinesSection selectedDisciplines={selectedDisciplines} onToggle={toggleDiscipline} />

      <ProfileSection title="Fitnessniveau" eyebrow="03 · Selbsteinschätzung" description="Wir gewichten Testergebnisse anhand deines Niveaus. Schiebe den Regler dorthin, wo du dich am ehesten siehst.">
        <input type="hidden" name="fitnessLevel" value={selectedFitnessLevel ?? ""} />
        <div className="grid gap-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">Aktuelles Niveau</p>
              <h3 className="display-serif mt-2 text-4xl text-[var(--foreground)]">{fitnessMeta.label}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{fitnessMeta.description}</p>
            </div>
            <div className="text-right">
              <p className="display-serif text-5xl text-[var(--accent)]">{selectedFitnessLevel ?? "-"}</p>
              <p className="mono text-xs text-[var(--muted)]">/ 5</p>
            </div>
          </div>
          <div className="grid gap-4">
            <VisualSlider
              ariaLabel="Fitnessniveau"
              min={1}
              max={5}
              step={1}
              value={resolvedFitnessLevel}
              onChange={(value) => {
                setSelectedFitnessLevel(value);
                markChanged();
              }}
            />
            <div className="grid grid-cols-5 gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--subtle)]">
              {FITNESS_LEVELS.map((item, index) => (
                <span key={item.value} className={index === 0 ? "text-left" : index === FITNESS_LEVELS.length - 1 ? "text-right" : "text-center"}>
                  {item.label}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="justify-self-start text-sm text-[var(--muted)] underline underline-offset-4 hover:text-[var(--foreground)]"
              onClick={() => {
                setSelectedFitnessLevel(null);
                markChanged();
              }}
            >
              Fitnesslevel zurücksetzen
            </button>
          </div>
        </div>
      </ProfileSection>

      <ProfileSection title="Leistungsmetriken" eyebrow="04 · Performance" description="Deine zentralen physiologischen Schwellenwerte. Wenn nicht gemessen, leer lassen - wir schätzen aus Tests.">
        <div className="grid gap-4 md:grid-cols-3">
          <NumberField
            label="VO₂max"
            name="vo2max"
            min={10}
            max={100}
            step="0.1"
            defaultValue={vo2max}
            suffix="ml/kg/min"
            placeholder="-"
            helper="Maximale aerobe Kapazität."
            onDirty={markChanged}
          />
          <NumberField
            label="VLamax"
            name="vlamax"
            min={0}
            max={2}
            step="0.01"
            defaultValue={vlamax}
            suffix="mmol/l/s"
            placeholder="-"
            helper="Maximale Laktatbildungsrate."
            onDirty={markChanged}
          />
          <NumberField
            label="FTP (Rad)"
            name="ftpRad"
            min={50}
            max={700}
            defaultValue={ftpRad}
            suffix="W"
            placeholder="-"
            helper="Funktionelle Schwellenleistung."
            onDirty={markChanged}
          />
        </div>
      </ProfileSection>

      <ProfileSection title="Körperzusammensetzung" eyebrow="05 · Körper" description="Hilft beim Schätzen der laktischen Kapazität und der relativen Leistung. Wenn du keinen gemessenen KFA hast, schätze visuell.">
        <div className="grid gap-4 md:grid-cols-2">
          <ControlledNumberField
            label="Körperfett - gemessen"
            name="bodyFatPercentage"
            min={3}
            max={60}
            step="0.1"
            value={bodyFatValue}
            onChange={setMeasuredBodyFat}
            suffix="%"
            placeholder="-"
            helper="Aus DXA, Caliper oder Bioimpedanz."
          />
          <NumberField
            label="Muskelmasse"
            name="muscleMassKg"
            min={10}
            max={120}
            step="0.1"
            defaultValue={muscleMassKg}
            suffix="kg"
            placeholder="-"
            helper="Optionaler Labor- oder Waagenwert."
            onDirty={markChanged}
          />
        </div>

        <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--soft-bg)] p-5">
          <div className="mb-6">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">Visuelle Schätzung</p>
              <h3 className="display-serif mt-3 text-3xl text-[var(--foreground)]">
                {bodyFatValue === null ? "Kein Messwert? Schätze visuell." : "KFA visuell feinjustieren."}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                Wähle das Geschlecht und ziehe den Regler, bis die Figur deinem Körper am nächsten kommt.
              </p>
            </div>
          </div>

          <BodyFatVisualSelector
            sex={visualSex}
            value={bodyFatValue}
            onSexChange={(nextSex) => {
              setVisualSex(nextSex);
              markChanged();
            }}
            onValueChange={setVisualBodyFat}
          />
          <p className="mt-4 text-xs text-[var(--subtle)]">
            Visuelle Schätzungen sind ungenauer als Messungen - wir kennzeichnen den Wert intern als geschätzt.
          </p>
        </div>
      </ProfileSection>
      </div>

      <div className={activeTab === "privacy" ? "space-y-6" : "hidden"}>
        <PrivacyPanel
          selectedVisibility={selectedVisibility}
          onSelect={(value) => {
            if (value === selectedVisibility) return;
            setSelectedVisibility(value);
            markChanged();
          }}
        />
      </div>

      {state.message ? (
        <p className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-3 text-sm text-[var(--muted)]">
          {state.message}
        </p>
      ) : null}

      <AnimatedSaveBar
        mounted={isSaveBarMounted}
        visible={isSaveBarVisible}
        isPending={isPending}
        canSave={Boolean(fullNameValue)}
        onReset={resetControlledFields}
        onExited={() => setIsSaveBarMounted(false)}
      />
    </form>
  );
}

function ProfileTabs({
  activeTab,
  onSelect,
}: {
  activeTab: ProfileTab;
  onSelect: (tab: ProfileTab) => void;
}) {
  const tabs: Array<{ id: ProfileTab; label: string }> = [
    { id: "profile", label: "Stammdaten" },
    { id: "privacy", label: "Privatsphäre" },
  ];

  return (
    <nav className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--panel)] p-1 text-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={
            activeTab === tab.id
              ? "rounded-lg bg-[var(--brand-bg)] px-4 py-2 text-[var(--brand-fg)]"
              : "px-4 py-2 text-[var(--muted)] transition hover:text-[var(--foreground)]"
          }
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function AnimatedSaveBar({
  mounted,
  visible,
  isPending,
  canSave,
  onReset,
  onExited,
}: {
  mounted: boolean;
  visible: boolean;
  isPending: boolean;
  canSave: boolean;
  onReset: () => void;
  onExited: () => void;
}) {
  if (!mounted) return null;

  return (
    <div
      aria-hidden={!visible}
      onTransitionEnd={(event) => {
        if (event.propertyName === "opacity" && !visible) onExited();
      }}
      className={
        "sticky bottom-4 z-20 rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_94%,black)] p-4 shadow-2xl shadow-[var(--shadow-color)] transition-all duration-200 ease-out " +
        (visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0")
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Circle size={10} className="fill-[var(--warn)] text-[var(--warn)]" />
          Ungespeicherte Änderungen
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="reset" variant="secondary" onClick={onReset} disabled={isPending}>
            <RotateCcw size={16} />
            Verwerfen
          </Button>
          <Button variant="primary" disabled={isPending || !canSave}>
            <Save size={16} />
            {isPending ? "Speichert..." : "Speichern"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DisciplinesSection({
  selectedDisciplines,
  onToggle,
}: {
  selectedDisciplines: Set<string>;
  onToggle: (discipline: string) => void;
}) {
  return (
    <ProfileSection title="Disziplinen" eyebrow="02 · Was du machst" description="Aktiviere alle Disziplinen, die du regelmäßig trainierst. Bestimmt, welche Analysen wir dir vorschlagen.">
      <div className="flex flex-wrap gap-2">
        {DISCIPLINE_OPTIONS.map((label) => {
          const active = selectedDisciplines.has(label);
          return (
            <button
              key={label}
              type="button"
              className={
                active
                  ? "inline-flex items-center gap-2 rounded-full border border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_14%,var(--panel))] px-4 py-2 text-sm text-[var(--foreground)]"
                  : "inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--soft-bg)] px-4 py-2 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
              }
              onClick={() => onToggle(label)}
            >
              {active ? <Check size={12} className="text-[var(--accent)]" /> : null}
              {label}
            </button>
          );
        })}
      </div>
    </ProfileSection>
  );
}

/**
 * Renders privacy controls from the standalone profile template without destructive account actions.
 */
function PrivacyPanel({
  selectedVisibility,
  onSelect,
}: {
  selectedVisibility: ProfileVisibility;
  onSelect: (visibility: ProfileVisibility) => void;
}) {
  const privacyOptions = [
    { value: "private", title: "Privat", text: "Nur du siehst deine Daten. Kein Teilen, keine Aggregation." },
    { value: "public", title: "Öffentliches Profil", text: "PRs und Saisonziel sind öffentlich sichtbar." },
  ];

  return (
    <ProfileSection title="Sichtbarkeit deiner Daten" eyebrow="06 · Privat" description="Du entscheidest, was wir tun dürfen. Standard ist nur für dich.">
      <div className="grid gap-3 md:grid-cols-2">
        {privacyOptions.map((option) => {
          const active = selectedVisibility === option.value;
          return (
            <button
              key={option.title}
              type="button"
              className={
                active
                  ? "rounded-lg border border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_12%,var(--panel))] p-4 text-left"
                  : "rounded-lg border border-[var(--line)] bg-[var(--soft-bg)] p-4 text-left hover:border-[var(--accent)]"
              }
              onClick={() => onSelect(option.value as ProfileVisibility)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium">{option.title}</span>
                <span className="flex size-6 items-center justify-center rounded-full border border-[var(--line)] text-xs text-[var(--accent)]">
                  {active ? "✓" : ""}
                </span>
              </span>
              <span className="mt-3 block text-sm leading-6 text-[var(--muted)]">{option.text}</span>
            </button>
          );
        })}
      </div>
    </ProfileSection>
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

function TextInput({
  label,
  name,
  defaultValue,
  placeholder,
  onDirty,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  placeholder?: string;
  onDirty?: () => void;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">{label}</span>
      <input name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="w-full" onChange={onDirty} />
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
  helper,
  onDirty,
}: {
  label: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number | null;
  suffix?: string;
  placeholder?: string;
  step?: string;
  helper?: string;
  onDirty?: () => void;
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
          className={suffix ? "w-full pr-24" : "w-full"}
          onChange={onDirty}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-[var(--subtle)]">
            {suffix}
          </span>
        ) : null}
      </span>
      {helper ? <span className="text-xs text-[var(--subtle)]">{helper}</span> : null}
    </label>
  );
}

function ControlledNumberField({
  label,
  name,
  min,
  max,
  value,
  onChange,
  suffix,
  placeholder,
  step,
  helper,
}: {
  label: string;
  name: string;
  min: number;
  max: number;
  value: number | null;
  onChange: (value: number | null) => void;
  suffix?: string;
  placeholder?: string;
  step?: string;
  helper?: string;
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
          value={value ?? ""}
          placeholder={placeholder}
          className={suffix ? "w-full pr-12" : "w-full"}
          onChange={(event) => onChange(parseOptionalNumber(event.target.value))}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-[var(--subtle)]">
            {suffix}
          </span>
        ) : null}
      </span>
      {helper ? <span className="text-xs text-[var(--subtle)]">{helper}</span> : null}
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
          ? "rounded-md bg-[var(--brand-bg)] px-3 py-2.5 text-sm text-[var(--brand-fg)]"
          : "rounded-md px-3 py-2.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      }
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function VisualSlider({
  ariaLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  ariaLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative h-8">
      <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--accent)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--brand-bg)] bg-[var(--panel-2)] shadow-lg shadow-[var(--shadow-color)]"
        style={{ left: `${progress}%` }}
      />
      <input
        aria-label={ariaLabel}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={(event) => onChange(Number(event.target.value))}
      />
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

function normalizeFitnessLevel(value: number | null) {
  if (!value) return null;
  if (value <= 5) return value;
  return Math.min(5, Math.max(1, Math.round(value / 2)));
}

function getFitnessMeta(value: number | null) {
  if (!value) {
    return {
      label: "Nicht eingeordnet",
      description: "Optional: Lege eine Selbsteinschätzung fest, wenn du dein aktuelles Trainingsgefühl einordnen möchtest.",
    };
  }
  return FITNESS_LEVELS.find((level) => level.value === value) ?? FITNESS_LEVELS[2];
}

function parseOptionalNumber(value: string) {
  return value === "" ? null : Number(value);
}
