import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { getCartSnapshot } from "@/lib/cart/service";
import { listAddresses } from "@/lib/orders/service";
import { DELIVERY_METHODS, formatAddressLine, requiresDeliveryLocation, shippingCentsForMethod } from "@/lib/pricing";

export async function GET(request: Request) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const deliveryMethodId = searchParams.get("delivery") ?? "standard";
  const originLatRaw = searchParams.get("origin_lat");
  const originLonRaw = searchParams.get("origin_lon");
  const originLat = originLatRaw == null || originLatRaw === "" ? undefined : Number(originLatRaw);
  const originLon = originLonRaw == null || originLonRaw === "" ? undefined : Number(originLonRaw);
  const destination = formatAddressLine({
    line1: searchParams.get("line1") ?? "",
    city: searchParams.get("city") ?? "",
    state: searchParams.get("state") ?? "",
    zip: searchParams.get("zip") ?? "",
  });

  const cart = await getCartSnapshot({
    userId: account.userId,
    accountTier: account.accountTier,
    taxExempt: account.taxExempt,
    deliveryMethodId,
    shippingState: searchParams.get("state") ?? undefined,
    originLocation: searchParams.get("origin") ?? undefined,
    originLat: Number.isFinite(originLat) ? originLat : undefined,
    originLon: Number.isFinite(originLon) ? originLon : undefined,
    destination: destination || undefined,
  });

  const deliveryKm = cart.totals.delivery_km ?? null;
  return NextResponse.json({
    cart,
    delivery_methods: DELIVERY_METHODS.map((method) =>
      requiresDeliveryLocation(method.id) && deliveryKm != null
        ? {
            ...method,
            shipping_cents: shippingCentsForMethod(method.id, cart.totals.subtotal_cents, deliveryKm),
          }
        : method,
    ),
    addresses: await listAddresses(account.userId),
    customer: { name: account.fullName, email: account.email },
    tax_exempt: account.taxExempt,
  });
}
