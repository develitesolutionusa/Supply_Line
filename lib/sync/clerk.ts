import { ensureAppUser, ensureBusinessAccount } from "@/lib/supabase/identity";

export async function upsertClerkUser(payload: {
  clerkUserId: string;
  email: string;
  role?: "admin" | "buyer" | "staff";
}) {
  return ensureAppUser(payload.clerkUserId, payload.email, payload.role);
}

export async function upsertClerkOrg(payload: { clerkOrgId: string; companyName: string }) {
  return ensureBusinessAccount(payload.clerkOrgId, payload.companyName);
}
