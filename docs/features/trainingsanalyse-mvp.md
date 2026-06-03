# Trainingsanalyse MVP

Der MVP migriert den bestehenden Prototyp in eine Next.js-App mit Supabase Auth,
gespeicherten Analysen, erweitertem Report und Admin-verwalteten Trainingsplänen.

## Umfang

- Passwort-Login, Registrierung, Passwort-Reset und Profilbild-Upload
- Neuer Analyseflow für Schwimmen
- Zielwettkampf-Kontext mit Zielstrecke, optionalem Wettkampfdatum und Einheiten/Woche
- Berechnung von Pace, DPS, SR, CSS, VO2-Proxy, VLa-Proxy und Sprint-Reserve
- Coaching-Report mit CSS-Hero, physiologischen Leistungsindizes, Schwimm-Mechanik, aktuellem Schwimmmuster, Trainingshebel, ReTest und eingeklapptem Expertenmodus
- Speicherung von Eingaben und Analyseergebnissen in Supabase
- Analyse-Übersicht unter `/analyse`
- Detailreport pro Analyse unter `/analyse/[id]`
- Admin-Rollenmodell und Trainingsplan-Builder unter `/admin/plans`
- Coach-Zugang für zugeordnete Athleten unter `/coach`
- Gesperrte Trainingsplan-Vorschau im Report

## Report-Struktur

Der Report folgt dem Prinzip "Weniger Labor. Mehr Coaching." Standardberichte
zeigen CSS, Schwimm-Mechanik, Stilprofil, Trainingshebel und ReTest zuerst.
Technische Cross-Checks wie Pace-Differenzen, Sprintreserve, Referenzwerte und
Profil-Scores bleiben im eingeklappten Expertenmodus verfügbar. Im sichtbaren
Report werden die physiologischen Ableitungen qualitativ gelabelt statt als
harte Zahlenwerte ausgegeben.

Physiologische Ableitungen werden sichtbar als sportartspezifische
Leistungsindizes kommuniziert:

- Aerobe Kapazität
- Anaerobe Kapazität
- Schwellenleistung / CSS

Die internen VO2- und VLa-Proxies bleiben Teil der Berechnung, werden aber nicht
als Laborwerte oder medizinische Diagnostik ausgegeben.

## Datenmodell

Supabase nutzt:

- `profiles` für User-Basisdaten
- `user_roles` für `user`, `coach` und `admin`
- `coach_athletes` für Coach-Athlet-Zuordnungen
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
