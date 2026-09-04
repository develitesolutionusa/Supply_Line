import { NextResponse } from "next/server";
import { limitRequest } from "@/lib/rate-limit";

export async function withPublicRateLimit(
  request: Request,
  keyPrefix: string,
  limit = 120,
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const result = await limitRequest(`${keyPrefix}:${ip}`, limit, 60_000);
  if (!result.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return null;
}
