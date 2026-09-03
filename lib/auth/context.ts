import { auth, currentUser } from "@clerk/nextjs/server";
import type { AccountTier } from "@/types/commerce";
import { getBusinessAccountByClerkOrg } from "@/lib/supabase/identity";

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
  const accountType = user?.unsafeMetadata?.accountType;
  const accountTier: AccountTier =
    orgId || accountType === "business" ? "business" : "individual";

  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const isAdmin =
    user?.publicMetadata?.role === "admin" ||
    (userId ? adminIds.includes(userId) : false);

  let taxExempt = false;
  if (orgId) {
    const account = await getBusinessAccountByClerkOrg(orgId);
    taxExempt = account?.tax_exempt ?? false;
  }

  return {
    userId: userId ?? null,
    orgId: orgId ?? null,
    accountTier,
    taxExempt,
    isAdmin,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
    fullName: user?.fullName ?? null,
  };
}
