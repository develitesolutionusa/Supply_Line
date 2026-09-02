import { NextResponse } from "next/server";
import { archiveProduct, upsertProduct } from "@/lib/admin/service";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/requireRole";
import { getProductById } from "@/lib/catalog/query";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const product = await getProductById(id, "business", true);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();
    const product = await upsertProduct({ ...body, id });
    return NextResponse.json({ product });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const product = await archiveProduct(id);
    return NextResponse.json({ product });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
