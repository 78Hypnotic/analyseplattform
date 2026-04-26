# Trainingsanalyse MVP

Der MVP migriert den bestehenden statischen Prototyp in eine Next.js-App mit Supabase Auth und gespeicherten Analysen.

## Umfang

- E-Mail Magic Link Login
- Neuer Analyseflow fuer Schwimmen
- Speicherung von Eingaben und Analyseergebnissen in Supabase
- Dashboard mit den letzten Analysen
- Detailreport pro Analyse

## Datenmodell

Supabase nutzt `profiles` fuer User-Basisdaten und `analyses` fuer gespeicherte Analyse-Reports. Row Level Security ist aktiv; Nutzer duerfen nur eigene Datensaetze lesen und schreiben.

## Sicherheit

- Keine Secrets im Repository
- Zod-Validierung fuer Analyse-Input
- Rate Limiting fuer Login und Analyse-Erstellung
- Auth-Pruefung in Server Actions und Server Components
