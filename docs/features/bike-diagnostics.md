# Rad-Diagnostik (metabolisches Simulationsmodell)

Eigenständiger Rad-Diagnostikbereich unter `/rad`, parallel zu Schwimmen und
Laufen. Basiert auf zwei Tests (20-s-Sprint + 1-Minuten-Test) und simuliert einen
„metabolischen Fingerabdruck" — ausdrücklich **keine Labormessung** (Quelle:
`Briefing_Metabolisches_Modell_Bike_Diagnostik.docx`, v2.1, korrigiert durch
`Korrektur VLamax Bestimmung.docx`).

## Testprotokoll

Drei Wattwerte vom Powermeter:

- **Peak 1 s** → `PeakP` (höchste 1-Sekunden-Leistung).
- **20 s Ø** → `Avg20s` (Durchschnitt über den 20-s-All-Out).
- **1 min Ø** → beste 1-Minuten-Durchschnittsleistung, direkt als MAP/PPO.
- **Optional:** 12-min-Best-Effort (W) zur Plausibilitätsprüfung.

## Modell

| Schritt | Formel |
|---|---|
| PPO/MAP | `1-Minuten-Leistung` (direkt) |
| PVO₂ | `PPO × 0.875` |
| VO₂max abs / rel | `PVO₂ × 12` / `… / Gewicht` |
| Wgly | `Avg20s × 20 − PeakP × 4` |
| Pgly | `Wgly / 16` |
| Emet | `Wgly / 0.225` (Wirkungsgrad 22,5 %) |
| O₂eq | `Emet[kJ] / 20.9` |
| O₂eq_rel | `O₂eq × 1000 / Gewicht` |
| Laeq | `O₂eq_rel / 3` |
| Dominanz D | `Pgly / PVO₂` |
| VLamax-Proxy | lineare Zuordnung aus der D→VLamax-Tabelle |
| FTP | `PVO₂ × Profilfaktor(VLamax)` |
| Fett/KH | `KH = FTP×3.82 × e^(−k×(FTP−P))`, `Fat = P×3.82 − KH` |
| FatMax | Leistung mit maximaler Fettverbrennung (Sweep 0…FTP) |
| Laktat (Kurve) | `1.0 × e^(ln4 × P/FTP)` (Ruhe 1, Schwelle 4 mmol/l) |
| KH-Bedarf | `(P/0.225 × 3.6 × KH-Anteil) / 17.1` g/h |

Profilfaktor und `k` stammen aus den VLamax-Lookup-Tabellen (linear
interpoliert, an den Rändern geclamped). Zonen: Coggan 7-Zonen-Modell (% FTP).

Die VLamax-Zuordnung nutzt die folgenden Anker:

| D | 1,8 | 2,0 | 2,2 | 2,4 | 2,6 | 2,8 | 3,0 | 3,2 | 3,4 | 3,6 | 3,8 | 4,0 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| VLamax | 0,30 | 0,40 | 0,45 | 0,50 | 0,55 | 0,60 | 0,65 | 0,70 | 0,75 | 0,80 | 0,85 | 0,90 |

Zwischenwerte werden linear interpoliert. Außerhalb der Tabelle wird mit dem
jeweils äußeren Segment extrapoliert; Resultate außerhalb des kalibrierten
Bereichs `[0.25, 0.90]` werden abgelehnt. `Laeq` bleibt ein transparenter
Diagnosewert, fließt aber nicht mehr in die VLamax-Bestimmung ein. Neue
Resultate tragen die Modellversion `vlamax-dominance-v1`.

**Plausibilität:** FTP > 12-min-Leistung +10 % → Sprint überschätzt; FTP < 12-min
−10 % → Sprint unterschätzt. **Harter Fehler:** `Avg20s > PeakP`, `Wgly ≤ 0`,
VLamax-Proxy außerhalb [0.25, 0.90].

## Code

- Rechenkern: `src/lib/cycling/` (`types`, `constants`, `calculations`,
  `schema`, `validation`) + `calculations.test.ts`.
- Datenlayer: `src/lib/bike-analyses.ts` (`discipline='bike'`).
- Server-Actions: `src/app/rad/actions.ts`; Admin-Backfill unter
  `src/app/admin/methodik/`.
- UI: `src/app/rad/page.tsx`, `src/app/rad/new/`, `src/app/rad/[id]/page.tsx`,
  `src/components/cycling-report-view.tsx`.

## Datenmodell

Tabelle `analyses` mit `discipline='bike'` (Check erweitert auf
`swim`/`run`/`bike`). `profiles` trägt `latest_bike_analysis_id`,
`latest_bike_analyzed_at`, `latest_bike_ftp_watt`, `latest_bike_vo2max_rel`,
`latest_bike_vlamax_proxy`. Zusätzlich werden `ftp_rad`, `vo2max` und `vlamax`
im Profil **nur befüllt, wenn sie noch leer sind** (Auto-Vorschlag ohne
Überschreiben manueller Werte). Migration:
`supabase/migrations/20260615130000_bike_diagnostics.sql`.

Die Formelkorrektur benötigt keine Schemaänderung. Der idempotente Admin-
Backfill schreibt die neu berechneten JSONB-Resultate in Batches bis 50,
bewahrt den vorherigen Resultatsnapshot als `legacySnapshot` und kennzeichnet
nicht migrierbare Resultate als `legacy-laeq-v1`. Allgemeine Profilfelder
werden dabei nicht überschrieben; nur `latest_bike_*` wird nach Abschluss aus
der neuesten gültigen Analyse aufgebaut.
