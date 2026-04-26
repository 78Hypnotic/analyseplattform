# Admin-Rollen und Trainingsplan-Builder

## Rollenmodell

Die Plattform nutzt zwei Rollen:

- `user`: normale Nutzer mit Zugriff auf eigene Analysen
- `admin`: Zugriff auf Admin-Bereich und Trainingsplan-Builder

Rollen liegen in `public.user_roles`. Normale Nutzer dürfen ihre Rolle nur lesen,
aber nicht schreiben. Admin-Rechte werden DB-only vergeben:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'manuel.hohlwegler@gmx.de'
on conflict (user_id) do update set role = 'admin'::public.app_role;
```

Der RLS-Helfer `public.is_admin()` wird in Policies genutzt und verhindert, dass
ein Nutzer sich über Client-Zugriff selbst hochstuft.

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
