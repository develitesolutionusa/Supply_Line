import Link from "next/link";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { ProductMedia } from "@/components/catalog/ProductMedia";
import { StockBadge } from "@/components/catalog/StockBadge";
import { formatCents } from "@/lib/pricing";
import type { ResolvedProduct } from "@/lib/catalog/query";

export function ProductCard({ product }: { product: ResolvedProduct }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
      <Link
        href={`/products/${product.sku}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
      >
        <ProductMedia
          name={product.name}
          sku={product.sku}
          imageUrl={product.image_url}
          categorySlug={product.category.slug}
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/products/${product.sku}`}
          className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
        >
          <h2 className="text-[15px] font-semibold leading-snug text-navy">{product.name}</h2>
        </Link>
        <p className="mt-1 font-mono text-[11px] text-slate-500">SKU: {product.sku}</p>
        <p className="mt-1 text-xs text-slate-500">{product.pack_size}</p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <p className="text-base font-semibold text-navy">
            {formatCents(product.starting_price_cents)}
            <span className="ml-1 text-xs font-normal text-slate-500">/ case</span>
          </p>
          <StockBadge status={product.stock_status} />
        </div>
        <div className="mt-4">
          <AddToCartButton productId={product.id} stockStatus={product.stock_status} className="w-full" />
        </div>
      </div>
    </article>
  );
}
