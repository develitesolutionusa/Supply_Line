import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { bulkAddBySku, getCartSnapshot } from "@/lib/cart/service";

export async function POST(request: Request) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json()) as { rows?: { sku: string; qty: number }[] };
  const rows = body.rows ?? [];
  const results = await bulkAddBySku(account.userId, account.accountTier, rows);
  const cart = await getCartSnapshot({
    userId: account.userId,
    accountTier: account.accountTier,
    taxExempt: account.taxExempt,
  });

  return NextResponse.json({
    results,
    added: results.filter((row) => row.ok).length,
    skipped: results.filter((row) => !row.ok).length,
    cart,
  });
}
