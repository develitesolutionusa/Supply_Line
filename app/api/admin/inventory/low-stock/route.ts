import { NextResponse } from "next/server";
import { lowStockProducts } from "@/lib/admin/service";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/requireRole";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ products: await lowStockProducts() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
