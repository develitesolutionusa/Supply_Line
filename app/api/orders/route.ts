import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { getOrder, listOrdersForUser } from "@/lib/orders/service";

export async function GET() {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const orders = await listOrdersForUser(account.userId, account.orgId);
  return NextResponse.json({ orders });
}
