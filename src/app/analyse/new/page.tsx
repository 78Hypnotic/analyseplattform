import { AppHeader } from "@/components/app-header";
import { AnalysisFlow } from "./analysis-flow";

export const dynamic = "force-dynamic";

export default function NewAnalysisPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <AnalysisFlow />
      </main>
    </>
  );
}
