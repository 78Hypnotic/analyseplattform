# Coach-/Trainerzugang

## Rollenmodell

`public.app_role` enthält `user`, `coach` und `admin`. Rollen sind mehrwertig:
Ein Nutzer kann zum Beispiel gleichzeitig `admin` und `coach` sein.

- `user`: Eigene Profile und Analysen.
- `coach`: Eigene Daten plus verwaltender Zugriff auf zugeordnete Athleten.
- `admin`: Admin-Bereich, Rollenverwaltung und Coach-Athlet-Zuordnung.

## Zuordnung

Coach-Athlet-Beziehungen liegen in `public.coach_athletes`.

- Admins dürfen Zuordnungen anlegen und entfernen.
- Coaches dürfen nur eigene Zuordnungen lesen.
- Neue, durch einen Coach eingeladene Athleten werden diesem Coach automatisch zugeordnet.
- Wenn ein Coach zurück auf `user` gesetzt wird, werden dessen Zuordnungen entfernt.

## Athletenkonten

Coaches können unter `/coach` neue Athleten per Name und E-Mail einladen.

- Supabase versendet eine Einladungsmail.
- Der Athlet legt sein Passwort selbst fest; der Coach sieht kein Passwort.
- Das Konto erhält ausschließlich die Rolle `user`.
- Bereits registrierte E-Mail-Adressen werden nicht automatisch zugeordnet. Diese
  Zuordnung bleibt eine Admin-Aufgabe, damit bestehende Konten nicht übernommen werden.

Die Auth-Admin-API wird ausschließlich in einer rate-limitierten Server Action verwendet.
Der Service-Role-Key bleibt serverseitig.

## Zugriff und Mutationen

Coaches sehen unter `/coach` ihre zugeordneten Athleten. Die Detailseite
`/coach/athletes/[id]` zeigt und bearbeitet die sportlichen Profildaten. Kontodaten
wie E-Mail, Avatar und Profil-Sichtbarkeit bleiben geschützt.

Coaches können für zugeordnete Athleten Schwimm-, Lauf- und Radanalysen:

- neu anlegen,
- mit den gespeicherten Eingaben erneut öffnen und bearbeiten,
- löschen.

Die Analyse-Flows erhalten dafür eine `athlete`-UUID und optional eine `edit`-UUID.
Beide Werte gelten als nicht vertrauenswürdige Eingaben und werden in der Seite und
erneut in jeder Server Action validiert. Die Zuordnung wird unmittelbar vor jeder
Mutation geprüft.

RLS erweitert `profiles` und `analyses` für aktuell zugeordnete Coaches. Eine bestehende
Zuordnung reicht nicht aus, wenn der Nutzer nicht mehr die Rolle `coach` hat. Zusätzliche
Datenbank-Trigger verhindern Änderungen an geschützten Profilspalten sowie an
Analyse-Eigentümerschaft, Disziplin und ursprünglicher Herkunft.

## Herkunft und Anzeige beim Athleten

`analyses` speichert `created_by`, `created_by_name`, `updated_by` und
`updated_by_name`. Die Datenbank setzt diese Werte aus `auth.uid()`; der Client kann
sie nicht vorgeben.

Der Athlet sieht Coach-Analysen:

- im disziplinübergreifenden Testverlauf seines Profils,
- in der jeweiligen Analyseübersicht,
- im vollständigen Report.

Coach-erstellte Reports tragen den Hinweis `Erfasst von Coach <Name>`. Nach einer
Coach-Bearbeitung wird zusätzlich `Zuletzt bearbeitet von Coach <Name>` angezeigt.

Beim Bearbeiten eines älteren Tests bleiben die neuesten Profil-Kennzahlen unverändert.
Beim Bearbeiten oder Löschen des neuesten Tests werden die Zusammenfassungen neu
berechnet beziehungsweise auf den nächsten vorhandenen Test zurückgesetzt.

## Supabase Data API

Die Migration gewährt `authenticated` die benötigten Tabellenrechte explizit. RLS
entscheidet anschließend zeilenweise, ob der angemeldete Nutzer selbst Eigentümer,
zugeordneter Coach oder Admin ist.
