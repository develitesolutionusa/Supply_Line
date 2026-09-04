const buckets = new Map<string, { count: number; resetAt: number }>();

export function memoryRateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  current.count += 1;
  if (current.count > limit) {
    return { ok: false, remaining: 0 };
  }
  return { ok: true, remaining: limit - current.count };
}

export function rateLimit(key: string, limit = 60, windowMs = 60_000) {
  return memoryRateLimit(key, limit, windowMs);
}

export async function limitRequest(key: string, limit = 60, windowMs = 60_000) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return memoryRateLimit(key, limit, windowMs);
  }

  try {
    const seconds = Math.max(1, Math.ceil(windowMs / 1000));
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(seconds), "NX"],
      ]),
    });
    if (!response.ok) {
      return memoryRateLimit(key, limit, windowMs);
    }
    const payload = (await response.json()) as Array<{ result?: number } | [null, number]>;
    const first = payload[0];
    const count = Array.isArray(first) ? Number(first[1]) : Number(first?.result ?? 0);
    if (!Number.isFinite(count) || count <= 0) {
      return memoryRateLimit(key, limit, windowMs);
    }
    return { ok: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    return memoryRateLimit(key, limit, windowMs);
  }
}