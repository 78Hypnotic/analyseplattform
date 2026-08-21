import { MessageSquare, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/button";
import { requireAdmin } from "@/lib/auth/roles";
import { grantCommunityMembership, revokeCommunityMembership, setCommunityMembershipStatus } from "./actions";

export const dynamic = "force-dynamic";

const QUERY_LIMIT = 1000;
const MEMBERSHIP_STATUS = ["active", "paused", "cancelled", "expired"] as const;

type SupabaseAdminClient = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

type CommunityRow = {
  id: string;
  slug: string;
  coach_id: string;
  library_id: string;
};

type MembershipRow = {
  id: string;
  user_id: string;
  library_id: string;
  status: (typeof MEMBERSHIP_STATUS)[number];
  valid_until: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

export default async function AdminCommunitiesPage() {
  const { supabase } = await requireAdmin();
  const { communities, memberships, profiles } = await loadData(supabase);
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-5 py-6">
      <section>
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Admin / Communities</p>
        <h1 className="mt-2 text-3xl font-semibold">Gruppencoaching-Zugänge</h1>
        <p className="muted mt-3 max-w-2xl">
          Wer hier eine aktive Mitgliedschaft hat, sieht den Chat der jeweiligen Coach-Community. Die
          Plattform-Community ist für alle angemeldeten Nutzer offen und braucht keine Freigabe.
        </p>
      </section>

      {communities.length === 0 ? (
        <p className="surface p-8 text-sm text-[var(--muted)]">
          Noch keine Coach-Community vorhanden. Sie entsteht, sobald ein Coach seine Bibliothek anlegt.
        </p>
      ) : (
        communities.map((community) => {
          const communityMemberships = memberships.filter((membership) => membership.library_id === community.library_id);
          const memberIds = new Set(communityMemberships.map((membership) => membership.user_id));
          const candidates = profiles.filter((profile) => !memberIds.has(profile.id) && profile.id !== community.coach_id);

          return (
            <section key={community.id} className="surface p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--panel-2)] text-[var(--accent)]">
                  <MessageSquare size={18} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">{displayName(profileById.get(community.coach_id))}</h2>
                  <p className="mono text-xs text-[var(--subtle)]">/community/{community.slug}</p>
                </div>
              </div>

              <form action={grantCommunityMembership} className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <input type="hidden" name="libraryId" value={community.library_id} />
                <label className="grid gap-2 text-sm">
                  Mitglied hinzufügen
                  <select name="userId" required disabled={candidates.length === 0}>
                    <option value="">{candidates.length === 0 ? "Keine offenen Nutzer" : "Nutzer auswählen"}</option>
                    {candidates.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {displayName(profile)} ({profile.email ?? profile.id})
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end">
                  <Button type="submit" variant="primary" className="w-full" disabled={candidates.length === 0}>
                    <UserPlus size={16} />
                    Freischalten
                  </Button>
                </div>
              </form>

              <div className="mt-5 grid gap-3">
                {communityMemberships.length === 0 ? (
                  <p className="muted text-sm">Noch keine Mitglieder.</p>
                ) : (
                  communityMemberships.map((membership) => {
                    const profile = profileById.get(membership.user_id);
                    return (
                      <div
                        key={membership.id}
                        className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4 md:grid-cols-[minmax(0,1fr)_auto_auto]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{displayName(profile)}</p>
                          <p className="mono mt-1 truncate text-xs text-[var(--subtle)]">
                            {profile?.email ?? membership.user_id}
                            {membership.valid_until ? ` · bis ${formatDate(membership.valid_until)}` : ""}
                          </p>
                        </div>
                        <form action={setCommunityMembershipStatus} className="flex items-center gap-2">
                          <input type="hidden" name="membershipId" value={membership.id} />
                          <select name="status" defaultValue={membership.status}>
                            {MEMBERSHIP_STATUS.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" variant="secondary">Speichern</Button>
                        </form>
                        <form action={revokeCommunityMembership} className="flex md:justify-end">
                          <input type="hidden" name="membershipId" value={membership.id} />
                          <Button type="submit" variant="ghost" className="px-2 text-[var(--warn)]" title="Mitgliedschaft entfernen">
                            <Trash2 size={18} />
                          </Button>
                        </form>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}

async function loadData(supabase: SupabaseAdminClient) {
  const [communityResult, membershipResult, profileResult] = await Promise.all([
    supabase.from("communities").select("id,slug,coach_id,library_id").eq("kind", "coach").limit(QUERY_LIMIT),
    supabase
      .from("group_coaching_memberships")
      .select("id,user_id,library_id,status,valid_until")
      .order("created_at", { ascending: false })
      .limit(QUERY_LIMIT),
    supabase.from("profiles").select("id,email,full_name").limit(QUERY_LIMIT),
  ]);

  if (communityResult.error) throw new Error(communityResult.error.message);
  if (membershipResult.error) throw new Error(membershipResult.error.message);
  if (profileResult.error) throw new Error(profileResult.error.message);

  return {
    communities: (communityResult.data ?? []) as CommunityRow[],
    memberships: (membershipResult.data ?? []) as MembershipRow[],
    profiles: (profileResult.data ?? []) as ProfileRow[],
  };
}

function displayName(profile: ProfileRow | undefined) {
  return profile?.full_name?.trim() || profile?.email || "Unbekannt";
}

function formatStatus(status: MembershipRow["status"]) {
  if (status === "active") return "Aktiv";
  if (status === "paused") return "Pausiert";
  if (status === "cancelled") return "Gekündigt";
  return "Abgelaufen";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("de-DE");
}
