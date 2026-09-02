import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/requireRole";
import { listAllOrders } from "@/lib/orders/service";
import type { OrderStatus } from "@/types/commerce";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as OrderStatus | null;
    const orders = await listAllOrders(status || undefined);
    return NextResponse.json({ orders });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
