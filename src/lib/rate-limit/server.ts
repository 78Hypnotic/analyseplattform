import { headers } from "next/headers";

type Bucket = {
  count: number;
  resetAt: number;
};

const MAX_TRACKED_BUCKETS = 10_000;
const buckets = new Map<string, Bucket>();

export async function assertRateLimit(
  scope: string,
  limit = 12,
  windowMs = 60_000,
) {
  const key = `${scope}:${await getClientIp()}`;
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    pruneExpiredBuckets(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new Error("Rate limit exceeded.");
  }

  current.count += 1;
}

/**
 * Vercel setzt `x-vercel-forwarded-for` selbst, während `x-forwarded-for` vom Client
 * vorbelegt sein kann und deshalb nur als Fallback dient.
 */
async function getClientIp() {
  const headerStore = await headers();
  const trusted = headerStore.get("x-vercel-forwarded-for") ?? headerStore.get("x-real-ip");
  if (trusted) return trusted.split(",")[0]?.trim() || "local";

  const forwardedFor = headerStore.get("x-forwarded-for") ?? "local";
  return forwardedFor.split(",")[0]?.trim() || "local";
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size < MAX_TRACKED_BUCKETS) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
