import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { getCartSnapshot } from "@/lib/cart/service";
import { listAddresses } from "@/lib/orders/service";
import { DELIVERY_METHODS } from "@/lib/pricing";
import { stripeConfigured } from "@/lib/stripe/server";

export async function GET(request: Request) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const cart = await getCartSnapshot({
    userId: account.userId,
    accountTier: account.accountTier,
    taxExempt: account.taxExempt,
    deliveryMethodId: searchParams.get("delivery") ?? "standard",
    shippingState: searchParams.get("state") ?? undefined,
  });
  const addresses = await listAddresses(account.userId);
  return NextResponse.json({
    cart,
    delivery_methods: DELIVERY_METHODS,
    addresses,
    customer: { name: account.fullName, email: account.email },
    tax_exempt: account.taxExempt,
    stripe_configured: stripeConfigured(),
  });
}
