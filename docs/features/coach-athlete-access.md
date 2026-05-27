# Coach-/Trainerzugang

## Rollenmodell

`public.app_role` enthaelt jetzt `user`, `coach` und `admin`. Rollen sind mehrwertig:
ein Nutzer kann z. B. gleichzeitig `admin` und `coach` sein.

- `user`: Eigene Profile und Analysen.
- `coach`: Eigene Daten plus read-only Zugriff auf zugeordnete Athleten.
- `admin`: Admin-Bereich, Rollenverwaltung und Coach-Athlet-Zuordnung.

Trainer-Accounts werden nicht neu erstellt. Ein Admin markiert bestehende Nutzer unter
`/admin/coaches` als Coach.

## Zuordnung

Coach-Athlet-Beziehungen liegen in `public.coach_athletes`.

- Admins duerfen Zuordnungen anlegen und entfernen.
- Coaches duerfen nur eigene Zuordnungen lesen.
- Wenn ein Coach zurueck auf `user` gesetzt wird, werden dessen Zuordnungen entfernt.

## Zugriff

Coaches sehen unter `/coach` ihre zugeordneten Athleten. Die Detailseite
`/coach/athletes/[id]` zeigt Profilzusammenfassung und die letzten 20 Analyseberichte.
Der Zugriff ist read-only; Analyse- und Profilmutationen bleiben beim Athleten selbst.

RLS erweitert `profiles` und `analyses` nur fuer aktuell zugeordnete Coaches. Eine
bestehende Zuordnung reicht nicht aus, wenn der Nutzer nicht mehr die Rolle `coach` hat.

## Supabase Data API

Neue und benoetigte Tabellen erhalten explizite `GRANT`s fuer `authenticated`, weil neue
Supabase-Projekte Public-Tabellen nicht mehr automatisch fuer die Data API freigeben.
