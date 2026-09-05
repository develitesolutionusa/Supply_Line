import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusBadge, formatDate } from "@/components/ui/StatusBadge";
import { getAccountContext } from "@/lib/auth/context";
import { requireUser } from "@/lib/auth/requireUser";
import { getOrder } from "@/lib/orders/service";
import { DELIVERY_METHODS, formatCents, requiresDeliveryLocation } from "@/lib/pricing";
import { fieldClass } from "@/lib/ui";
import { shortOrderId } from "@/lib/catalog/display";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Order ${id}` };
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const account = await getAccountContext();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order || (order.user_id !== account.userId && order.org_id !== account.orgId && !account.isAdmin)) {
    notFound();
  }

  const delivery = DELIVERY_METHODS.find((item) => item.id === order.delivery_method);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/account/orders" className="text-sm font-semibold text-sky-text hover:underline">
        Back to orders
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-semibold text-navy">{shortOrderId(order.id)}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-sm text-slate-600">{formatDate(order.created_at)}</p>
      <p className="mt-2 text-sm text-slate-600">
        {delivery?.label ?? order.delivery_method}
        {order.shipping_address
          ? ` · ${order.shipping_address.line1}, ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip}`
          : null}
      </p>
      {order.shipping_address?.label.includes(" · from ") ? (
        <p className="mt-1 text-sm text-slate-600">
          From {order.shipping_address.label.split(" · from ")[1]}
        </p>
      ) : null}
      <ul className="mt-8 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {order.items.map((item) => (
          <li key={item.sku} className="flex justify-between px-5 py-3 text-sm">
            <span>
              {item.name} · {item.sku} × {item.cases}
            </span>
            <span>{formatCents(item.unit_price_cents_at_purchase * item.cases)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatCents(order.subtotal_cents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{requiresDeliveryLocation(order.delivery_method) ? "Delivery" : "Shipping"}</dt>
          <dd>{formatCents(order.shipping_cents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Tax</dt>
          <dd>{formatCents(order.tax_cents)}</dd>
        </div>
        <div className="flex justify-between font-semibold text-navy">
          <dt>Total</dt>
          <dd>{formatCents(order.total_cents)}</dd>
        </div>
      </dl>
      <Link
        href="/reorder"
        className={`${fieldClass.BUTTON} mt-8`}
      >
        Reorder
      </Link>
    </div>
  );
}
