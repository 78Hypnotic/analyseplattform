export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)) {
    throw new Error("Supabase URL must use the format https://<project-ref>.supabase.co.");
  }

  return { url, anonKey };
}
