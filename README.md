# Trainingsanalyse

Next.js MVP für eine datenbasierte Schwimm-Trainingsanalyse mit Supabase Auth,
gespeicherten Reports und Admin-verwalteten Trainingsplänen.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Erforderliche Variablen:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=https://analyseplattform.vercel.app
```

`SUPABASE_SECRET_KEY` wird nur serverseitig fuer Admin-Aktionen wie User-Anlage
verwendet. Falls noch der alte JWT-Key genutzt wird, funktioniert alternativ
`SUPABASE_SERVICE_ROLE_KEY`.

Supabase Auth muss dieselbe URL erlauben:

- Site URL: `https://analyseplattform.vercel.app`
- Redirect URLs:
  - `https://analyseplattform.vercel.app/auth/callback`
  - `https://analyseplattform.vercel.app/reset-password/update`

## Featureumfang

- Passwort-Login und Registrierung mit Supabase Auth
- Profilseite mit Name, E-Mail und Profilbild-Upload
- Analyseflow für Schwimmen: Kontext, Zielwettkampf, Testdaten, Report
- Zielstrecke, optionales Wettkampfdatum und Schwimmeinheiten pro Woche
- Automatische Planlänge aus Basisplan, Einheiten/Woche und Wettkampfdatum
- Gespeicherte Analysen unter `/analyse`
- Detailreport unter `/analyse/[id]`
- PDF-Export über Browser-Druckdialog
- Admin-Rollenmodell mit `user` und `admin`
- Admin-Trainingsplan-Builder unter `/admin/plans`
- Gesperrte Trainingsplan-Vorschau im Report
- Rechtliche Seiten: `/impressum`, `/datenschutz`, `/cookies`

## Supabase

Migrationen liegen unter `supabase/migrations/`.

Wichtige Tabellen und Objekte:

- `profiles`: User-Basisdaten
- `user_roles`: sichere Rollenvergabe, keine Self-Promotion
- `analyses`: gespeicherte Analyse-Reports
- `training_plans`: Admin-verwaltete Trainingspläne
- `public.is_admin()`: RLS-Helfer für Admin-Policies

Der erste Admin wird DB-only gesetzt, zum Beispiel:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'manuel.hohlwegler@gmx.de'
on conflict (user_id) do update set role = 'admin'::public.app_role;
```

## Routen

- `/` Landing
- `/login` Passwort-Login und Registrierung
- `/reset-password` Passwort-Reset
- `/profile` Profil bearbeiten
- `/analyse` gespeicherte Analysen
- `/analyse/new` neuer Analyseflow
- `/analyse/[id]` gespeicherter Report
- `/admin` Admin-Übersicht
- `/admin/plans` Trainingspläne verwalten

## Production Setup

- Supabase Auth, SMTP, Leaked Password Protection und URL-Konfiguration:
  `docs/supabase-auth-production.md`
- Admin-Rollen und Trainingsplan-Builder:
  `docs/features/admin-training-plans.md`
- MVP-Funktionsumfang:
  `docs/features/trainingsanalyse-mvp.md`

## Scripts

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
npm audit --audit-level=moderate
```
