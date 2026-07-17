import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RunInput, RunResult, StoredRunAnalysis } from "./running/types";

type RunAnalysisRow = {
  id: string;
  title: string;
  input: RunInput;
  result: RunResult;
  created_at: string;
  user_id: string;
  created_by: string | null;
  created_by_name: string | null;
  updated_by: string | null;
  updated_by_name: string | null;
  updated_at: string;
};

export async function getUserRunAnalyses(limit = 20): Promise<StoredRunAnalysis[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("analyses")
    .select("id,title,input,result,created_at,user_id,created_by,created_by_name,updated_by,updated_by_name,updated_at")
    .eq("user_id", user.id)
    .eq("discipline", "run")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as RunAnalysisRow[];
}

export async function getRunAnalysisById(id: string): Promise<StoredRunAnalysis | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("analyses")
    .select("id,title,input,result,created_at,user_id,created_by,created_by_name,updated_by,updated_by_name,updated_at")
    .eq("id", id)
    .eq("discipline", "run")
    .single();

  if (error) return null;
  return data as RunAnalysisRow;
}
