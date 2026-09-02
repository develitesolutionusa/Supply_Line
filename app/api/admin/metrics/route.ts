import { NextResponse } from "next/server";
import { adminMetrics } from "@/lib/admin/service";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/requireRole";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await adminMetrics());
  } catch (error) {
    return adminErrorResponse(error);
  }
}
