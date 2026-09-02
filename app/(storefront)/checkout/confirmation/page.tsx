import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusBadge, formatDate } from "@/components/ui/StatusBadge";
import { getAccountContext } from "@/lib/auth/context";
import { requireUser } from "@/lib/auth/requireUser";
import { getOrder } from "@/lib/orders/service";
import { formatCents } from "@/lib/pricing";

export const metadata = {
  title: "Order confirmation",
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  await requireUser();
  const account = await getAccountContext();
  const { order: orderId } = await searchParams;
  if (!orderId) notFound();
  const order = await getOrder(orderId);
  if (!order || (order.user_id !== account.userId && order.org_id !== account.orgId)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-dark">Confirmation</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy">
        {order.status === "paid" || order.status === "fulfilled" ? "Order placed" : "Order received"}
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        Order <span className="font-mono font-semibold text-navy">{order.id}</span> · {formatDate(order.created_at)}
      </p>
      <div className="mt-4">
        <OrderStatusBadge status={order.status} />
      </div>
      {order.status === "payment_failed" ? (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Payment failed. Your cart is still available — try checkout again with another card.
        </p>
      ) : null}
      <ul className="mt-8 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {order.items.map((item) => (
          <li key={item.sku} className="flex justify-between px-5 py-3 text-sm">
            <span>
              {item.name} × {item.cases}
            </span>
            <span>{formatCents(item.unit_price_cents_at_purchase * item.cases)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-right text-lg font-semibold text-navy">Total {formatCents(order.total_cents)}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/account/orders/${order.id}`}
          className="inline-flex h-11 items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white"
        >
          View order
        </Link>
        <Link href="/catalog" className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-5 text-sm font-semibold text-navy">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
