import type { BusinessAccount } from "@/lib/supabase/identity";
import { setBusinessStripeCustomerId } from "@/lib/supabase/identity";
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

export async function ensureBusinessStripeCustomer(options: {
  account: BusinessAccount;
  email: string | null;
  name: string | null;
}): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  if (options.account.stripe_customer_id) {
    try {
      const existing = await stripe.customers.retrieve(options.account.stripe_customer_id);
      if (!existing.deleted) return existing.id;
    } catch {
      /* create a replacement customer below */
    }
  }

  const customer = await stripe.customers.create(stripeCustomerCreateParams(options));
  await setBusinessStripeCustomerId(options.account.id, customer.id);
  return customer.id;
}
