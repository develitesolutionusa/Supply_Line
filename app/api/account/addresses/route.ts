import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/auth/context";
import { listAddresses, saveAddress } from "@/lib/orders/service";

export async function GET() {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const addresses = await listAddresses(account.userId);
  return NextResponse.json({
    addresses,
    tax_exempt: account.taxExempt,
    account_tier: account.accountTier,
    email: account.email,
    name: account.fullName,
  });
}

export async function POST(request: Request) {
  const account = await getAccountContext();
  if (!account.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const body = (await request.json()) as {
    label?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    is_default?: boolean;
  };
  if (!body.line1 || !body.city || !body.state || !body.zip) {
    return NextResponse.json({ error: "Complete address is required" }, { status: 400 });
  }
  const address = await saveAddress(account.userId, {
    label: body.label ?? "Shipping",
    line1: body.line1,
    line2: body.line2 ?? "",
    city: body.city,
    state: body.state,
    zip: body.zip,
    is_default: body.is_default ?? false,
  });
  return NextResponse.json({ address });
}
