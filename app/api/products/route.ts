import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { listProducts } from "@/lib/catalog/query";
import { withPublicRateLimit } from "@/lib/http";

export async function GET(request: Request) {
  const limited = await withPublicRateLimit(request, "products");
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const account = await getAccountContext();
  const result = await listProducts({
    category: searchParams.get("category") ?? undefined,
    search: searchParams.get("search") ?? searchParams.get("q") ?? undefined,
    page: Number(searchParams.get("page") ?? "1"),
    limit: Number(searchParams.get("limit") ?? "12"),
    accountTier: account.accountTier,
  });

  return NextResponse.json({
    ...result,
    account_tier: account.accountTier,
  });
}
