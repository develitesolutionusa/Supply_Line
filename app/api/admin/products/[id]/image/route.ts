import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { setProductImage } from "@/lib/admin/service";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/requireRole";

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

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${id}${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
    const imageUrl = `/uploads/${filename}`;
    const product = await setProductImage(id, imageUrl);
    return NextResponse.json({ product, image_url: imageUrl });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
