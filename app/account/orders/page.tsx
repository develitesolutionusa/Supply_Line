import Link from "next/link";
import { OrderStatusBadge, formatDate } from "@/components/ui/StatusBadge";
import { getAccountContext } from "@/lib/auth/context";
import { requireUser } from "@/lib/auth/requireUser";
import { listOrdersForUser } from "@/lib/orders/service";
import { formatCents } from "@/lib/pricing";

export const metadata = {
  title: "My orders",
};

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireUser();
  const { page: pageParam } = await searchParams;
  const account = await getAccountContext();
  const result = account.userId
    ? await listOrdersForUser(account.userId, account.orgId, {
        page: Number(pageParam ?? "1"),
        limit: 20,
      })
    : { orders: [], page: 1, limit: 20, total: 0, total_pages: 1 };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-navy">My orders</h1>
      {result.orders.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">No orders yet. Checkout will list them here.</p>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {result.orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="flex flex-col gap-2 px-5 py-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="font-mono text-sm font-semibold text-navy">{order.id}</span>
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
          {result.total_pages > 1 ? (
            <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Pagination">
              {result.page > 1 ? (
                <Link
                  href={result.page === 2 ? "/account/orders" : `/account/orders?page=${result.page - 1}`}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                  Previous
                </Link>
              ) : null}
              <span className="text-sm text-slate-600">
                Page {result.page} of {result.total_pages}
              </span>
              {result.page < result.total_pages ? (
                <Link
                  href={`/account/orders?page=${result.page + 1}`}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                  Next
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
