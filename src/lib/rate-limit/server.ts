import { headers } from "next/headers";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export async function assertRateLimit(
  scope: string,
  limit = 12,
  windowMs = 60_000,
) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for") ?? "local";
  const ip = forwardedFor.split(",")[0]?.trim() ?? "local";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new Error("Rate limit exceeded.");
  }

  current.count += 1;
}
