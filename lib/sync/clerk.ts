import {
  ensureAppUser,
  ensureBusinessAccount,
  getBusinessAccountByClerkOrg,
  linkUserToBusinessAccount,
  unlinkUserFromBusinessAccount,
  type AppUser,
  type BusinessAccount,
} from "@/lib/supabase/identity";
import { assertNoError, createServiceClient } from "@/lib/supabase/server";

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

export async function deactivateClerkUser(clerkUserId: string) {
  const supabase = createServiceClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  assertNoError(error, "Could not load user");
  if (!user) return;

  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  assertNoError(cartError, "Could not load cart");
  if (cart) {
    const { error: clearError } = await supabase.from("cart_items").delete().eq("cart_id", cart.id);
    assertNoError(clearError, "Could not clear cart");
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({
      email: `deleted+${user.id}@users.local`,
      business_account_id: null,
    })
    .eq("id", user.id);
  assertNoError(updateError, "Could not deactivate user");
}

export async function deactivateClerkOrg(clerkOrgId: string) {
  const account = await getBusinessAccountByClerkOrg(clerkOrgId);
  if (!account) return;

  const supabase = createServiceClient();
  const { error: unlinkError } = await supabase
    .from("users")
    .update({ business_account_id: null })
    .eq("business_account_id", account.id);
  assertNoError(unlinkError, "Could not unlink business members");

  const closedName = account.company_name.endsWith("(closed)")
    ? account.company_name
    : `${account.company_name} (closed)`;
  const { error: updateError } = await supabase
    .from("business_accounts")
    .update({ company_name: closedName })
    .eq("id", account.id);
  assertNoError(updateError, "Could not mark business account closed");
}
