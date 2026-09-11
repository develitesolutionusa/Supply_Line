import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { isValidCoord } from "@/lib/places";
import { reverseGeocode } from "@/lib/places-catalog";

export async function GET(request: Request) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  if (!isValidCoord(lat, lon)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    return NextResponse.json(await reverseGeocode(lat, lon));
  } catch {
    return NextResponse.json({ location: `${lat.toFixed(5)}, ${lon.toFixed(5)}` });
  }
}
