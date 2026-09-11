import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { SEARCH_RATE_LIMIT, withPublicRateLimit } from "@/lib/http";
import { isValidCoord } from "@/lib/places";
import { resolveRegion, searchPlaces } from "@/lib/places-catalog";

export async function GET(request: Request) {
  const limited = await withPublicRateLimit(request, "checkout-places", SEARCH_RATE_LIMIT);
  if (limited) return limited;

  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const countryCode = searchParams.get("countryCode")?.trim() ?? "";
  const latRaw = searchParams.get("lat");
  const lonRaw = searchParams.get("lon");
  const lat = latRaw == null || latRaw === "" ? undefined : Number(latRaw);
  const lon = lonRaw == null || lonRaw === "" ? undefined : Number(lonRaw);

  if (lat != null || lon != null) {
    if (lat == null || lon == null || !isValidCoord(lat, lon)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }
  }

  try {
    if (lat != null && lon != null && q.length < 2) {
      return NextResponse.json(await resolveRegion(lat, lon));
    }

    return NextResponse.json({
      places: await searchPlaces({ q, lat, lon, countryCode }),
    });
  } catch {
    return NextResponse.json({ places: [] });
  }
}
