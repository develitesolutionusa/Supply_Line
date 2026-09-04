import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrder, getOrderByPaymentIntent, markOrderPaid, markOrderPaymentFailed } from "@/lib/orders/service";
import { sendOrderConfirmation } from "@/lib/email";
import { logError, logInfo } from "@/lib/observability";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { stripeWebhookAction } from "@/lib/stripe/webhook";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 501 });
  }

  const body = await request.text();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    logError("stripe.webhook.signature", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  logInfo("stripe.webhook", { type: event.type, id: event.id });

  try {
    const action = stripeWebhookAction(event);
    if (action.action === "ignore") {
      return NextResponse.json({ received: true });
    }

    const order = action.orderId
      ? await getOrder(action.orderId)
      : await getOrderByPaymentIntent(action.paymentIntentId);
    if (!order) {
      return NextResponse.json({ received: true });
    }

    if (action.action === "mark_paid") {
      const { order: paid, newlyPaid } = await markOrderPaid(order.id);
      if (newlyPaid) {
        const supabase = createServiceClient();
        const { data: buyer } = await supabase
          .from("users")
          .select("email")
          .eq("clerk_user_id", paid.user_id)
          .maybeSingle();
        await sendOrderConfirmation(paid, buyer?.email ?? null);
      }
    } else {
      await markOrderPaymentFailed(order.id);
    }
  } catch (error) {
    logError("stripe.webhook.handler", error, { type: event.type, id: event.id });
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
