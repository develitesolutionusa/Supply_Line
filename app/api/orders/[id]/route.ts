import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { getOrder } from "@/lib/orders/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await context.params;
  const order = await getOrder(id);
  if (!order || (order.user_id !== account.userId && order.org_id !== account.orgId)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}
