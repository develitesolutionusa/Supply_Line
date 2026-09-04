import { auth, currentUser } from "@clerk/nextjs/server";
import type { AccountTier } from "@/types/commerce";
import { isBusinessAccountType, resolveAccountType } from "@/lib/auth/accountType";
import { hasAdminLoginEmail } from "@/lib/auth/admin";
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

export async function getAccountContext(): Promise<AccountContext> {
  const { userId, orgId } = await auth();
  const user = userId ? await currentUser() : null;
  const isBusiness = isBusinessAccountType(user?.unsafeMetadata?.accountType, {
    hasOrganization: Boolean(orgId),
  });
  const accountTier: AccountTier = isBusiness ? "business" : "individual";
  const activeOrgId = isBusiness ? (orgId ?? null) : null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const isAdmin = hasAdminLoginEmail([
    email,
    ...(user?.emailAddresses?.map((address) => address.emailAddress) ?? []),
  ]);

  let taxExempt = false;
  if (userId && isSupabaseConfigured()) {
    const synced = await syncClerkIdentity({
      clerkUserId: userId,
      email,
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
    email,
    fullName: user?.fullName ?? null,
  };
}

export { resolveAccountType, isBusinessAccountType };
