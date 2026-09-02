import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export function withPublicRateLimit(request: Request, keyPrefix: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const result = rateLimit(`${keyPrefix}:${ip}`, 120, 60_000);
  if (!result.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return null;
}
