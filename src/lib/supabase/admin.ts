import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "./env";

export function createSupabaseAdminClient() {
  const { url, adminKey } = getSupabaseAdminEnv();

  return createClient(url, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
