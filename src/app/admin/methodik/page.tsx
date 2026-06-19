import type { ReactNode } from "react";
import { BookOpen, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { requireAdmin } from "@/lib/auth/roles";
import { SWIM_REFERENCE_AGES, SWIM_REFERENCES } from "@/lib/analysis/constants";
import {
  ACI_INTERPRETATION,
  ACI_VO2_MAX,
  ACI_VO2_MIN,
  API_INTERPRETATION,
  API_RATIO_MAX,
  API_RATIO_MIN,
  MATRIX_HIGH_THRESHOLD,
  RUN_TRAINING_ZONES,
  VO2_PROXY_FACTOR,
} from "@/lib/running/constants";
import {
  BIKE_ZONES,
  ENERGY_PER_WATT,
  K_FACTOR_TABLE,
  KJ_PER_LITER_O2,
  MECH_EFFICIENCY,
  METABOLIC_BANDS,
  O2_PER_LACTATE,
  O2_PER_WATT,
  PROFILE_FACTOR_TABLE,
  PVO2_FACTOR,
  VLAMAX_MAX,
  VLAMAX_MIN,
} from "@/lib/cycling/constants";

export const dynamic = "force-dynamic";

export default async function MethodikPage() {
  await requireAdmin();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <p className="mono inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          <ShieldCheck size={14} />
          Admin · Methodik
        </p>
        <div className="mt-5">
          <h1 className="display-serif text-5xl leading-tight text-[var(--foreground)]">
            Formeln &amp; Skalen.
          </h1>
          <p className="muted mt-4 max-w-3xl leading-7">
            Vollständige Dokumentation aller Berechnungen, Skalen und Schwellen, die in der Plattform
            abgebildet sind. Die Tabellen und Konstanten auf dieser Seite werden direkt aus dem
            produktiven Code gelesen — sie sind also immer synchron mit der Implementierung. Formeln
            sind mit ihrer Quelldatei referenziert.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">
            <BookOpen size={16} className="text-[var(--accent)]" />
            Zum Teilen mit Trainings-/Methodik-Partnern gedacht.
          </div>
        </div>

        <SwimSection />
        <RunSection />
        <BikeSection />

        <section className="surface mt-8 p-5">
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Wichtiger Hinweis</p>
          <p className="muted mt-3 leading-7">
            Alle physiologischen Werte (VO₂max, VLamax, CSS, CS, FTP, FatMax) sind reproduzierbare
            Schätz- bzw. Proxy-Werte aus Feldtests. Es handelt sich ausdrücklich nicht um Labormessungen.
            Sie dienen der Trainingssteuerung, Profilierung und dem Vergleich von Retests.
          </p>
        </section>
      </main>
    </>
  );
}

// --- Swimming --------------------------------------------------------------
function SwimSection() {
  return (
    <DisciplineSection title="Schwimmen" file="src/lib/analysis/calculations.ts">
      <Block title="Eingaben & Grundwerte">
        <Formula formula="pace = (Zeit / Distanz) × 100" desc="Pace pro 100 m (s). Distanz in {50, 200, 400}." />
        <Formula formula="DPS = Beckenlänge / Züge pro Bahn" desc="Distance per Stroke (m je Armzug)." />
        <Formula formula="SR = (Züge pro Bahn / Zeit pro Bahn) × 60" desc="Stroke Rate (Züge/min)." />
      </Block>

      <Block title="Critical Swim Speed (CSS)">
        <Formula formula="CSS [m/s] = 200 / (t400 − t200)" desc="Schwellengeschwindigkeit aus 200- und 400-m-Zeit." />
        <Formula formula="CSS-Pace [s/100m] = (t400 − t200) / 2" desc="Schwellenpace pro 100 m. Voraussetzung: t400 > t200." />
      </Block>

      <Block title="VO₂- & VLa-Proxy (qualitativ)">
        <Formula formula="VO₂-Abweichung = (t200 − Referenz200) / Referenz200" desc="≤ 8 % → hoch · ≤ 20 % → mittel · sonst niedrig." />
        <Formula formula="VLa-Drop = (pace400 − pace200) / pace200" desc="Profil je nach Leistungsband: Diesel / Allrounder / Sprinter (Schwellen 0,04–0,12)." />
        <Formula formula="Sprint-Reserve = (CSS-Pace − pace50) / CSS-Pace" desc="< 0,10 niedrig · ≤ 0,20 mittel · > 0,20 hoch." />
      </Block>

      <Block title="Technik-Gate">
        <p className="muted text-sm leading-6">
          Steuert, ob eine physiologische Auswertung belastbar ist. Rot: keine 400 m am Stück,
          Hilfsmittel benutzt oder 400-m-Pace &gt; 2:00 min/100 m. Gelb: Pace 1:50–2:00. Grün: Pace
          schneller als 1:50. Bei Rot wird nur ein Technik-Report erzeugt.
        </p>
      </Block>

      <Block title="Alters-/Geschlechts-Referenzen (Sekunden)">
        <p className="muted mb-3 text-sm leading-6">
          Referenzzeiten je Altersgruppe; der Referenz-Index = (Wert − Referenz) / Referenz ordnet die
          Leistung ein (Quelle: <Code>src/lib/analysis/constants.ts</Code>).
        </p>
        <SwimReferenceTable />
      </Block>
    </DisciplineSection>
  );
}

function SwimReferenceTable() {
  const rows: Array<{ key: string; label: string; values: readonly number[] }> = [
    { key: "m50", label: "♂ 50 m", values: SWIM_REFERENCES.maennlich[50] },
    { key: "m200", label: "♂ 200 m", values: SWIM_REFERENCES.maennlich[200] },
    { key: "m400", label: "♂ 400 m", values: SWIM_REFERENCES.maennlich[400] },
    { key: "w50", label: "♀ 50 m", values: SWIM_REFERENCES.weiblich[50] },
    { key: "w200", label: "♀ 200 m", values: SWIM_REFERENCES.weiblich[200] },
    { key: "w400", label: "♀ 400 m", values: SWIM_REFERENCES.weiblich[400] },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--line)]">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--raised-bg)] text-left">
            <th className="mono px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">Distanz</th>
            {SWIM_REFERENCE_AGES.map((age) => (
              <th key={age} className="mono px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{age}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-[var(--line)]">
              <td className="px-3 py-2 font-medium">{row.label}</td>
              {row.values.map((value, index) => (
                <td key={index} className="px-3 py-2 text-[var(--muted)]">{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Running ---------------------------------------------------------------
function RunSection() {
  return (
    <DisciplineSection title="Laufen" file="src/lib/running/calculations.ts">
      <Block title="Tests & Geschwindigkeiten">
        <Formula formula="v3 [m/s] = Distanz₃ₘᵢₙ / 180" desc="Durchschnittsgeschwindigkeit des 3-Minuten-All-Out." />
        <Formula formula="v12 [m/s] = Distanz₁₂ₘᵢₙ / 720" desc="Durchschnittsgeschwindigkeit des 12-Minuten-Tests (Cooper)." />
      </Block>

      <Block title="Critical Speed (CS)">
        <Formula formula="CS [m/s] = (D12 − D3) / 540" desc="Höchste dauerhaft stabile Laufgeschwindigkeit." />
        <Formula formula="CS-Pace [s/km] = 1000 / CS" desc="Ausgegeben als min:ss pro km." />
      </Block>

      <Block title="Anaerobic Profile Index (API, 1–10)">
        <Formula formula="Ratio = v12 / v3" desc={`Normierungsfenster ${API_RATIO_MIN}–${API_RATIO_MAX}. Ratio > ${API_RATIO_MAX} → 3-Min nicht maximal; < ${API_RATIO_MIN} → 12-Min nicht maximal.`} />
        <Formula formula={`API = 1 + ((Ratio − ${API_RATIO_MIN}) / (${API_RATIO_MAX} − ${API_RATIO_MIN})) × 9`} desc="Geklammert auf 1–10, eine Nachkommastelle." />
        <BandTable bands={API_INTERPRETATION.map((b) => ({ range: bandRange(API_INTERPRETATION, b), label: b.label }))} />
      </Block>

      <Block title="Aerobic Capacity Index (ACI, 1–10)">
        <Formula formula={`VO₂-Proxy [m/s] = CS + ${VO2_PROXY_FACTOR} × (v3 − CS)`} desc="Heuristische Geschwindigkeit zwischen CS und 3-Min-Tempo. Kein VO₂max." />
        <Formula formula={`ACI = 1 + ((VO₂-Proxy − ${ACI_VO2_MIN}) / (${ACI_VO2_MAX} − ${ACI_VO2_MIN})) × 9`} desc={`Arbeitsbereich ${ACI_VO2_MIN}–${ACI_VO2_MAX} m/s, geklammert auf 1–10.`} />
        <BandTable bands={ACI_INTERPRETATION.map((b) => ({ range: bandRange(ACI_INTERPRETATION, b), label: b.label }))} />
      </Block>

      <Block title="Profilmatrix">
        <p className="muted text-sm leading-6">
          2×2-Matrix aus API und ACI; Schwelle „hoch“ ab einem Score von <Code>{MATRIX_HIGH_THRESHOLD}</Code>.
          Kombinationen: großer/kleiner Motor × ausdauernd/anaerob geprägt.
        </p>
      </Block>

      <Block title="Trainingsbereiche (% der CS)">
        <ZoneTable
          rows={RUN_TRAINING_ZONES.map((z) => ({
            label: `${z.short} · ${z.label}`,
            range: `${Math.round(z.minPct * 100)}–${Math.round(z.maxPct * 100)} %`,
          }))}
          unit="Pace = 1000 / (CS × %)"
        />
      </Block>
    </DisciplineSection>
  );
}

// --- Cycling ---------------------------------------------------------------
function BikeSection() {
  return (
    <DisciplineSection title="Radfahren" file="src/lib/cycling/calculations.ts">
      <Block title="1-Minuten-Leistung → aerobe Leistung">
        <Formula formula="PPO/MAP [W] = beste 1-Minuten-Durchschnittsleistung" desc="Direkt eingegeben (beste angenäherte 1-min-Leistung)." />
        <Formula formula={`PVO₂ [W] = PPO × ${PVO2_FACTOR}`} desc="Leistung bei VO₂max (pauschaler Korrekturfaktor)." />
        <Formula formula={`VO₂max abs [ml/min] = PVO₂ × ${O2_PER_WATT}`} desc={`relativ = … / Gewicht. Annahme: 1 W ≈ ${O2_PER_WATT} ml O₂/min.`} />
      </Block>

      <Block title="Sprinttest → VLamax-Proxy">
        <Formula formula="Wgly [J] = (Ø20s × 20) − (Peak × 4)" desc="Glykolytische mechanische Arbeit (alaktazider Anteil der ersten 4 s abgezogen)." />
        <Formula formula={`Emet [kJ] = Wgly / ${MECH_EFFICIENCY} / 1000`} desc={`Metabolische Energie bei ${Math.round(MECH_EFFICIENCY * 100)} % Wirkungsgrad.`} />
        <Formula formula={`O₂eq [L] = Emet / ${KJ_PER_LITER_O2}`} desc={`1 L O₂ ≈ ${KJ_PER_LITER_O2} kJ. Relativ = O₂eq × 1000 / Gewicht.`} />
        <Formula formula={`Laeq [mmol/l] = O₂eq_rel / ${O2_PER_LACTATE}`} desc={`1 mmol/l Laktat ≈ ${O2_PER_LACTATE} ml/kg O₂-Äquivalent.`} />
        <Formula formula="VLamax-Proxy [mmol/l/s] = Laeq / 16" desc={`Plausibler Bereich ${VLAMAX_MIN}–${VLAMAX_MAX}; außerhalb → kein belastbares Profil.`} />
      </Block>

      <Block title="Schwelle / FTP">
        <Formula formula="FTP [W] = PVO₂ × Profilfaktor(VLamax)" desc="Profilfaktor aus untenstehender Tabelle (linear interpoliert)." />
        <LookupTable title="VLamax → Profilfaktor (Schwelle/PVO₂)" rows={PROFILE_FACTOR_TABLE} />
      </Block>

      <Block title="Fettstoffwechsel & FatMax">
        <Formula formula={`Gesamtenergie(P) = P × ${ENERGY_PER_WATT}`} desc="Relativer Energiebedarf pro Leistung P." />
        <Formula formula="KH(P) = (FTP × 3,82) × e^(−k × (FTP − P))" desc="Kohlenhydrat-Energie; k aus untenstehender Tabelle." />
        <Formula formula="Fat(P) = Gesamtenergie(P) − KH(P)" desc="FatMax = Leistung P mit maximaler Fettverbrennung (Sweep 0…FTP)." />
        <LookupTable title="VLamax → k-Faktor" rows={K_FACTOR_TABLE} />
      </Block>

      <Block title="Laktat-Modell (für die Kurve)">
        <Formula formula="Laktat(P) [mmol/l] = 1,0 × e^(ln(4) × (P / FTP))" desc="FTP-verankertes Modell: 1,0 mmol/l in Ruhe, 4,0 mmol/l an der Schwelle (P = FTP)." />
      </Block>

      <Block title="Kohlenhydrat-Rechner">
        <Formula formula="KH-Anteil(P) = KH(P) / Gesamtenergie(P)" desc="Anteil der Kohlenhydrate an der Energiebereitstellung bei Leistung P." />
        <Formula formula="metabol. kJ/h = (P / 0,225) × 3,6" desc="Stoffwechsel-Energieumsatz pro Stunde bei Leistung P." />
        <Formula formula="KH [g/h] = (metabol. kJ/h × KH-Anteil) / 17,1" desc="1 g Kohlenhydrate ≈ 17,1 kJ; Fett ≈ 37,7 kJ/g." />
      </Block>

      <Block title="Metabolisches Profil (aus VLamax-Proxy)">
        <BandTable bands={METABOLIC_BANDS.map((b) => ({ range: metabolicRange(b), label: b.label }))} />
      </Block>

      <Block title="Trainingsbereiche (Coggan, % der FTP)">
        <ZoneTable
          rows={BIKE_ZONES.map((z) => ({
            label: `${z.short} · ${z.label}`,
            range: z.maxPct === null
              ? `> ${Math.round(z.minPct * 100)} %`
              : `${Math.round(z.minPct * 100)}–${Math.round(z.maxPct * 100)} %`,
          }))}
          unit="Watt = FTP × %"
        />
      </Block>
    </DisciplineSection>
  );
}

// --- Shared building blocks ------------------------------------------------
function DisciplineSection({ title, file, children }: { title: string; file: string; children: ReactNode }) {
  return (
    <section className="surface mt-8 p-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
        <h2 className="text-3xl font-semibold">{title}</h2>
        <Code>{file}</Code>
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-[var(--line)] pt-5">
      <p className="mono mb-3 text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Formula({ formula, desc }: { formula: string; desc: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
      <p className="mono text-sm text-[var(--foreground)]">{formula}</p>
      <p className="muted mt-2 text-sm leading-6">{desc}</p>
    </div>
  );
}

function BandTable({ bands }: { bands: Array<{ range: string; label: string }> }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)]">
      {bands.map((band) => (
        <div key={band.label} className="grid grid-cols-[110px_1fr] gap-2 border-b border-[var(--line)] px-4 py-2 text-sm last:border-b-0">
          <span className="mono text-[var(--accent)]">{band.range}</span>
          <span>{band.label}</span>
        </div>
      ))}
    </div>
  );
}

function ZoneTable({ rows, unit }: { rows: Array<{ label: string; range: string }>; unit: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)]">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[1fr_auto] gap-2 border-b border-[var(--line)] px-4 py-2 text-sm last:border-b-0">
          <span>{row.label}</span>
          <span className="mono text-[var(--accent)]">{row.range}</span>
        </div>
      ))}
      <p className="mono px-4 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{unit}</p>
    </div>
  );
}

function LookupTable({ title, rows }: { title: string; rows: ReadonlyArray<{ vlamax: number; value: number }> }) {
  return (
    <div className="rounded-lg border border-[var(--line)] p-4">
      <p className="mono mb-3 text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {rows.map((row) => (
          <span key={row.vlamax} className="rounded border border-[var(--line)] bg-[var(--raised-bg)] px-2 py-1 text-xs">
            <span className="text-[var(--muted)]">{row.vlamax.toFixed(2)}</span>
            <span className="mx-1 text-[var(--subtle)]">→</span>
            <span className="font-medium text-[var(--accent)]">{row.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mono rounded bg-[var(--raised-bg)] px-2 py-1 text-xs text-[var(--muted)]">{children}</code>
  );
}

function bandRange(
  bands: ReadonlyArray<{ max: number }>,
  band: { max: number },
): string {
  const index = bands.indexOf(band as (typeof bands)[number]);
  const min = index === 0 ? 1 : bands[index - 1].max + 1;
  return `${min}–${band.max}`;
}

function metabolicRange(band: { max: number }): string {
  const index = METABOLIC_BANDS.findIndex((b) => b.max === band.max);
  const min = index === 0 ? VLAMAX_MIN : METABOLIC_BANDS[index - 1].max;
  if (!Number.isFinite(band.max)) return `> ${min.toFixed(2)}`;
  return `${min.toFixed(2)}–${band.max.toFixed(2)}`;
}
