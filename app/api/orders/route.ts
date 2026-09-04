import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { listOrdersForUser } from "@/lib/orders/service";

export async function GET(request: Request) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const result = await listOrdersForUser(account.userId, account.orgId, {
    page: Number(searchParams.get("page") ?? "1"),
    limit: Number(searchParams.get("limit") ?? "20"),
  });
  return NextResponse.json(result);
}
