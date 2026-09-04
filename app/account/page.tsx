import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { AddressBook } from "@/components/account/AddressBook";
import { resolveAccountType } from "@/lib/auth/accountType";
import { getAccountContext } from "@/lib/auth/context";
import { requireUser } from "@/lib/auth/requireUser";
import { listAddresses } from "@/lib/orders/service";

export const metadata = {
  title: "Account",
};

export default async function AccountPage() {
  await requireUser();
  const account = await getAccountContext();
  const [user, addresses] = await Promise.all([
    currentUser(),
    account.userId ? listAddresses(account.userId) : Promise.resolve([]),
  ]);
  const accountType = resolveAccountType(user?.unsafeMetadata?.accountType, {
    hasOrganization: Boolean(account.orgId),
  });
  const isBusiness = accountType === "business";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-dark">Account</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy">Your profile</h1>
      <dl className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr]">
          <dt className="text-sm font-medium text-slate-500">Name</dt>
          <dd className="text-sm text-navy">{user?.fullName || "Not set"}</dd>
        </div>
        <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr]">
          <dt className="text-sm font-medium text-slate-500">Email</dt>
          <dd className="text-sm text-navy">{user?.primaryEmailAddress?.emailAddress}</dd>
        </div>
        <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr]">
          <dt className="text-sm font-medium text-slate-500">Account type</dt>
          <dd className="text-sm capitalize text-navy">{accountType}</dd>
        </div>
        {isBusiness ? (
          <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm font-medium text-slate-500">Organization</dt>
            <dd className="text-sm text-navy">{account.orgId ? account.orgId : "No company yet"}</dd>
          </div>
        ) : null}
        {isBusiness ? (
          <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm font-medium text-slate-500">Tax-exempt</dt>
            <dd className="text-sm text-navy">{account.taxExempt ? "Yes" : "No"}</dd>
          </div>
        ) : null}
        <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr]">
          <dt className="text-sm font-medium text-slate-500">Pricing tier</dt>
          <dd className="text-sm capitalize text-navy">{account.accountTier}</dd>
        </div>
      </dl>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/account/orders"
          className="inline-flex h-11 items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
        >
          My orders
        </Link>
        {!account.orgId ? (
          <Link
            href="/create-organization"
            className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-navy hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
          >
            {isBusiness ? "Create company" : "Upgrade to business"}
          </Link>
        ) : null}
      </div>
      <AddressBook initial={addresses} />
    </div>
  );
}
