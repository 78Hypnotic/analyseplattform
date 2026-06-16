import Link from "next/link";
import { Bike, Footprints, ShieldCheck, Waves } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { requireAdmin } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  city: string | null;
  created_at: string | null;
  latest_swim_analyzed_at: string | null;
  latest_run_analyzed_at: string | null;
  latest_bike_analyzed_at: string | null;
};

type RoleRow = { user_id: string; role: "user" | "coach" | "admin" };

export default async function AdminUsersPage() {
  const { supabase } = await requireAdmin();

  const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id,email,full_name,city,created_at,latest_swim_analyzed_at,latest_run_analyzed_at,latest_bike_analyzed_at",
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("user_roles").select("user_id,role").limit(2000),
  ]);

  if (profilesError) throw new Error(profilesError.message);
  if (rolesError) throw new Error(rolesError.message);

  const rolesByUser = new Map<string, RoleRow["role"][]>();
  for (const row of (roles ?? []) as RoleRow[]) {
    rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), row.role]);
  }

  const users = (profiles ?? []) as ProfileRow[];

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <p className="mono inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          <ShieldCheck size={14} />
          Admin · User
        </p>
        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="display-serif text-5xl leading-tight text-[var(--foreground)]">Nutzer.</h1>
            <p className="muted mt-4 max-w-2xl leading-7">
              Alle registrierten Nutzer mit Rollen und durchgeführten Diagnostiken.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-sm font-medium transition hover:border-[var(--accent)]"
          >
            Zurück zur Steuerzentrale
          </Link>
        </div>

        <p className="mono mt-6 text-xs uppercase tracking-[0.14em] text-[var(--subtle)]">
          {users.length} {users.length === 1 ? "Nutzer" : "Nutzer"}
        </p>

        <div className="mt-3 grid gap-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="surface grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_160px_220px_120px]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{user.full_name || "Ohne Namen"}</p>
                <p className="mono mt-1 truncate text-xs text-[var(--subtle)]">{user.email ?? user.id}</p>
                {user.city ? <p className="muted mt-1 truncate text-xs">{user.city}</p> : null}
              </div>
              <Cell label="Rollen">
                <RoleBadges roles={rolesByUser.get(user.id) ?? ["user"]} />
              </Cell>
              <Cell label="Diagnostik">
                <DisciplineBadges user={user} />
              </Cell>
              <Cell label="Registriert">
                <span className="text-sm">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString("de-DE") : "-"}
                </span>
              </Cell>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function RoleBadges({ roles }: { roles: RoleRow["role"][] }) {
  const fallback: RoleRow["role"][] = ["user"];
  const unique = Array.from(new Set(roles.length > 0 ? roles : fallback));
  const order: Record<RoleRow["role"], number> = { admin: 0, coach: 1, user: 2 };
  unique.sort((a, b) => order[a] - order[b]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {unique.map((role) => (
        <span
          key={role}
          className={
            role === "admin"
              ? "rounded border border-[var(--accent)] bg-[var(--panel-2)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]"
              : "rounded border border-[var(--line)] bg-[var(--raised-bg)] px-2 py-0.5 text-xs text-[var(--muted)]"
          }
        >
          {role === "admin" ? "Admin" : role === "coach" ? "Coach" : "User"}
        </span>
      ))}
    </div>
  );
}

function DisciplineBadges({ user }: { user: ProfileRow }) {
  const items = [
    { done: Boolean(user.latest_swim_analyzed_at), icon: <Waves size={14} />, label: "Schwimmen" },
    { done: Boolean(user.latest_run_analyzed_at), icon: <Footprints size={14} />, label: "Laufen" },
    { done: Boolean(user.latest_bike_analyzed_at), icon: <Bike size={14} />, label: "Rad" },
  ];

  if (items.every((item) => !item.done)) {
    return <span className="muted text-sm">Noch keine</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items
        .filter((item) => item.done)
        .map((item) => (
          <span
            key={item.label}
            className="inline-flex items-center gap-1 rounded border border-[var(--line)] bg-[var(--raised-bg)] px-2 py-0.5 text-xs text-[var(--accent)]"
            title={item.label}
          >
            {item.icon}
            {item.label}
          </span>
        ))}
    </div>
  );
}
