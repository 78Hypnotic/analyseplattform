# Trainingsplattform

Web-first Trainingsplattform für sportartspezifische Diagnostik, verständliche
Reports und den schrittweisen Weg zu persönlichen Trainingsplänen. Der aktuelle
Next.js MVP bildet Diagnostiken für Schwimmen, Laufen und Radfahren mit Supabase
Auth, gespeicherten Reports sowie Coach- und Adminfunktionen ab.

Das langfristige Ziel ist ein geschlossener Trainingskreislauf aus Diagnostik,
Planempfehlung, Training, Fortschritt und Re-Diagnostik. Der nächste
Produktmeilenstein verkauft statische Schwimmpläne einmalig über Stripe und zeigt
den persönlichen Plan sowie die nächste Einheit im Profil. Membership,
Community, KI-unterstützte coach-freigegebene Pläne, Pro-Coaching,
Mentaltraining, Garmin sowie iOS und Android folgen in späteren Stufen.

Siehe [Produktvision](docs/product-vision.md),
[Planverkaufsmeilenstein](docs/features/static-training-plan-sales.md) und
[Mobile-Roadmap](docs/architecture/mobile-roadmap.md).

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
LEGAL_OPERATOR_NAME=Manuel Hohlwegler
LEGAL_POSTAL_ADDRESS=Straße Hausnummer|PLZ Ort|Deutschland
LEGAL_CONTACT_EMAIL=manuel.hohlwegler@gmx.de
```

`SUPABASE_SECRET_KEY` wird nur serverseitig fuer Admin-Aktionen wie User-Anlage
verwendet. Falls noch der alte JWT-Key genutzt wird, funktioniert alternativ
`SUPABASE_SERVICE_ROLE_KEY`.

`LEGAL_POSTAL_ADDRESS` ist in Produktion erforderlich. Mehrere Anschriftzeilen
werden mit `|` getrennt. Optional können `LEGAL_CONTACT_PHONE` und `LEGAL_VAT_ID`
gesetzt werden.

Supabase Auth muss dieselbe URL erlauben:

- Site URL: `https://analyseplattform.vercel.app`
- Redirect URLs:
  - `https://analyseplattform.vercel.app/auth/callback`
  - `https://analyseplattform.vercel.app/reset-password/update`

## Featureumfang

- Passwort-Login und Registrierung mit Supabase Auth
- Profilseite mit Name, E-Mail und Profilbild-Upload
- Diagnoseflows und gespeicherte Reports für Schwimmen, Laufen und Radfahren
- Zielstrecke, optionales Wettkampfdatum und Schwimmeinheiten pro Woche
- Automatische Planlänge aus Basisplan, Einheiten/Woche und Wettkampfdatum
- Gespeicherte Analysen und Detailreports je Disziplin
- PDF-Export über Browser-Druckdialog
- Rollenmodell mit `user`, `coach` und `admin`
- Coach-Zugriff auf ausdrücklich zugeordnete Athleten
- Coach-/Admin-Trainingsplan-Builder unter `/trainingsplaene/verwalten`
- Gruppencoaching-Bibliothek unter `/trainingsplaene`
- Gesperrte Trainingsplan-Vorschau im Report
- Rechtliche Seiten: `/impressum`, `/datenschutz`, `/cookies`

Kauf, Freischaltung, persönliche Terminierung und Fortschritt von
Trainingsplänen sind noch nicht implementiert. Ihr verbindlicher Umfang steht
im [Planverkaufsmeilenstein](docs/features/static-training-plan-sales.md).

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
- `/lauf`, `/lauf/new`, `/lauf/[id]` Laufdiagnostik
- `/rad`, `/rad/new`, `/rad/[id]` Raddiagnostik
- `/coach` zugeordnete Athleten
- `/admin` Admin-Übersicht
- `/trainingsplaene` Trainingsplanbibliothek beziehungsweise gesperrter Gruppencoaching-Zugang
- `/trainingsplaene/verwalten` eigene Planvorlagen für Coaches und alle Vorlagen für Admins

## Production Setup

- Supabase Auth, SMTP, Leaked Password Protection und URL-Konfiguration:
  `docs/supabase-auth-production.md`
- Admin-Rollen und Trainingsplan-Builder:
  `docs/features/admin-training-plans.md`
- Web-Diagnostik-MVP:
  `docs/features/trainingsanalyse-mvp.md`
- Langfristige Produktvision:
  `docs/product-vision.md`
- Nächster Meilenstein, statische Schwimmpläne verkaufen:
  `docs/features/static-training-plan-sales.md`
- Garmin Activity-Import und spätere Workout-Synchronisierung:
  `docs/features/garmin-integration.md`
- Zielarchitektur für iOS und Android:
  `docs/architecture/mobile-roadmap.md`
- Noch offene Go-live-Punkte:
  `docs/produktionsreife-offene-punkte.md`

## Scripts

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
npm audit --audit-level=moderate
```
