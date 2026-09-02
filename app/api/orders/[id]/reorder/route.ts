import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { addCasesToCart } from "@/lib/cart/service";
import { reorderPreview } from "@/lib/orders/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await context.params;
  const preview = await reorderPreview(id, account.accountTier);
  if (!preview || (preview.order.user_id !== account.userId && preview.order.org_id !== account.orgId)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json(preview);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await request.json()) as { items?: { product_id: string; cases: number }[] };
  const preview = await reorderPreview(id, account.accountTier);
  if (!preview) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const requested = body.items ?? preview.items.map((item) => ({
    product_id: item.product_id,
    cases: item.cases,
  }));

  for (const item of requested) {
    const live = preview.items.find((row) => row.product_id === item.product_id);
    if (!live || live.out_of_stock) continue;
    await addCasesToCart(account.userId, item.product_id, item.cases);
  }

  return NextResponse.json({ ok: true });
}
