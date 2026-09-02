import { NextResponse } from "next/server";
import { adjustInventory } from "@/lib/admin/service";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/requireRole";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as { quantity_on_hand?: number };
    if (typeof body.quantity_on_hand !== "number") {
      return NextResponse.json({ error: "quantity_on_hand is required" }, { status: 400 });
    }
    const result = await adjustInventory(id, body.quantity_on_hand);
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
