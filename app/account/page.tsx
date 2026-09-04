import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { AddressBook } from "@/components/account/AddressBook";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { OrderStatusBadge, formatDate } from "@/components/ui/StatusBadge";
import { resolveAccountType } from "@/lib/auth/accountType";
import { getAccountContext } from "@/lib/auth/context";
import { requireUser } from "@/lib/auth/requireUser";
import { shortOrderId } from "@/lib/catalog/display";
import { listAddresses, listOrdersForUser } from "@/lib/orders/service";
import { formatCents } from "@/lib/pricing";
import { fieldClass } from "@/lib/ui";

export const metadata = {
  title: "Account",
};

export default async function AccountPage() {
  await requireUser();
  const account = await getAccountContext();
  const [{ orgSlug }, user, addresses, ordersResult] = await Promise.all([
    auth(),
    currentUser(),
    account.userId ? listAddresses(account.userId) : Promise.resolve([]),
    account.userId
      ? listOrdersForUser(account.userId, account.orgId, { page: 1, limit: 50 })
      : Promise.resolve({ orders: [], page: 1, limit: 50, total: 0, total_pages: 1 }),
  ]);
  const accountType = resolveAccountType(user?.unsafeMetadata?.accountType, {
    hasOrganization: Boolean(account.orgId),
  });
  const isBusiness = accountType === "business";
  const companyName = isBusiness
    ? orgSlug
      ? orgSlug.replace(/[-_]/g, " ")
      : "Business account"
    : "Individual account";

  const year = new Date().getFullYear();
  const ytdCents = ordersResult.orders
    .filter((order) => {
      const created = new Date(order.created_at).getFullYear();
      return created === year && (order.status === "paid" || order.status === "fulfilled");
    })
    .reduce((sum, order) => sum + order.total_cents, 0);
  const openOrders = ordersResult.orders.filter(
    (order) => order.status === "pending" || order.status === "paid",
  ).length;
  const recent = ordersResult.orders.slice(0, 5);
  const latestPaid = ordersResult.orders.find(
    (order) => order.status === "paid" || order.status === "fulfilled",
  );
  const reorderItems = latestPaid
    ? Object.values(
        Object.fromEntries(latestPaid.items.map((item) => [item.product_id, item])),
      ).slice(0, 4)
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-sm text-slate-500">Welcome back,</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy">
        {user?.fullName || user?.firstName || "Customer"}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Customer: <span className="font-medium text-navy">{companyName}</span>
        <span className="mx-2 text-slate-300">·</span>
        <span className="capitalize">{accountType}</span>
        {account.taxExempt ? " · Tax-exempt" : null}
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="YTD spending" value={formatCents(ytdCents)} />
        <MetricCard label="Open orders" value={String(openOrders)} />
        <MetricCard label="Saved addresses" value={String(addresses.length)} />
        <MetricCard label="Pricing" value={account.accountTier === "business" ? "Wholesale" : "Retail"} />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-navy">Recent orders</h2>
            <Link href="/account/orders" className="text-sm font-semibold text-sky-text hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No orders yet. Checkout will list them here.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {recent.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      <span className="font-mono text-sm font-semibold text-navy">{shortOrderId(order.id)}</span>
                      <span className="mt-1 block text-xs text-slate-500">{formatDate(order.created_at)}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-sm font-semibold text-navy">{formatCents(order.total_cents)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
          <h2 className="text-lg font-semibold text-navy">Quick reorder</h2>
          {reorderItems.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">Place an order to see frequent items here.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {reorderItems.map((item) => (
                <li key={item.product_id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy">{item.name}</p>
                    <p className="font-mono text-[11px] text-slate-500">{item.sku}</p>
                  </div>
                  <AddToCartButton productId={item.product_id} cases={item.cases} stockStatus="in_stock" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-5 text-sm shadow-[0_1px_2px_rgb(15_23_42_/_0.04)] sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment terms</p>
          <p className="mt-1 font-medium text-navy">Prepaid by card</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax status</p>
          <p className="mt-1 font-medium text-navy">{account.taxExempt ? "Exempt" : "Taxable"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
          <p className="mt-1 font-medium text-navy">{account.email}</p>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/account/orders" className={fieldClass.BUTTON}>
          Order history
        </Link>
        <Link href="/reorder" className={fieldClass.GHOST}>
          Reorder
        </Link>
        {!account.orgId ? (
          <Link href="/create-organization" className={fieldClass.GHOST}>
            {isBusiness ? "Create company" : "Upgrade to business"}
          </Link>
        ) : null}
      </div>

      <div className="mt-10">
        <AddressBook initial={addresses} />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-navy">{value}</p>
    </div>
  );
}
