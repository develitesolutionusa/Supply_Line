import { mutateStore } from "@/lib/store/file-store";

export async function upsertClerkUser(payload: {
  clerkUserId: string;
  email: string;
  role?: "admin" | "buyer" | "staff";
}) {
  return mutateStore((store) => {
    const existing = store.users.find((user) => user.clerk_user_id === payload.clerkUserId);
    if (existing) {
      existing.email = payload.email;
      if (payload.role) existing.role = payload.role;
      return existing;
    }
    const created = {
      id: payload.clerkUserId,
      clerk_user_id: payload.clerkUserId,
      email: payload.email,
      role: payload.role ?? "buyer",
      business_account_id: null,
      created_at: new Date().toISOString(),
    };
    store.users.push(created);
    return created;
  });
}

export async function upsertClerkOrg(payload: { clerkOrgId: string; companyName: string }) {
  return mutateStore((store) => {
    store.businessAccounts[payload.clerkOrgId] = {
      tax_exempt: store.businessAccounts[payload.clerkOrgId]?.tax_exempt ?? false,
      company_name: payload.companyName,
      stripe_customer_id: store.businessAccounts[payload.clerkOrgId]?.stripe_customer_id ?? null,
      created_at: store.businessAccounts[payload.clerkOrgId]?.created_at ?? new Date().toISOString(),
    };
    return store.businessAccounts[payload.clerkOrgId];
  });
}
