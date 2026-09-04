import Link from "next/link";
import { StockBadge } from "@/components/catalog/StockBadge";
import { adminMetrics, lowStockProducts, topProducts } from "@/lib/admin/service";
import { formatCents } from "@/lib/pricing";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const [metrics, lowStock, top] = await Promise.all([adminMetrics(), lowStockProducts(), topProducts()]);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Sales (30d)" value={formatCents(metrics.sales_cents)} />
        <MetricCard label="Pending orders" value={String(metrics.pending_orders)} />
        <MetricCard label="Avg order value" value={formatCents(metrics.avg_order_value_cents)} />
        <MetricCard label="New accounts (30d)" value={String(metrics.new_accounts)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy">Low stock</h2>
            <Link href="/admin/inventory" className="text-sm font-semibold text-sky-dark hover:underline">
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
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-navy">Top products</h2>
          {top.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No paid order volume yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {top.map((product) => (
                <li key={product.product_id} className="flex justify-between py-2 text-sm">
                  <span>
                    {product.name}
                    <span className="ml-2 font-mono text-xs text-slate-500">{product.sku}</span>
                  </span>
                  <span className="font-medium text-navy">{product.cases} cases</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-navy">{value}</p>
    </div>
  );
}
