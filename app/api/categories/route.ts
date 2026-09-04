import { NextResponse } from "next/server";
import { listCategories } from "@/lib/catalog/query";
import { withPublicRateLimit } from "@/lib/http";

export async function GET(request: Request) {
  const limited = await withPublicRateLimit(request, "categories");
  if (limited) return limited;

  const categories = await listCategories();
  return NextResponse.json({ categories });
}
