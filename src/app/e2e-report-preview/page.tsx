import { notFound } from "next/navigation";
import { CyclingReportView } from "@/components/cycling-report-view";
import { ReportView } from "@/components/report-view";
import { runAnalysis } from "@/lib/analysis/calculations";
import type { AnalysisInput } from "@/lib/analysis/types";
import { runBikeAnalysis } from "@/lib/cycling/calculations";
import { DEFAULT_BIKE_INPUT } from "@/lib/cycling/constants";

export const dynamic = "force-dynamic";

const STANDARD_REPORT_INPUT: AnalysisInput = {
  name: "Lena Bergmann",
  age: 34,
  gender: "weiblich",
  height: 172,
  weight: 63,
  bodyFatPercentage: 21,
  fitnessLevel: 3,
  poolLength: 25,
  canSwim400m: true,
  testType: "wall_push",
  equipment: "ohne",
  t50: "38.2",
  s50: 22,
  t200: "3:38",
  s200: 21,
  t400: "7:48",
  s400: 22,
  goal: "Triathlon",
  level: "Fortgeschritten",
  targetDistance: "MD",
  raceDate: "",
  swimSessionsPerWeek: 3,
  challenges: [],
};

export default async function ReportPreviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ discipline?: string | string[]; mode?: string | string[] }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const discipline = Array.isArray(params?.discipline) ? params.discipline[0] : params?.discipline;
  if (discipline === "bike") {
    const bikeResult = runBikeAnalysis(DEFAULT_BIKE_INPUT);
    if (!bikeResult) notFound();
    return (
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <CyclingReportView input={DEFAULT_BIKE_INPUT} result={bikeResult} />
      </main>
    );
  }

  const mode = Array.isArray(params?.mode) ? params.mode[0] : params?.mode;
  const input = mode === "technique" ? buildTechniqueOnlyInput() : STANDARD_REPORT_INPUT;
  const result = runAnalysis(input);

  if (!result) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <ReportView input={input} result={result} />
    </main>
  );
}

function buildTechniqueOnlyInput(): AnalysisInput {
  return {
    ...STANDARD_REPORT_INPUT,
    canSwim400m: false,
    t400: "",
    s400: undefined,
  };
}
