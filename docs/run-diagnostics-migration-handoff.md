# Handoff: Migration „run_diagnostics" anwenden (Supabase MCP)

**Für:** einen Agenten mit aktiver **Supabase-MCP-Verbindung** zum Projekt der
Trainingsanalyse-Plattform (`analyseplattform`).
**Aufgabe:** eine einzelne, additive Datenbank-Migration anwenden und verifizieren.

---

## 1. Warum das dringend ist

Der App-Code wurde bereits geändert: Die Schwimm-Abfragen in
`src/lib/analyses.ts` filtern jetzt auf `discipline = 'swim'`, und die neuen
Lauf-Abfragen auf `discipline = 'run'`. **Solange die Spalte `analyses.discipline`
in der Datenbank fehlt, brechen sowohl die bestehende `/analyse`-Seite (Schwimmen)
als auch die neue `/lauf`-Seite.** Die Migration ist rein additiv (neue Spalten,
Constraints, Index) und verändert keine vorhandenen Daten.

Die Migration liegt als Datei vor:
`supabase/migrations/20260615120000_run_diagnostics.sql`
(Inhalt unten 1:1 wiedergegeben).

---

## 2. Vorab-Check (read-only)

Bevor du etwas änderst, verschaffe dir einen Überblick:

1. **Richtiges Projekt bestätigen.** Falls mehrere Projekte erreichbar sind,
   `list_projects` / `get_project` aufrufen und das Projekt der
   Trainingsanalyse-Plattform auswählen. Prüfe per `list_tables`, dass die
   Tabellen `public.analyses` und `public.profiles` existieren.
2. **Schon angewendet?** `list_migrations` aufrufen. Wenn eine Migration mit
   Version/Name `run_diagnostics` bzw. Zeitstempel `20260615120000` bereits
   gelistet ist, **stopp** — nichts weiter zu tun, springe direkt zu Schritt 4
   (Verifikation).
3. **Spalte schon vorhanden?** Optional per `execute_sql`:
   ```sql
   select column_name
   from information_schema.columns
   where table_schema = 'public'
     and table_name = 'analyses'
     and column_name = 'discipline';
   ```
   Liefert das eine Zeile, ist die Spalte bereits da.

---

## 3. Migration anwenden

Rufe das MCP-Tool **`apply_migration`** auf mit:

- **name:** `run_diagnostics`
- **query:** exakt das folgende SQL (idempotent — mehrfaches Ausführen ist
  sicher dank `if not exists` / `duplicate_object`-Guards):

```sql
-- Running diagnostics: discipline discriminator on analyses + latest-run profile summary.

alter table public.analyses
add column if not exists discipline text not null default 'swim';

do $$
begin
  alter table public.analyses
    add constraint analyses_discipline_check check (discipline in ('swim', 'run'));
exception
  when duplicate_object then null;
end $$;

create index if not exists analyses_user_discipline_created_idx
on public.analyses (user_id, discipline, created_at desc);

alter table public.profiles
add column if not exists latest_run_analysis_id uuid,
add column if not exists latest_run_analyzed_at timestamptz,
add column if not exists latest_run_cs_pace_sec numeric(5,1),
add column if not exists latest_run_api numeric(3,1),
add column if not exists latest_run_aci numeric(3,1);

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_run_cs_pace_sec_check check (
      latest_run_cs_pace_sec is null
      or latest_run_cs_pace_sec between 120 and 900
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_run_api_check check (
      latest_run_api is null
      or latest_run_api between 1 and 10
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_run_aci_check check (
      latest_run_aci is null
      or latest_run_aci between 1 and 10
    );
exception
  when duplicate_object then null;
end $$;
```

> Hinweis: Falls dein MCP `apply_migration` eine Kostenbestätigung verlangt
> (`confirm_cost` o. Ä.), bestätige sie. Es entstehen keine neuen Ressourcen,
> nur Schemaänderungen an bestehenden Tabellen.

---

## 4. Verifikation (read-only)

Nach dem Anwenden per **`execute_sql`** prüfen:

1. **Neue Spalten vorhanden:**
   ```sql
   select table_name, column_name, data_type
   from information_schema.columns
   where table_schema = 'public'
     and (
       (table_name = 'analyses' and column_name = 'discipline')
       or (table_name = 'profiles' and column_name like 'latest_run_%')
     )
   order by table_name, column_name;
   ```
   Erwartung: `analyses.discipline` (text) plus 5 `profiles.latest_run_*`-Spalten.

2. **Bestandsdaten korrekt voreingestellt:**
   ```sql
   select discipline, count(*) from public.analyses group by discipline;
   ```
   Erwartung: alle vorhandenen Zeilen stehen auf `swim` (Default).

3. **Constraints aktiv:**
   ```sql
   select conname from pg_constraint
   where conname in (
     'analyses_discipline_check',
     'profiles_latest_run_cs_pace_sec_check',
     'profiles_latest_run_api_check',
     'profiles_latest_run_aci_check'
   );
   ```
   Erwartung: alle vier Namen werden gelistet.

4. **Advisors (optional, empfohlen):** `get_advisors` mit Typ `security` und
   `performance` aufrufen und sicherstellen, dass keine **neuen** Warnungen durch
   die Migration entstanden sind (RLS bleibt über `user_id` gültig; es wurden
   keine Policies geändert).

---

## 5. Ergebnis zurückmelden

Melde an den auftraggebenden Menschen/Agenten zurück:
- ob die Migration neu angewendet oder bereits vorhanden war,
- das Ergebnis der vier Verifikations-Abfragen (kurz),
- etwaige Advisor-Auffälligkeiten.

Danach kann der manuelle End-to-End-Test erfolgen: in der App `/lauf/new` öffnen,
3-Min-Distanz `850` und 12-Min-Distanz `3000` eingeben, speichern — der Report
muss CS ≈ 4:11/km, API 5,0 und ACI 7,0 zeigen und unter `/lauf` sowie in der
Profil-Zusammenfassung erscheinen.

---

## 6. Rollback (nur falls nötig)

Die Migration ist additiv und sollte nicht zurückgerollt werden müssen. Da der
App-Code aber bereits auf `discipline` filtert, würde ein Rollback die App
brechen — **nur** ausführen, wenn die App-Änderungen ebenfalls zurückgenommen
werden:

```sql
drop index if exists public.analyses_user_discipline_created_idx;
alter table public.analyses drop constraint if exists analyses_discipline_check;
alter table public.analyses drop column if exists discipline;

alter table public.profiles
  drop constraint if exists profiles_latest_run_cs_pace_sec_check,
  drop constraint if exists profiles_latest_run_api_check,
  drop constraint if exists profiles_latest_run_aci_check;
alter table public.profiles
  drop column if exists latest_run_analysis_id,
  drop column if exists latest_run_analyzed_at,
  drop column if exists latest_run_cs_pace_sec,
  drop column if exists latest_run_api,
  drop column if exists latest_run_aci;
```
