# Trainingsanalyse MVP

Der MVP migriert den bestehenden Prototyp in eine Next.js-App mit Supabase Auth,
gespeicherten Analysen, erweitertem Report und Admin-verwalteten Trainingsplänen.

## Umfang

- Passwort-Login, Registrierung, Passwort-Reset und Profilbild-Upload
- Neuer Analyseflow für Schwimmen
- Zielwettkampf-Kontext mit Zielstrecke, optionalem Wettkampfdatum und Einheiten/Woche
- Berechnung von Pace, DPS, SR, CSS, VO2-Proxy, VLa-Proxy und Sprint-Reserve
- Report mit Hauptproblem, Stilprofil, Trainingsbedeutung pro Metrik, Rohdaten und ReTest
- Speicherung von Eingaben und Analyseergebnissen in Supabase
- Analyse-Übersicht unter `/analyse`
- Detailreport pro Analyse unter `/analyse/[id]`
- Admin-Rollenmodell und Trainingsplan-Builder unter `/admin/plans`
- Coach-Zugang fuer zugeordnete Athleten unter `/coach`
- Gesperrte Trainingsplan-Vorschau im Report

## Datenmodell

Supabase nutzt:

- `profiles` für User-Basisdaten
- `user_roles` fuer `user`, `coach` und `admin`
- `coach_athletes` fuer Coach-Athlet-Zuordnungen
- `analyses` für gespeicherte Analyse-Reports
- `training_plans` für Admin-verwaltete Planinhalte

Row Level Security ist aktiv. Nutzer dürfen nur eigene Analysen lesen und
schreiben. Aktive Trainingspläne sind für eingeloggte Nutzer lesbar, vollständiges
CRUD ist Admins vorbehalten.

## Sicherheit

- Keine Secrets im Repository
- Zod-Validierung für Analyse-Input und Trainingsplan-Builder
- Rate Limiting für Login, Analyse-Erstellung und Admin Actions
- Auth- und Admin-Prüfung in Server Actions und Server Components
- Admin-Rollen werden DB-only gesetzt, Nutzer können sich nicht selbst hochstufen

## Production

Weitere Schritte stehen in `docs/supabase-auth-production.md`.
Leaked Password Protection ist laut Supabase Advisor aktuell noch zu aktivieren.
