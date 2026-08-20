import { notFound } from "next/navigation";
import { DashboardHome } from "@/components/dashboard-home";
import { buildDashboardImprovements } from "@/lib/dashboard/improvements";

export const dynamic = "force-dynamic";

export default function DashboardPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const improvements = buildDashboardImprovements([
    { discipline: "swim", result: { cssPace: 112 }, created_at: "2026-06-18T08:00:00Z" },
    { discipline: "swim", result: { cssPace: 108 }, created_at: "2026-07-18T08:00:00Z" },
    { discipline: "swim", result: { cssPace: 105 }, created_at: "2026-08-18T08:00:00Z" },
    { discipline: "run", result: { csPaceSecPerKm: 300 }, created_at: "2026-07-12T08:00:00Z" },
    { discipline: "run", result: { csPaceSecPerKm: 286 }, created_at: "2026-08-12T08:00:00Z" },
    { discipline: "bike", result: { ftpWatt: 224 }, created_at: "2026-06-29T08:00:00Z" },
    { discipline: "bike", result: { ftpWatt: 232 }, created_at: "2026-07-29T08:00:00Z" },
    { discipline: "bike", result: { ftpWatt: 238 }, created_at: "2026-08-19T08:00:00Z" },
  ]);

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
      improvements={improvements}
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