import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { SEARCH_RATE_LIMIT, withPublicRateLimit } from "@/lib/http";
import { DEFAULT_COUNTRY, isValidCoord, type PlaceKind } from "@/lib/places";
import { listCities, listCountries, listStates, resolveRegion, searchMixed, searchStreets } from "@/lib/places-catalog";

const KINDS = new Set<PlaceKind>(["country", "state", "city", "street"]);

export async function GET(request: Request) {
  const limited = await withPublicRateLimit(request, "checkout-places", SEARCH_RATE_LIMIT);
  if (limited) return limited;

  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kindParam = searchParams.get("kind")?.trim() ?? "";
  const kind = KINDS.has(kindParam as PlaceKind) ? (kindParam as PlaceKind) : "";
  const q = searchParams.get("q")?.trim() ?? "";
  const country = searchParams.get("country")?.trim() || DEFAULT_COUNTRY;
  const state = searchParams.get("state")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";
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
    if (lat != null && lon != null && !kind) {
      const { region, location } = await resolveRegion(lat, lon);
      const places = await searchMixed({
        q,
        country: region.country,
        countryCode: region.countryCode,
        state: region.state,
        city: region.city,
      });
      return NextResponse.json({ location, region, places });
    }

    if (kind === "country") {
      return NextResponse.json({ places: await listCountries(q) });
    }
    if (kind === "state") {
      return NextResponse.json({ places: await listStates(country, q) });
    }
    if (kind === "city") {
      return NextResponse.json({ places: await listCities(country, state, q) });
    }
    if (kind === "street") {
      return NextResponse.json({
        places: await searchStreets({ q, country, countryCode, state, city }),
      });
    }

    return NextResponse.json({
      places: await searchMixed({ q, country, countryCode, state, city }),
    });
  } catch {
    return NextResponse.json({ places: [] });
  }
}
