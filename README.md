# Trainingsanalyse

Next.js MVP für eine datenbasierte Schwimm-Trainingsanalyse.

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
```

## Supabase

Die Datenbank-Migration liegt unter `supabase/migrations/20260426182000_initial_schema.sql`.

Sie erstellt:

- `profiles`
- `analyses`
- Row Level Security für eigene Datensätze
- Trigger für neue Auth-User

## Scripts

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
```

## Routen

- `/` Landing
- `/login` Magic Link Login
- `/dashboard` gespeicherte Analysen
- `/analyse/new` neuer Analyseflow
- `/analyse/[id]` gespeicherter Report
