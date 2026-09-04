import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductMedia } from "@/components/catalog/ProductMedia";
import { ProductPurchasePanel } from "@/components/catalog/ProductPurchasePanel";
import { StockBadge } from "@/components/catalog/StockBadge";
import { getAccountContext } from "@/lib/auth/context";
import { getProductBySku, listProducts } from "@/lib/catalog/query";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const account = await getAccountContext();
  const product = await getProductBySku(sku, account.accountTier);
  if (!product) return { title: sku.toUpperCase() };
  return {
    title: product.name,
    description: product.description,
  };
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

  const related = await listProducts({
    category: product.category.slug,
    limit: 4,
    accountTier: account.accountTier,
  });
  const relatedProducts = related.products.filter((item) => item.id !== product.id).slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-sm text-slate-500">
        <Link href="/catalog" className="hover:text-sky-text">
          Catalog
        </Link>
        <span aria-hidden> / </span>
        <Link href={`/catalog?category=${product.category.slug}`} className="hover:text-sky-text">
          {product.category.name}
        </Link>
      </p>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <ProductMedia
            name={product.name}
            sku={product.sku}
            imageUrl={product.image_url}
            categorySlug={product.category.slug}
            priority
            className="aspect-[4/3] lg:aspect-[16/11]"
          />
          <div className="mt-8 rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-navy">Product details</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">SKU</dt>
                <dd className="font-mono text-navy">{product.sku}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Category</dt>
                <dd className="text-navy">{product.category.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Pack size</dt>
                <dd className="text-navy">{product.pack_size}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Case quantity</dt>
                <dd className="text-navy">{product.unit_count} units</dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <p className="font-medium text-navy">Shipping</p>
              <p className="mt-1">
                Local delivery, standard, expedited, and pickup are selected at checkout. Free standard
                shipping unlocks above the cart threshold.
              </p>
            </div>
          </div>
        </div>
        <div>
          <p className="font-mono text-xs text-slate-500">SKU: {product.sku}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <StockBadge status={product.stock_status} />
            <span className="text-sm text-slate-500">{product.category.name}</span>
          </div>
          <div className="mt-6">
            <ProductPurchasePanel
              productId={product.id}
              tiers={product.price_tiers}
              accountTier={account.accountTier}
              stockStatus={product.stock_status}
              packSize={product.pack_size}
              unitCount={product.unit_count}
            />
          </div>
        </div>
      </div>
      {relatedProducts.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-navy">Frequently purchased together</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
