import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrder, getOrderByPaymentIntent, markOrderPaid, markOrderPaymentFailed } from "@/lib/orders/service";
import { sendOrderConfirmation } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

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
    console.error("[stripe webhook] signature failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.info("[stripe webhook]", { type: event.type, id: event.id });

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const orderId = intent.metadata.order_id;
      const order = orderId ? await getOrder(orderId) : await getOrderByPaymentIntent(intent.id);
      if (order) {
        const paid = await markOrderPaid(order.id);
        const supabase = createServiceClient();
        const { data: buyer } = await supabase
          .from("users")
          .select("email")
          .eq("clerk_user_id", paid.user_id)
          .maybeSingle();
        await sendOrderConfirmation(paid, buyer?.email ?? null);
      }
    }
    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;
      const orderId = intent.metadata.order_id;
      const order = orderId ? await getOrder(orderId) : await getOrderByPaymentIntent(intent.id);
      if (order) {
        await markOrderPaymentFailed(order.id);
      }
    }
  } catch (error) {
    console.error("[stripe webhook] handler failed", error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
