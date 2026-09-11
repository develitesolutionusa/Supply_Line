import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { placeOrder } from "@/lib/orders/service";
import { requiresDeliveryLocation } from "@/lib/pricing";
import { logError } from "@/lib/observability";

export async function POST(request: Request) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json()) as {
    delivery_method?: string;
    origin_location?: string;
    origin_lat?: number;
    origin_lon?: number;
    address?: {
      label?: string;
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      zip?: string;
    };
  };

  if (!body.address?.line1 || !body.address.city || !body.address.state || !body.address.zip) {
    return NextResponse.json({ error: "Shipping address is required" }, { status: 400 });
  }

  const deliveryMethod = body.delivery_method ?? "standard";
  if (requiresDeliveryLocation(deliveryMethod) && !body.origin_location?.trim()) {
    return NextResponse.json(
      { error: "Current location is required for local and expedited delivery." },
      { status: 400 },
    );
  }

  try {
    const order = await placeOrder({
      userId: account.userId,
      orgId: account.orgId,
      accountTier: account.accountTier,
      taxExempt: account.taxExempt,
      deliveryMethodId: deliveryMethod,
      originLocation: body.origin_location,
      originLat: body.origin_lat,
      originLon: body.origin_lon,
      address: {
        label: body.address.label ?? "Shipping",
        line1: body.address.line1,
        line2: body.address.line2 ?? "",
        city: body.address.city,
        state: body.address.state,
        zip: body.address.zip,
        is_default: true,
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    logError("checkout.create-order", error, { userId: account.userId });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create order" },
      { status: 400 },
    );
  }
}
