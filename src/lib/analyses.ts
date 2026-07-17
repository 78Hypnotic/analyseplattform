import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnalysisInput, AnalysisResult, StoredAnalysis } from "./analysis/types";

type AnalysisRow = {
  id: string;
  title: string;
  input: AnalysisInput;
  result: AnalysisResult;
  created_at: string;
  user_id: string;
  created_by: string | null;
  created_by_name: string | null;
  updated_by: string | null;
  updated_by_name: string | null;
  updated_at: string;
};

export async function getUserAnalyses(limit = 20): Promise<StoredAnalysis[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("analyses")
    .select("id,title,input,result,created_at,user_id,created_by,created_by_name,updated_by,updated_by_name,updated_at")
    .eq("user_id", user.id)
    .eq("discipline", "swim")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as AnalysisRow[];
}

export async function getAnalysisById(id: string): Promise<StoredAnalysis | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("analyses")
    .select("id,title,input,result,created_at,user_id,created_by,created_by_name,updated_by,updated_by_name,updated_at")
    .eq("id", id)
    .eq("discipline", "swim")
    .single();

  if (error) return null;
  return data as AnalysisRow;
}
