# Handoff: Migration „bike_diagnostics" anwenden (Supabase MCP)

**Für:** einen Agenten mit aktiver **Supabase-MCP-Verbindung** zum Projekt der
Trainingsanalyse-Plattform (`analyseplattform`).
**Aufgabe:** eine additive Datenbank-Migration für die Rad-Diagnostik anwenden
und verifizieren.

---

## 0. Reihenfolge beachten

Diese Migration setzt voraus, dass die **Lauf-Migration zuerst** angewendet
wurde (`20260615120000_run_diagnostics.sql` — siehe
`docs/run-diagnostics-migration-handoff.md`), denn sie fügt die Spalte
`analyses.discipline` hinzu, die hier nur im Check-Constraint erweitert wird.
Bei `supabase db push` werden Migrationen automatisch in Zeitstempel-Reihenfolge
angewendet. Wenn du beide manuell einspielst: **erst run, dann bike.**

## 1. Warum das nötig ist

Der App-Code filtert Rad-Abfragen auf `discipline = 'bike'` und schreibt eine
`latest_bike_*`-Zusammenfassung ins Profil. Ohne die erweiterte Check-Constraint
und die neuen Spalten brechen das Speichern und die `/rad`-Seiten. Die Migration
ist rein additiv (Constraint-Erweiterung + neue Spalten), keine Datenänderung.

Migrationsdatei: `supabase/migrations/20260615130000_bike_diagnostics.sql`.

## 2. Vorab-Check (read-only)

1. **Projekt bestätigen** (`list_projects`/`get_project`), Tabellen `analyses`
   und `profiles` per `list_tables` prüfen.
2. **Schon angewendet?** `list_migrations` — wenn `bike_diagnostics` /
   `20260615130000` gelistet ist, zu Schritt 4 (Verifikation) springen.
3. **Spalte `discipline` vorhanden?** (Voraussetzung) per `execute_sql`:
   ```sql
   select 1 from information_schema.columns
   where table_schema='public' and table_name='analyses' and column_name='discipline';
   ```
   Liefert das keine Zeile, zuerst die Lauf-Migration anwenden.

## 3. Migration anwenden

Tool **`apply_migration`** mit **name:** `bike_diagnostics` und **query:** (idempotent):

```sql
alter table public.analyses
drop constraint if exists analyses_discipline_check;

do $$
begin
  alter table public.analyses
    add constraint analyses_discipline_check check (discipline in ('swim', 'run', 'bike'));
exception
  when duplicate_object then null;
end $$;

alter table public.profiles
add column if not exists latest_bike_analysis_id uuid,
add column if not exists latest_bike_analyzed_at timestamptz,
add column if not exists latest_bike_ftp_watt integer,
add column if not exists latest_bike_vo2max_rel numeric(4,1),
add column if not exists latest_bike_vlamax_proxy numeric(3,2);

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_bike_ftp_watt_check check (
      latest_bike_ftp_watt is null or latest_bike_ftp_watt between 50 and 700
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_bike_vo2max_rel_check check (
      latest_bike_vo2max_rel is null or latest_bike_vo2max_rel between 20 and 100
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_bike_vlamax_proxy_check check (
      latest_bike_vlamax_proxy is null or latest_bike_vlamax_proxy between 0.1 and 1.5
    );
exception
  when duplicate_object then null;
end $$;
```

## 4. Verifikation (read-only, `execute_sql`)

1. **Check-Constraint erlaubt 'bike':**
   ```sql
   select pg_get_constraintdef(oid) from pg_constraint where conname = 'analyses_discipline_check';
   ```
   Erwartung: `CHECK (discipline = ANY (ARRAY['swim','run','bike']))`.
2. **Neue Profilspalten vorhanden:**
   ```sql
   select column_name from information_schema.columns
   where table_schema='public' and table_name='profiles' and column_name like 'latest_bike_%';
   ```
   Erwartung: 5 Spalten.
3. **Advisors (optional):** `get_advisors` (security + performance) auf neue
   Auffälligkeiten prüfen. RLS bleibt über `user_id` gültig, keine Policy-Änderung.

## 5. Rückmeldung & Test

Kurz zurückmelden (neu angewendet vs. bereits vorhanden + Verifikationsergebnis).
Danach manueller End-to-End-Test: `/rad/new` mit Beispieldaten (Peak 1 s 900 W,
20 s Ø 700 W, 1 min Ø 420 W, 75 kg) → Dominanz ≈ 1,77,
VLamax-Proxy ≈ 0,28, FTP ≈ 305 W und VO₂max ≈ 59 ml/kg/min; speichern → erscheint unter `/rad` und in
der Profil-Zusammenfassung.

## 6. Rollback (nur falls nötig)

```sql
alter table public.analyses drop constraint if exists analyses_discipline_check;
alter table public.analyses add constraint analyses_discipline_check check (discipline in ('swim','run'));
alter table public.profiles
  drop constraint if exists profiles_latest_bike_ftp_watt_check,
  drop constraint if exists profiles_latest_bike_vo2max_rel_check,
  drop constraint if exists profiles_latest_bike_vlamax_proxy_check;
alter table public.profiles
  drop column if exists latest_bike_analysis_id,
  drop column if exists latest_bike_analyzed_at,
  drop column if exists latest_bike_ftp_watt,
  drop column if exists latest_bike_vo2max_rel,
  drop column if exists latest_bike_vlamax_proxy;
```

## 7. Formelkorrektur und JSONB-Backfill

Die Korrektur aus `Korrektur VLamax Bestimmung.docx` benötigt keine weitere
DDL-Migration. Neue Analysen verwenden `vlamax-dominance-v1` mit
`D = Pgly / PVO₂`; die Energiekette bis `Laeq` bleibt erhalten.

Der Datenbackfill wird ausschließlich unter `/admin/methodik` ausgeführt:

1. Read-only-Vorschau prüfen. Stand 10.07.2026: 12 Analysen, davon 8
   migrierbar und 4 nach neuem Modell außerhalb `[0.25, 0.90]`.
2. Checkbox bestätigen und den Batch starten. Maximal 50 Analysen werden in
   einem Lauf verarbeitet; erneute Aufrufe sind idempotent.
3. Erwarteter Endzustand: 8 Resultate mit `modelVersion =
   'vlamax-dominance-v1'`, 4 Resultate mit `modelVersion = 'legacy-laeq-v1'`
   und `migrationTargetVersion = 'vlamax-dominance-v1'`, 0 offene Resultate.
4. Der Backfill aktualisiert danach nur `latest_bike_*`. Die allgemeinen
   Profilfelder `ftp_rad`, `vo2max` und `vlamax` bleiben unverändert.

Für ein Rollback enthält jedes erfolgreich migrierte Resultat den vorherigen
JSONB-Stand einmalig unter `legacySnapshot`. Nicht migrierbare Analysen behalten
ihre historischen Kennzahlen und werden im Report deutlich als Legacy
gekennzeichnet.
