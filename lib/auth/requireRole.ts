import { NextResponse } from "next/server";
import { getAccountContext, type AccountContext } from "@/lib/auth/context";
import { logError } from "@/lib/observability";

export async function requireAdmin(): Promise<AccountContext> {
  const account = await getAccountContext();
  if (!account.userId) {
    throw new AdminAuthError("Sign in required", 401);
  }
  if (!account.isAdmin) {
    throw new AdminAuthError("Admin role required", 403);
  }
  return account;
}

export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function adminErrorResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  logError("admin.api", error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Request failed" },
    { status: 400 },
  );
}
