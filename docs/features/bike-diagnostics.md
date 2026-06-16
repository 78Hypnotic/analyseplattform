# Rad-Diagnostik (metabolisches Simulationsmodell)

Eigenständiger Rad-Diagnostikbereich unter `/rad`, parallel zu Schwimmen und
Laufen. Basiert auf zwei Tests (20-s-Sprint + Rampentest) und simuliert einen
„metabolischen Fingerabdruck" — ausdrücklich **keine Labormessung** (Quelle:
`Briefing_Metabolisches_Modell_Bike_Diagnostik.docx`, v2.1).

## Testprotokoll

- **Sprint:** 20 s All-Out → `PeakP` (höchste Leistung), `Avg20s` (Schnitt 20 s).
- **Rampe:** +25 W alle 30 s bis Ausbelastung → letzte volle Stufe (W) +
  Zusatzsekunden in der nächsten Stufe.
- **Optional:** 12-min-Best-Effort (W) zur Plausibilitätsprüfung.

## Modell

| Schritt | Formel |
|---|---|
| PPO/MAP | `letzteStufe + (Zusatzsek / 30) × 25` |
| PVO₂ | `PPO × 0.875` |
| VO₂max abs / rel | `PVO₂ × 12` / `… / Gewicht` |
| Wgly | `Avg20s × 20 − PeakP × 4` |
| Pgly | `Wgly / 16` |
| Emet | `Wgly / 0.225` (Wirkungsgrad 22,5 %) |
| O₂eq | `Emet[kJ] / 20.9` |
| O₂eq_rel | `O₂eq × 1000 / Gewicht` |
| Laeq | `O₂eq_rel / 3` |
| VLamax-Proxy | `Laeq / 16` |
| FTP | `PVO₂ × Profilfaktor(VLamax)` |
| Fett/KH | `KH = FTP×3.82 × e^(−k×(FTP−P))`, `Fat = P×3.82 − KH` |
| FatMax | Leistung mit maximaler Fettverbrennung (Sweep 0…FTP) |

Profilfaktor und `k` stammen aus den VLamax-Lookup-Tabellen (linear
interpoliert, an den Rändern geclamped). Zonen: Coggan 7-Zonen-Modell (% FTP).

**Plausibilität:** FTP > 12-min-Leistung +10 % → Sprint überschätzt; FTP < 12-min
−10 % → Sprint unterschätzt. **Harter Fehler:** `Avg20s > PeakP`, `Wgly ≤ 0`,
VLamax-Proxy außerhalb [0.25, 0.90].

## Code

- Rechenkern: `src/lib/cycling/` (`types`, `constants`, `calculations`,
  `schema`, `validation`) + `calculations.test.ts`.
- Datenlayer: `src/lib/bike-analyses.ts` (`discipline='bike'`).
- Server-Actions: `src/app/rad/actions.ts`.
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
