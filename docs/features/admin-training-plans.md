# Admin-Rollen und Trainingsplan-Builder

## Rollenmodell

Die Plattform nutzt drei Rollen:

- `user`: normale Nutzer mit Zugriff auf eigene Analysen
- `coach`: Trainer mit read-only Zugriff auf zugeordnete Athleten
- `admin`: Zugriff auf Admin-Bereich und Trainingsplan-Builder

Rollen liegen in `public.user_roles`. Normale Nutzer dürfen ihre Rolle nur lesen,
aber nicht schreiben. Admin-Rechte werden DB-only vergeben:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'manuel.hohlwegler@gmx.de'
on conflict (user_id, role) do nothing;
```

Der RLS-Helfer `public.is_admin()` wird in Policies genutzt und verhindert, dass
ein Nutzer sich über Client-Zugriff selbst hochstuft.

Admin-Aktionen wie das serverseitige Anlegen bestätigter User benötigen in der
Deployment-Umgebung `SUPABASE_SECRET_KEY` oder alternativ den Legacy-Key
`SUPABASE_SERVICE_ROLE_KEY`. Diese Keys dürfen nicht mit `NEXT_PUBLIC_`
prefixt werden.

## Trainingspläne

Admins verwalten Pläne unter `/admin/plans`.

Ein Plan besteht aus:

- Basisdaten: Slug, Titel, Fokus, Phase, Niveau, Zielstrecken, Wochen
- `summary`: interne und sichtbare Kurzbeschreibung
- `preview`: gesperrte Vorschau im Report
- `content`: strukturierter Builder mit Wochen, Einheiten, Blöcken/Sets und Drills
- `is_active`: Veröffentlichung für Report-Vorschauen

Aktive Pläne können von eingeloggten Nutzern als gesperrte Vorschau gelesen
werden. Vollständiges Anlegen, Bearbeiten, Aktivieren und Löschen ist Admins
vorbehalten.

## Report-Verknüpfung

Die Analyse berechnet einen empfohlenen Plan-Slug:

- `wasserlage-balance`
- `vo2max-builder`
- `vlamax-senker`
- `tempohaerte`

Der Report lädt den passenden aktiven Trainingsplan und zeigt nur die gesperrte
Vorschau. Payment oder Freischaltung sind vorbereitet, aber noch nicht umgesetzt.

## Checks

Nach Schema- oder Policy-Änderungen ausführen:

```bash
npm test
npx tsc --noEmit
npm run build
npm audit --audit-level=moderate
```

Danach Supabase Advisors prüfen:

- Security Advisor
- Performance Advisor
