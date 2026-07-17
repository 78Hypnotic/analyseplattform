import type { AppRole } from "@/lib/auth/roles";

export function canMutateAthlete({
  actorId,
  athleteId,
  roles,
  isAssigned,
}: {
  actorId: string;
  athleteId: string;
  roles: ReadonlySet<AppRole>;
  isAssigned: boolean;
}) {
  if (actorId === athleteId) return true;
  if (roles.has("admin")) return true;
  return roles.has("coach") && isAssigned;
}
