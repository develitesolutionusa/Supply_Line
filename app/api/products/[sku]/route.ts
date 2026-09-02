import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { getProductBySku } from "@/lib/catalog/query";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sku: string }> },
) {
  const { sku } = await context.params;
  const account = await getAccountContext();
  const product = await getProductBySku(sku, account.accountTier);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product, account_tier: account.accountTier });
}
