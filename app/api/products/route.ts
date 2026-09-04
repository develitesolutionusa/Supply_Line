import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { listProducts } from "@/lib/catalog/query";
import { PUBLIC_RATE_LIMIT, SEARCH_RATE_LIMIT, withPublicRateLimit } from "@/lib/http";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? searchParams.get("q") ?? undefined;
  const limited = await withPublicRateLimit(
    request,
    search ? "products-search" : "products",
    search ? SEARCH_RATE_LIMIT : PUBLIC_RATE_LIMIT,
  );
  if (limited) return limited;

  const account = await getAccountContext();
  const result = await listProducts({
    category: searchParams.get("category") ?? undefined,
    search,
    page: Number(searchParams.get("page") ?? "1"),
    limit: Number(searchParams.get("limit") ?? "12"),
    accountTier: account.accountTier,
  });

  return NextResponse.json({
    ...result,
    account_tier: account.accountTier,
  });
}
