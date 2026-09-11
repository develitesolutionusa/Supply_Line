import { QuickOrderForm } from "@/components/quick-order/QuickOrderForm";
import { getAccountContext } from "@/lib/auth/context";
import { listProducts } from "@/lib/catalog/query";

export const metadata = {
  title: "Quick order",
  description: "Add multiple products and case quantities to your cart in one sheet.",
};

export default async function QuickOrderPage() {
  const account = await getAccountContext();
  const catalog = await listProducts({
    accountTier: account.accountTier,
    limit: 48,
    sort: "name",
  });
  const products = catalog.products.map((product) => ({
    sku: product.sku,
    name: product.name,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">Quick order</h1>
      <p className="mt-2 text-sm text-slate-600">
        Built for restaurant purchasers — search product names and case quantities, then add everything in one pass.
      </p>
      <div className="mt-8">
        <QuickOrderForm products={products} />
      </div>
    </div>
  );
}
