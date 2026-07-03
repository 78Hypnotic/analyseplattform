"use client";

import { useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/button";
import { assignAthleteToCoach } from "./actions";
import { AthleteSearchSelect, type AthleteSelectOption } from "./athlete-search-select";

type CoachOption = {
  id: string;
  name: string;
  email: string;
};

type AssignmentOption = {
  coach_id: string;
  athlete_id: string;
};

type CoachAthleteAssignmentFormProps = {
  coaches: CoachOption[];
  athletes: AthleteSelectOption[];
  assignments: AssignmentOption[];
};

/**
 * Keeps coach selection client-side so the athlete search can hide already assigned athletes per coach.
 */
export function CoachAthleteAssignmentForm({
  coaches,
  athletes,
  assignments,
}: CoachAthleteAssignmentFormProps) {
  const [coachId, setCoachId] = useState("");
  const [athleteId, setAthleteId] = useState("");

  const availableAthletes = useMemo(() => {
    if (!coachId) return [];

    const assignedAthleteIds = new Set(
      assignments
        .filter((assignment) => assignment.coach_id === coachId)
        .map((assignment) => assignment.athlete_id),
    );

    return athletes.filter((athlete) => !assignedAthleteIds.has(athlete.id));
  }, [assignments, athletes, coachId]);

  return (
    <form action={assignAthleteToCoach} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
      <label className="grid gap-2 text-sm">
        Coach
        <select
          name="coachId"
          required
          value={coachId}
          onChange={(event) => {
            setCoachId(event.target.value);
            setAthleteId("");
          }}
        >
          <option value="">Coach auswählen</option>
          {coaches.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.name} ({coach.email})
            </option>
          ))}
        </select>
      </label>
      <AthleteSearchSelect
        athletes={availableAthletes}
        disabled={!coachId}
        placeholder={coachId ? "Athlet suchen" : "Erst Coach auswählen"}
        value={athleteId}
        onValueChange={setAthleteId}
      />
      <div className="flex items-end">
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={!coachId || !athleteId || availableAthletes.length === 0}
        >
          <Link2 size={16} />
          Zuordnen
        </Button>
      </div>
    </form>
  );
}
