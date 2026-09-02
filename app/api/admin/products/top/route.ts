import { NextResponse } from "next/server";
import { topProducts } from "@/lib/admin/service";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/requireRole";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ products: await topProducts() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
