import { Link2, ShieldCheck, Trash2, UserCheck, Users } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/button";
import { requireAdmin } from "@/lib/auth/roles";
import { removeCoachAssignment, setCoachRole } from "./actions";
import { CoachAthleteAssignmentForm } from "./coach-athlete-assignment-form";

type RoleRow = {
  user_id: string;
  role: "user" | "coach" | "admin";
};

type UserRoleRow = {
  user_id: string;
  roles: RoleRow["role"][];
  email: string;
  name: string;
};

type ProfileRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
};

type AssignmentRow = {
  coach_id: string;
  athlete_id: string;
  created_at: string;
};

type AdminCoachData = {
  users: UserRoleRow[];
  coaches: UserRoleRow[];
  athletes: UserRoleRow[];
  assignments: AssignmentRow[];
};

export const dynamic = "force-dynamic";

const ADMIN_COACH_QUERY_LIMIT = 1000;

/**
 * Renders the admin surface for role assignment and coach-athlete links.
 */
export default async function AdminCoachesPage() {
  const { supabase } = await requireAdmin();
  const data = await loadAdminCoachData(supabase);
  const userById = new Map(data.users.map((user) => [user.user_id, user]));
  const coachCandidates = data.users.filter(
    (user) => !user.roles.includes("coach") && !user.roles.includes("admin"),
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl space-y-8 px-5 py-10">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              Admin / Coaches
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Coach-Zugang</h1>
            <p className="muted mt-3 max-w-2xl">
              Bestehende Nutzer als Coaches markieren und Athleten read-only zuordnen.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <AdminMetric icon={<UserCheck size={16} />} label="Coaches" value={String(data.coaches.length)} />
          <AdminMetric icon={<Users size={16} />} label="Athleten" value={String(data.athletes.length)} />
          <AdminMetric icon={<Link2 size={16} />} label="Zuordnungen" value={String(data.assignments.length)} />
        </section>

        <details open className="surface p-5">
          <summary className="flex cursor-pointer items-center gap-2 text-xl font-semibold">
            <ShieldCheck size={18} className="text-[var(--accent)]" />
            Trainer-Rollen
          </summary>
          <div className="mt-5 grid gap-5">
            <form action={setCoachRole} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <input type="hidden" name="role" value="coach" />
              <label className="grid gap-2 text-sm">
                Neuen Coach zuordnen
                <select name="userId" required disabled={coachCandidates.length === 0}>
                  <option value="">
                    {coachCandidates.length === 0 ? "Keine Nutzer ohne Coach-Rolle" : "Nutzer auswählen"}
                  </option>
                  {coachCandidates.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <Button type="submit" variant="primary" className="w-full" disabled={coachCandidates.length === 0}>
                  <UserCheck size={16} />
                  Zu Coach machen
                </Button>
              </div>
            </form>

            <div className="grid gap-3">
              {data.coaches.length === 0 ? (
                <p className="muted text-sm">Noch keine Coaches angelegt.</p>
              ) : (
                data.coaches.map((coach) => (
                  <div
                    key={coach.user_id}
                    className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4 md:grid-cols-[minmax(0,1fr)_120px_auto]"
                  >
                    <UserLabel name={coach.name} email={coach.email} />
                    <SmallMetric label="Rollen" value={formatRoles(coach.roles)} />
                    <form action={setCoachRole} className="flex md:justify-end">
                      <input type="hidden" name="userId" value={coach.user_id} />
                      <input type="hidden" name="role" value="user" />
                      <Button type="submit" variant="secondary">
                        Coach entfernen
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </details>

        <section className="surface relative z-30 p-5">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Athlet zuordnen</h2>
            <p className="muted mt-1 text-sm">Nur Nutzer mit Rolle `coach` können Athleten erhalten.</p>
          </div>
          <CoachAthleteAssignmentForm
            coaches={data.coaches.map((coach) => ({
              id: coach.user_id,
              name: coach.name,
              email: coach.email,
            }))}
            athletes={data.athletes.map((athlete) => ({
              id: athlete.user_id,
              name: athlete.name,
              email: athlete.email,
            }))}
            assignments={data.assignments.map((assignment) => ({
              coach_id: assignment.coach_id,
              athlete_id: assignment.athlete_id,
            }))}
          />
        </section>

        <section className="surface relative z-0 p-5">
          <h2 className="text-xl font-semibold">Aktive Zuordnungen</h2>
          <div className="mt-4 grid gap-3">
            {data.assignments.length === 0 ? (
              <p className="muted text-sm">Noch keine Zuordnungen angelegt.</p>
            ) : (
              data.assignments.map((assignment) => {
                const coach = userById.get(assignment.coach_id);
                const athlete = userById.get(assignment.athlete_id);
                return (
                  <div
                    key={`${assignment.coach_id}-${assignment.athlete_id}`}
                    className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_auto]"
                  >
                    <UserLabel name={coach?.name ?? "Coach"} email={coach?.email ?? assignment.coach_id} />
                    <UserLabel name={athlete?.name ?? "Athlet"} email={athlete?.email ?? assignment.athlete_id} />
                    <SmallMetric label="Seit" value={new Date(assignment.created_at).toLocaleDateString("de-DE")} />
                    <form action={removeCoachAssignment} className="flex md:justify-end">
                      <input type="hidden" name="coachId" value={assignment.coach_id} />
                      <input type="hidden" name="athleteId" value={assignment.athlete_id} />
                      <Button type="submit" variant="ghost" className="px-2 text-[var(--warn)]" title="Zuordnung entfernen">
                        <Trash2 size={18} />
                      </Button>
                    </form>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </>
  );
}

async function loadAdminCoachData(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
): Promise<AdminCoachData> {
  const [{ data: roles, error: rolesError }, { data: assignments, error: assignmentsError }] = await Promise.all([
    supabase
      .from("user_roles")
      .select("user_id,role")
      .order("updated_at", { ascending: false })
      .limit(ADMIN_COACH_QUERY_LIMIT),
    supabase
      .from("coach_athletes")
      .select("coach_id,athlete_id,created_at")
      .order("created_at", { ascending: false })
      .limit(ADMIN_COACH_QUERY_LIMIT),
  ]);

  if (rolesError) throw new Error(rolesError.message);
  if (assignmentsError) throw new Error(assignmentsError.message);

  const roleRows = (roles ?? []) as RoleRow[];
  const roleIds = Array.from(new Set(roleRows.map((role) => role.user_id)));
  const profileById = await loadProfilesById(
    supabase,
    roleIds,
  );

  const rolesByUser = new Map<string, RoleRow["role"][]>();
  for (const row of roleRows) {
    rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), row.role]);
  }

  const users = roleIds.map((userId) => {
    const profile = profileById.get(userId);
    return {
      user_id: userId,
      roles: normalizeRoles(rolesByUser.get(userId)),
      email: profile?.email ?? userId,
      name: profile?.full_name || profile?.email || userId,
    };
  });

  return {
    users,
    coaches: users.filter((user) => user.roles.includes("coach")),
    athletes: users.filter((user) => !user.roles.includes("coach") && !user.roles.includes("admin")),
    assignments: (assignments ?? []) as AssignmentRow[],
  };
}

async function loadProfilesById(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  ids: string[],
) {
  if (ids.length === 0) return new Map<string, ProfileRow>();

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name")
    .in("id", ids)
    .limit(ids.length);

  if (error) throw new Error(error.message);
  return new Map(((data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
}

function AdminMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="surface p-5">
      <p className="mono flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--subtle)]">
        {icon}
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function UserLabel({ name, email }: { name: string; email: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium">{name}</p>
      <p className="mono mt-1 truncate text-xs text-[var(--subtle)]">{email}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function normalizeRoles(roles: RoleRow["role"][] | undefined) {
  const uniqueRoles = Array.from(new Set(roles ?? []));
  return uniqueRoles.length > 0 ? uniqueRoles : ["user" as const];
}

function formatRoles(roles: RoleRow["role"][]) {
  return roles
    .map((role) => {
      if (role === "admin") return "Admin";
      if (role === "coach") return "Coach";
      return "User";
    })
    .join(", ");
}
