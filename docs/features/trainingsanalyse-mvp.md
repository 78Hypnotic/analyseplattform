# Trainingsanalyse MVP

Der MVP migriert den bestehenden statischen Prototyp in eine Next.js-App mit Supabase Auth und gespeicherten Analysen.

## Umfang

- E-Mail Magic Link Login
- Neuer Analyseflow für Schwimmen
- Speicherung von Eingaben und Analyseergebnissen in Supabase
- Dashboard mit den letzten Analysen
- Detailreport pro Analyse

## Datenmodell

Supabase nutzt `profiles` für User-Basisdaten und `analyses` für gespeicherte Analyse-Reports. Row Level Security ist aktiv; Nutzer dürfen nur eigene Datensätze lesen und schreiben.

## Sicherheit

- Keine Secrets im Repository
- Zod-Validierung für Analyse-Input
- Rate Limiting für Login und Analyse-Erstellung
- Auth-Pruefung in Server Actions und Server Components
