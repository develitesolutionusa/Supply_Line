import type { AppUser, BusinessAccount } from "@/lib/supabase/identity";
import { setBusinessStripeCustomerId, setUserStripeCustomerId } from "@/lib/supabase/identity";
import { getStripe } from "@/lib/stripe/server";

export function stripeCustomerCreateParams(options: {
  account: BusinessAccount;
  email: string | null;
  name: string | null;
}) {
  return {
    email: options.email || undefined,
    name: options.name || options.account.company_name,
    metadata: {
      business_account_id: options.account.id,
      clerk_org_id: options.account.clerk_org_id ?? "",
    },
  };
}

export function stripeBuyerCustomerCreateParams(options: {
  user: Pick<AppUser, "id" | "clerk_user_id">;
  email: string | null;
  name: string | null;
}) {
  return {
    email: options.email || undefined,
    name: options.name || options.email || "SupplyLine buyer",
    metadata: {
      user_id: options.user.id,
      clerk_user_id: options.user.clerk_user_id,
    },
  };
}

async function existingCustomerId(customerId: string | null) {
  if (!customerId) return null;
  const stripe = getStripe();
  if (!stripe) return null;
  try {
    const existing = await stripe.customers.retrieve(customerId);
    if (!existing.deleted) return existing.id;
  } catch {
    /* create a replacement customer below */
  }
  return null;
}

export async function ensureBusinessStripeCustomer(options: {
  account: BusinessAccount;
  email: string | null;
  name: string | null;
}): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const existing = await existingCustomerId(options.account.stripe_customer_id);
  if (existing) return existing;

  const customer = await stripe.customers.create(stripeCustomerCreateParams(options));
  await setBusinessStripeCustomerId(options.account.id, customer.id);
  return customer.id;
}

export async function ensureUserStripeCustomer(options: {
  user: AppUser;
  email: string | null;
  name: string | null;
}): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const existing = await existingCustomerId(options.user.stripe_customer_id);
  if (existing) return existing;

  const customer = await stripe.customers.create(stripeBuyerCustomerCreateParams(options));
  await setUserStripeCustomerId(options.user.id, customer.id);
  return customer.id;
}

export async function ensureCheckoutStripeCustomer(options: {
  user: AppUser;
  business: BusinessAccount | null;
  email: string | null;
  name: string | null;
}): Promise<string | null> {
  if (options.business) {
    return ensureBusinessStripeCustomer({
      account: options.business,
      email: options.email,
      name: options.name,
    });
  }
  return ensureUserStripeCustomer({
    user: options.user,
    email: options.email,
    name: options.name,
  });
}
