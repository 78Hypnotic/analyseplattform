import { describe, expect, it } from "vitest";
import type { AppRole } from "@/lib/auth/roles";
import { canMutateAthlete } from "./coach-access-policy";

const ACTOR_ID = "11111111-1111-4111-8111-111111111111";
const ATHLETE_ID = "22222222-2222-4222-8222-222222222222";

function roles(...values: AppRole[]) {
  return new Set(values);
}

describe("canMutateAthlete", () => {
  it("allows users to mutate their own athlete data", () => {
    expect(canMutateAthlete({
      actorId: ACTOR_ID,
      athleteId: ACTOR_ID,
      roles: roles("user"),
      isAssigned: false,
    })).toBe(true);
  });

  it("allows admins without an assignment", () => {
    expect(canMutateAthlete({
      actorId: ACTOR_ID,
      athleteId: ATHLETE_ID,
      roles: roles("admin"),
      isAssigned: false,
    })).toBe(true);
  });

  it("allows coaches only for assigned athletes", () => {
    expect(canMutateAthlete({
      actorId: ACTOR_ID,
      athleteId: ATHLETE_ID,
      roles: roles("coach"),
      isAssigned: true,
    })).toBe(true);
    expect(canMutateAthlete({
      actorId: ACTOR_ID,
      athleteId: ATHLETE_ID,
      roles: roles("coach"),
      isAssigned: false,
    })).toBe(false);
  });

  it("rejects regular users mutating another athlete", () => {
    expect(canMutateAthlete({
      actorId: ACTOR_ID,
      athleteId: ATHLETE_ID,
      roles: roles("user"),
      isAssigned: true,
    })).toBe(false);
  });
});
