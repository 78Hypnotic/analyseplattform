import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BikeInput, BikeResult, StoredBikeAnalysis } from "./cycling/types";

type BikeAnalysisRow = {
  id: string;
  title: string;
  input: BikeInput;
  result: BikeResult;
  created_at: string;
  user_id: string;
  created_by: string | null;
  created_by_name: string | null;
  updated_by: string | null;
  updated_by_name: string | null;
  updated_at: string;
};

export async function getUserBikeAnalyses(limit = 20): Promise<StoredBikeAnalysis[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("analyses")
    .select("id,title,input,result,created_at,user_id,created_by,created_by_name,updated_by,updated_by_name,updated_at")
    .eq("user_id", user.id)
    .eq("discipline", "bike")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as BikeAnalysisRow[];
}

export async function getBikeAnalysisById(id: string): Promise<StoredBikeAnalysis | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("analyses")
    .select("id,title,input,result,created_at,user_id,created_by,created_by_name,updated_by,updated_by_name,updated_at")
    .eq("id", id)
    .eq("discipline", "bike")
    .single();

  if (error) return null;
  return data as BikeAnalysisRow;
}
