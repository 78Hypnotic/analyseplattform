# Laufdiagnostik (Critical Speed / API / ACI)

Eigenständiger Lauf-Diagnostikbereich unter `/lauf`, parallel zur Schwimm-Analyse.
Basiert auf zwei Feldtests und liefert bewusst **keine** Laborwerte
(kein VO₂max, kein VLamax), sondern funktionelle Profilkennzahlen.

## Testprotokoll

- **3-Minuten-Test:** maximale Distanz (m) in 3 Minuten All-Out.
- **12-Minuten-Test (Cooper):** maximale Distanz (m) in 12 Minuten All-Out.

## Formeln

| Schritt | Formel | Einheit |
|---|---|---|
| v3 | `D3 / 180` | m/s |
| v12 | `D12 / 720` | m/s |
| Critical Speed (CS) | `(D12 − D3) / 540` | m/s |
| CS-Pace | `1000 / CS` | s/km |
| Endurance Ratio | `v12 / v3` | – |
| API | `1 + ((Ratio − 0.82) / (0.96 − 0.82)) × 9`, clamp [1,10], 1 NK | 1–10 |
| VO₂-Proxy | `CS + 0.65 × (v3 − CS)` | m/s |
| ACI | `1 + ((VO₂-Proxy − 3.00) / (5.20 − 3.00)) × 9`, clamp [1,10], 1 NK | 1–10 |

**Plausibilität (Hinweise, kein harter Fehler):** Ratio > 0.96 → 3-Min-Test
vermutlich nicht maximal; Ratio < 0.82 → 12-Min-Test vermutlich nicht maximal /
auffällig. **Harter Fehler:** D12 ≤ D3 bzw. Ratio ≥ 1 → kein belastbares Modell.

**API-Interpretation:** 1–2 stark anaerob · 3–4 anaerob · 5–6 ausgewogen ·
7–8 ausdauerstark · 9–10 extrem dieselig.

**2×2-Profilmatrix** (ACI hoch/niedrig × API hoch/niedrig, Schwelle 5.5):
großer/kleiner Motor × ausdauernd/anaerob geprägt.

**Trainingsbereiche (% von CS):** <70 % Z1 Rekom · 71–80 % Z2/GA1 ·
81–90 % Z3/GA2 · 91–100 % Z4/Schwelle · 101–106 % Z5/EB · 106–120 % Z6/SB.
Pace einer Zone: `secPerKm = 1000 / (CS × pct)`.

## Code

- Rechenkern (rein, deterministisch): `src/lib/running/` (`types.ts`,
  `constants.ts`, `calculations.ts`, `schema.ts`, `validation.ts`).
  Unit-Tests in `calculations.test.ts` mit den Briefing-Referenzwerten.
- Datenlayer: `src/lib/run-analyses.ts` (liest `analyses` mit `discipline='run'`).
- Server-Actions: `src/app/lauf/actions.ts` (`createRunAnalysis`,
  `deleteRunAnalysis`).
- UI: `src/app/lauf/page.tsx` (Liste), `src/app/lauf/new/` (Eingabe-Flow),
  `src/app/lauf/[id]/page.tsx` (Report), `src/components/running-report-view.tsx`.

## Datenmodell

Wiederverwendung der generischen Tabelle `analyses` mit neuem Diskriminator
`discipline` (`'swim'` Default | `'run'`). Schwimm-Queries filtern auf
`discipline='swim'`, Lauf-Queries auf `discipline='run'`.

`profiles` trägt eine Lauf-Zusammenfassung: `latest_run_analysis_id`,
`latest_run_analyzed_at`, `latest_run_cs_pace_sec`, `latest_run_api`,
`latest_run_aci` (analog zu `latest_swim_*`). Migration:
`supabase/migrations/20260615120000_run_diagnostics.sql`.

Row Level Security bleibt über `user_id` gültig; keine neuen Policies nötig.
