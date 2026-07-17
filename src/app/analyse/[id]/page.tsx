import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AnalysisAttribution } from "@/components/analysis-attribution";
import { PdfExportButton } from "@/components/pdf-export-button";
import { ReportView } from "@/components/report-view";
import { getAnalysisById } from "@/lib/analyses";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;
  const analysis = await getAnalysisById(id);
  if (!analysis) notFound();

  return (
    <>
      <AppHeader />
      <main className="print-report mx-auto w-full max-w-6xl px-5 py-10">
        <div className="no-print mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              Report
            </p>
            <h1 className="mt-2 text-2xl font-semibold">{analysis.title}</h1>
            <AnalysisAttribution audit={analysis} className="mt-2" />
          </div>
          <PdfExportButton />
        </div>
        <ReportView input={analysis.input} result={analysis.result} />
      </main>
    </>
  );
}
