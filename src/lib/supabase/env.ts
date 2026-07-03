export function getSupabaseEnv() {
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)) {
    throw new Error("Supabase URL must use the format https://<project-ref>.supabase.co.");
  }

  return { url, anonKey };
}

export function getSupabaseAdminEnv() {
  const { url } = getSupabaseEnv();
  const adminKey =
    cleanEnvValue(process.env.SUPABASE_SECRET_KEY) || cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!adminKey) {
    throw new Error("Supabase admin API key is missing.");
  }

  return { url, adminKey };
}

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "");
}
