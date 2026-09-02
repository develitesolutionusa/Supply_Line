import { notFound } from "next/navigation";
import { ProductMedia } from "@/components/catalog/ProductMedia";
import { ProductPurchasePanel } from "@/components/catalog/ProductPurchasePanel";
import { StockBadge } from "@/components/catalog/StockBadge";
import { getAccountContext } from "@/lib/auth/context";
import { getProductBySku } from "@/lib/catalog/query";
import { formatCents } from "@/lib/pricing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  return { title: sku.toUpperCase() };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const account = await getAccountContext();
  const product = await getProductBySku(sku, account.accountTier);

  if (!product) notFound();

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div>
        <ProductMedia name={product.name} sku={product.sku} imageUrl={product.image_url} />
      </div>
      <div>
        <p className="font-mono text-xs text-slate-500">{product.sku}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy">{product.name}</h1>
        <div className="mt-3 flex items-center gap-3">
          <StockBadge status={product.stock_status} />
          <span className="text-sm text-slate-500">{product.category.name}</span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{product.description}</p>
        <div className="mt-8">
          <ProductPurchasePanel
            productId={product.id}
            tiers={product.price_tiers}
            accountTier={account.accountTier}
            stockStatus={product.stock_status}
            packSize={product.pack_size}
          />
        </div>
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Case price tiers</caption>
            <thead className="bg-canvas text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Min cases</th>
                <th className="px-4 py-3">Price per case</th>
              </tr>
            </thead>
            <tbody>
              {product.price_tiers.map((tier) => (
                <tr key={tier.min_cases} className="border-t border-slate-100">
                  <td className="px-4 py-3">{tier.min_cases}+</td>
                  <td className="px-4 py-3 font-medium text-navy">
                    {formatCents(tier.price_per_case_cents)}
                    {account.accountTier === "individual" && tier.min_cases > 1 ? (
                      <span className="ml-2 text-xs font-normal text-slate-500">business only</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
