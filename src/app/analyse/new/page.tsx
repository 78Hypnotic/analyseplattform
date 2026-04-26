import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnalysisFlow } from "./analysis-flow";

export const dynamic = "force-dynamic";

export default async function NewAnalysisPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <>
      <AppHeader userEmail={user.email} />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <AnalysisFlow />
      </main>
    </>
  );
}
