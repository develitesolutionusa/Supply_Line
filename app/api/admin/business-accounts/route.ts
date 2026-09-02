import { NextResponse } from "next/server";
import { listBusinessAccounts, setTaxExempt } from "@/lib/admin/service";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/requireRole";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ accounts: await listBusinessAccounts() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      id?: string;
      tax_exempt?: boolean;
      company_name?: string;
    };
    if (!body.id || typeof body.tax_exempt !== "boolean") {
      return NextResponse.json({ error: "id and tax_exempt are required" }, { status: 400 });
    }
    const account = await setTaxExempt(body.id, body.tax_exempt, body.company_name);
    return NextResponse.json({ account });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
