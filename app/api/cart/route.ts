import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { addCasesToCart, getCartSnapshot } from "@/lib/cart/service";
import { DELIVERY_METHODS } from "@/lib/pricing";

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

  return NextResponse.json({
    ...cart,
    delivery_methods: DELIVERY_METHODS,
    account_tier: account.accountTier,
    tax_exempt: account.taxExempt,
  });
}

export async function POST(request: Request) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json()) as { product_id?: string; cases?: number };
  if (!body.product_id || !body.cases) {
    return NextResponse.json({ error: "product_id and cases are required" }, { status: 400 });
  }

  try {
    await addCasesToCart(account.userId, body.product_id, Number(body.cases));
    const cart = await getCartSnapshot({
      userId: account.userId,
      accountTier: account.accountTier,
      taxExempt: account.taxExempt,
    });
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not add to cart" },
      { status: 400 },
    );
  }
}
