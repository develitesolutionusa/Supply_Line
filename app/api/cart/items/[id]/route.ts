import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { getCartSnapshot, removeCartItem, updateCartItem } from "@/lib/cart/service";

async function snapshot(userId: string, accountTier: "business" | "individual", taxExempt: boolean) {
  return getCartSnapshot({ userId, accountTier, taxExempt });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { cases?: number };

  try {
    await updateCartItem(account.userId, id, Number(body.cases));
    return NextResponse.json(
      await snapshot(account.userId, account.accountTier, account.taxExempt),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update item" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;
  await removeCartItem(account.userId, id);
  return NextResponse.json(
    await snapshot(account.userId, account.accountTier, account.taxExempt),
  );
}
