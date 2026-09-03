import { NextResponse } from "next/server";
import { setProductImage } from "@/lib/admin/service";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/requireRole";
import { uploadProductImage } from "@/lib/storage/products";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const imageUrl = await uploadProductImage(id, file);
    const product = await setProductImage(id, imageUrl);
    return NextResponse.json({ product, image_url: imageUrl });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
