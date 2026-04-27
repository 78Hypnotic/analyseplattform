import { AppHeader } from "@/components/app-header";
import { AnalysisFlow } from "./analysis-flow";

export const dynamic = "force-dynamic";

export default async function NewAnalysisPage({
  searchParams,
}: {
  searchParams?: Promise<{ resume?: string | string[] }>;
}) {
  const params = await searchParams;
  const resume = Array.isArray(params?.resume) ? params.resume[0] === "1" : params?.resume === "1";

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <AnalysisFlow resumePendingAnalysis={resume} />
      </main>
    </>
  );
}
