import { notFound } from "next/navigation";
import { DashboardHome } from "@/components/dashboard-home";

export const dynamic = "force-dynamic";

export default function DashboardPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <DashboardHome
      profile={{
        fullName: "Lena Bergmann",
        city: "Hamburg",
        age: 34,
        heightCm: 172,
        weightKg: 63.5,
        fitnessLevel: 4,
        disciplines: ["Schwimmen", "Laufen", "Radfahren"],
        isComplete: true,
        latestSwimAnalyzedAt: "2026-08-18T08:00:00Z",
        latestSwimCssPaceSec: 105,
        latestRunAnalyzedAt: "2026-08-12T08:00:00Z",
        latestRunCsPaceSec: 286,
        latestBikeAnalyzedAt: "2026-07-29T08:00:00Z",
        latestBikeFtpWatt: 238,
      }}
      analyses={[
        {
          id: "swim-preview",
          title: "CSS & Technik · August",
          discipline: "swim",
          createdAt: "2026-08-18T08:00:00Z",
        },
        {
          id: "run-preview",
          title: "Critical Speed · Sommerblock",
          discipline: "run",
          createdAt: "2026-08-12T08:00:00Z",
        },
        {
          id: "bike-preview",
          title: "FTP & Stoffwechselprofil",
          discipline: "bike",
          createdAt: "2026-07-29T08:00:00Z",
        },
      ]}
      swimTechniqueAxes={[
        { group: "Wasserlage", score: 85, status: "stark", statement: "Stabile Wasserlage" },
        { group: "Atmung", score: 55, status: "offen", statement: "Keine Angabe im Kontext" },
        { group: "Zugphase", score: 30, status: "fokus", statement: "Frühes Wasserfassen verbessern" },
        { group: "Druckphase", score: 30, status: "fokus", statement: "Druck bis zum Ende halten" },
        { group: "Rückführung", score: 85, status: "stark", statement: "Lockere Rückführung" },
        { group: "Rotation", score: 55, status: "offen", statement: "Keine Angabe im Kontext" },
        { group: "Beinarbeit", score: 30, status: "fokus", statement: "Beine ermüden schnell" },
      ]}
      activeTrainingPlan={null}
      trainingPlanAccess="admin"
      isCoach
      isAdmin
      coachAthleteCount={12}
    />
  );
}