import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { attachPaymentIntent, placeOrder } from "@/lib/orders/service";
import { getStripe, stripeConfigured } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json()) as {
    delivery_method?: string;
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

  try {
    const order = await placeOrder({
      userId: account.userId,
      orgId: account.orgId,
      accountTier: account.accountTier,
      taxExempt: account.taxExempt,
      deliveryMethodId: body.delivery_method ?? "standard",
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

    if (!stripeConfigured()) {
      return NextResponse.json({
        order,
        client_secret: null,
        payment_mode: "demo" as const,
      });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const intent = await stripe.paymentIntents.create({
      amount: order.total_cents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { order_id: order.id, user_id: account.userId },
    });

    await attachPaymentIntent(order.id, intent.id);

    return NextResponse.json({
      order: { ...order, stripe_payment_intent_id: intent.id },
      client_secret: intent.client_secret,
      payment_mode: "stripe" as const,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create payment" },
      { status: 400 },
    );
  }
}
