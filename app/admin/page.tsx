import Link from "next/link";
import { StockBadge } from "@/components/catalog/StockBadge";
import { adminMetrics, lowStockProducts, topProducts } from "@/lib/admin/service";
import { shortOrderId } from "@/lib/catalog/display";
import { listAllOrders } from "@/lib/orders/service";
import { formatCents } from "@/lib/pricing";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const [metrics, lowStock, top, orders] = await Promise.all([
    adminMetrics(),
    lowStockProducts(),
    topProducts(),
    listAllOrders(),
  ]);
  const completed = orders.filter((order) => order.status === "paid" || order.status === "fulfilled");
  const wholesaleCents = completed
    .filter((order) => order.org_id)
    .reduce((sum, order) => sum + order.total_cents, 0);
  const retailCents = completed
    .filter((order) => !order.org_id)
    .reduce((sum, order) => sum + order.total_cents, 0);
  const maxTop = Math.max(1, ...top.map((product) => product.cases));
  const recent = orders.slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Last {metrics.window_days} days unless noted.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total sales" value={formatCents(metrics.sales_cents)} />
        <MetricCard label="Wholesale sales" value={formatCents(wholesaleCents)} hint="Paid/fulfilled with a company org" />
        <MetricCard label="Retail sales" value={formatCents(retailCents)} hint="Paid/fulfilled individual orders" />
        <MetricCard label="Orders" value={String(metrics.paid_orders)} />
        <MetricCard label="Average order value" value={formatCents(metrics.avg_order_value_cents)} />
        <MetricCard label="Pending orders" value={String(metrics.pending_orders)} />
        <MetricCard label="Low stock products" value={String(lowStock.length)} />
        <MetricCard label="New accounts" value={String(metrics.new_accounts)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
          <h2 className="text-lg font-semibold text-navy">Top products</h2>
          {top.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No paid order volume yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {top.map((product) => (
                <li key={product.product_id}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate pr-3">
                      {product.name}
                      <span className="ml-2 font-mono text-xs text-slate-500">{product.sku}</span>
                    </span>
                    <span className="shrink-0 font-medium text-navy">{product.cases} cases</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-sky"
                      style={{ width: `${Math.round((product.cases / maxTop) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy">Low stock alerts</h2>
            <Link href="/admin/inventory" className="text-sm font-semibold text-sky-text hover:underline">
              Manage
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No products at or below threshold.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {lowStock.slice(0, 8).map((product) => (
                <li key={product.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {product.name}
                    <span className="ml-2 font-mono text-xs text-slate-500">{product.sku}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span>{product.quantity_on_hand}</span>
                    <StockBadge status={product.stock_status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-sky-text hover:underline">
            All orders
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No orders yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {recent.map((order) => (
              <li key={order.id} className="flex items-center justify-between py-2">
                <span className="font-mono text-xs font-semibold text-navy">{shortOrderId(order.id)}</span>
                <span className="text-slate-500">{order.org_id ? "Wholesale" : "Retail"}</span>
                <span className="font-medium text-navy">{formatCents(order.total_cents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-navy">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
