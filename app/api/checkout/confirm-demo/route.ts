import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { sendOrderConfirmation } from "@/lib/email";
import { getOrder, markOrderPaid } from "@/lib/orders/service";
import { stripeConfigured } from "@/lib/stripe/server";

export async function POST(request: Request) {
  if (stripeConfigured()) {
    return NextResponse.json(
      { error: "Demo payment is disabled when Stripe keys are present" },
      { status: 400 },
    );
  }

  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json()) as { order_id?: string };
  if (!body.order_id) {
    return NextResponse.json({ error: "order_id is required" }, { status: 400 });
  }

  const order = await getOrder(body.order_id);
  if (!order || (order.user_id !== account.userId && order.org_id !== account.orgId)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const paid = await markOrderPaid(order.id);
  await sendOrderConfirmation(paid, account.email);
  return NextResponse.json({ order: paid });
}
