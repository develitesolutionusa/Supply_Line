import {
  ensureAppUser,
  ensureBusinessAccount,
  getBusinessAccountByClerkOrg,
  linkUserToBusinessAccount,
  unlinkUserFromBusinessAccount,
  type AppUser,
  type BusinessAccount,
} from "@/lib/supabase/identity";

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

export async function syncClerkIdentity(payload: {
  clerkUserId: string;
  email?: string | null;
  clerkOrgId?: string | null;
  companyName?: string | null;
  role?: AppUser["role"];
}): Promise<{ user: AppUser; account: BusinessAccount | null }> {
  const user = await ensureAppUser(payload.clerkUserId, payload.email, payload.role);
  if (!payload.clerkOrgId) {
    return { user, account: null };
  }

  const account = await ensureBusinessAccount(
    payload.clerkOrgId,
    payload.companyName ?? undefined,
  );
  if (user.business_account_id !== account.id) {
    await linkUserToBusinessAccount(user.id, account.id);
    return { user: { ...user, business_account_id: account.id }, account };
  }
  return { user, account };
}

export async function unlinkClerkMembership(payload: {
  clerkUserId: string;
  clerkOrgId: string;
}) {
  const account = await getBusinessAccountByClerkOrg(payload.clerkOrgId);
  if (!account) return;
  await unlinkUserFromBusinessAccount(payload.clerkUserId, account.id);
}
