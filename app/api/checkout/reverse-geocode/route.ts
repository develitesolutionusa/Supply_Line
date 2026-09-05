import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";

export async function GET(request: Request) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&format=json`,
      {
        cache: "no-store",
        headers: { "User-Agent": "SupplyLineWholesale/1.0 (checkout location)" },
      },
    );
    if (!response.ok) {
      return NextResponse.json({ location: `${lat.toFixed(5)}, ${lon.toFixed(5)}` });
    }
    const payload = (await response.json()) as { display_name?: string };
    return NextResponse.json({
      location: payload.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
    });
  } catch {
    return NextResponse.json({ location: `${lat.toFixed(5)}, ${lon.toFixed(5)}` });
  }
}
