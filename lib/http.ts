import { NextResponse } from "next/server";
import { limitRequest } from "@/lib/rate-limit";

export const PUBLIC_RATE_LIMIT = 120;
export const SEARCH_RATE_LIMIT = 40;
export const WEBHOOK_RATE_LIMIT = 300;

export async function withPublicRateLimit(
  request: Request,
  keyPrefix: string,
  limit = PUBLIC_RATE_LIMIT,
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const result = await limitRequest(`${keyPrefix}:${ip}`, limit, 60_000);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  return null;
}

export function withWebhookRateLimit(request: Request, keyPrefix: string) {
  return withPublicRateLimit(request, keyPrefix, WEBHOOK_RATE_LIMIT);
}
