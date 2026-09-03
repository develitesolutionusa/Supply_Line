import { auth, currentUser } from "@clerk/nextjs/server";
import type { AccountTier } from "@/types/commerce";
import { isBusinessAccountType, resolveAccountType } from "@/lib/auth/accountType";
import { syncClerkIdentity } from "@/lib/sync/clerk";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export type AccountContext = {
  userId: string | null;
  orgId: string | null;
  accountTier: AccountTier;
  taxExempt: boolean;
  isAdmin: boolean;
  email: string | null;
  fullName: string | null;
};

function adminIdList() {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function getAccountContext(): Promise<AccountContext> {
  const { userId, orgId } = await auth();
  const user = userId ? await currentUser() : null;
  const isBusiness = isBusinessAccountType(user?.unsafeMetadata?.accountType);
  const accountTier: AccountTier = isBusiness ? "business" : "individual";
  const activeOrgId = isBusiness ? (orgId ?? null) : null;

  const isAdmin =
    user?.publicMetadata?.role === "admin" ||
    (userId ? adminIdList().includes(userId) : false);

  let taxExempt = false;
  if (userId && isSupabaseConfigured()) {
    const synced = await syncClerkIdentity({
      clerkUserId: userId,
      email: user?.primaryEmailAddress?.emailAddress ?? null,
      clerkOrgId: activeOrgId,
      role: isAdmin ? "admin" : undefined,
    });
    taxExempt = isBusiness ? (synced.account?.tax_exempt ?? false) : false;
  }

  return {
    userId: userId ?? null,
    orgId: activeOrgId,
    accountTier,
    taxExempt,
    isAdmin,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
    fullName: user?.fullName ?? null,
  };
}

export { resolveAccountType, isBusinessAccountType };
