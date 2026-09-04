import { createServiceClient, assertNoError } from "@/lib/supabase/server";

const USER_COLUMNS = "id, clerk_user_id, email, role, business_account_id, stripe_customer_id";

export type AppUser = {
  id: string;
  clerk_user_id: string;
  email: string;
  role: "admin" | "buyer" | "staff";
  business_account_id: string | null;
  stripe_customer_id: string | null;
};

export type BusinessAccount = {
  id: string;
  clerk_org_id: string | null;
  company_name: string;
  tax_exempt: boolean;
  stripe_customer_id: string | null;
  created_at: string;
};

export async function ensureAppUser(clerkUserId: string, email?: string | null, role?: AppUser["role"]) {
  const supabase = createServiceClient();
  const { data: existing, error } = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  assertNoError(error, "Could not load user");

  if (existing) {
    const nextEmail = email || existing.email;
    const nextRole = role ?? existing.role;
    if (nextEmail !== existing.email || nextRole !== existing.role) {
      const { data, error: updateError } = await supabase
        .from("users")
        .update({ email: nextEmail, role: nextRole })
        .eq("id", existing.id)
        .select(USER_COLUMNS)
        .single();
      assertNoError(updateError, "Could not update user");
      return data as AppUser;
    }
    return existing as AppUser;
  }

  let resolvedEmail = email;
  if (!resolvedEmail) {
    try {
      const { currentUser } = await import("@clerk/nextjs/server");
      const user = await currentUser();
      resolvedEmail = user?.primaryEmailAddress?.emailAddress ?? null;
    } catch {
      resolvedEmail = null;
    }
  }

  const { data, error: insertError } = await supabase
    .from("users")
    .insert({
      clerk_user_id: clerkUserId,
      email: resolvedEmail || `${clerkUserId}@users.local`,
      role: role ?? "buyer",
    })
    .select(USER_COLUMNS)
    .single();
  if (insertError?.code === "23505") {
    const { data: raced, error: racedError } = await supabase
      .from("users")
      .select(USER_COLUMNS)
      .eq("clerk_user_id", clerkUserId)
      .single();
    assertNoError(racedError, "Could not load user");
    return raced as AppUser;
  }
  assertNoError(insertError, "Could not create user");
  return data as AppUser;
}

export async function ensureBusinessAccount(clerkOrgId: string, companyName?: string) {
  const supabase = createServiceClient();
  const { data: existing, error } = await supabase
    .from("business_accounts")
    .select("id, clerk_org_id, company_name, tax_exempt, stripe_customer_id, created_at")
    .eq("clerk_org_id", clerkOrgId)
    .maybeSingle();
  assertNoError(error, "Could not load business account");

  if (existing) {
    if (companyName && companyName !== existing.company_name) {
      const { data, error: updateError } = await supabase
        .from("business_accounts")
        .update({ company_name: companyName })
        .eq("id", existing.id)
        .select("id, clerk_org_id, company_name, tax_exempt, stripe_customer_id, created_at")
        .single();
      assertNoError(updateError, "Could not update business account");
      return data as BusinessAccount;
    }
    return existing as BusinessAccount;
  }

  const { data, error: insertError } = await supabase
    .from("business_accounts")
    .insert({
      clerk_org_id: clerkOrgId,
      company_name: companyName || clerkOrgId,
      account_tier: "business",
    })
    .select("id, clerk_org_id, company_name, tax_exempt, stripe_customer_id, created_at")
    .single();
  if (insertError?.code === "23505") {
    const { data: raced, error: racedError } = await supabase
      .from("business_accounts")
      .select("id, clerk_org_id, company_name, tax_exempt, stripe_customer_id, created_at")
      .eq("clerk_org_id", clerkOrgId)
      .single();
    assertNoError(racedError, "Could not load business account");
    return raced as BusinessAccount;
  }
  assertNoError(insertError, "Could not create business account");
  return data as BusinessAccount;
}

export async function getBusinessAccountByClerkOrg(clerkOrgId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_accounts")
    .select("id, clerk_org_id, company_name, tax_exempt, stripe_customer_id, created_at")
    .eq("clerk_org_id", clerkOrgId)
    .maybeSingle();
  assertNoError(error, "Could not load business account");
  return (data as BusinessAccount | null) ?? null;
}

export async function linkUserToBusinessAccount(userId: string, businessAccountId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("users").update({ business_account_id: businessAccountId }).eq("id", userId);
  assertNoError(error, "Could not link user to business account");
}

export async function unlinkUserFromBusinessAccount(clerkUserId: string, businessAccountId: string) {
  const user = await ensureAppUser(clerkUserId);
  if (user.business_account_id !== businessAccountId) return;
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("users")
    .update({ business_account_id: null })
    .eq("id", user.id)
    .eq("business_account_id", businessAccountId);
  assertNoError(error, "Could not unlink user from business account");
}

export async function setBusinessStripeCustomerId(accountId: string, stripeCustomerId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("business_accounts")
    .update({ stripe_customer_id: stripeCustomerId })
    .eq("id", accountId);
  assertNoError(error, "Could not save Stripe customer");
}

export async function setUserStripeCustomerId(userId: string, stripeCustomerId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("users")
    .update({ stripe_customer_id: stripeCustomerId })
    .eq("id", userId);
  assertNoError(error, "Could not save Stripe customer");
}
