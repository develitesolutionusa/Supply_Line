import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/requireRole";
import { getOrder, updateOrderStatus } from "@/lib/orders/service";
import type { OrderStatus } from "@/types/commerce";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as { status?: OrderStatus };
    if (!body.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }
    const existing = await getOrder(id);
    if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const order = await updateOrderStatus(id, body.status);
    return NextResponse.json({ order });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
