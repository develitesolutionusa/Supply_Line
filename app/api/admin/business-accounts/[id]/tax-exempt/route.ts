import { NextResponse } from "next/server";
import { setTaxExempt } from "@/lib/admin/service";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/requireRole";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as { tax_exempt?: boolean };
    if (typeof body.tax_exempt !== "boolean") {
      return NextResponse.json({ error: "tax_exempt is required" }, { status: 400 });
    }
    const account = await setTaxExempt(id, body.tax_exempt);
    return NextResponse.json({ account });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
