import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
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
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <ReportView input={analysis.input} result={analysis.result} />
      </main>
    </>
  );
}
