import Link from "next/link";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { ProductMedia } from "@/components/catalog/ProductMedia";
import { StockBadge } from "@/components/catalog/StockBadge";
import { formatCents } from "@/lib/pricing";
import type { ResolvedProduct } from "@/lib/catalog/query";

export function ProductCard({ product }: { product: ResolvedProduct }) {
  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
      <Link href={`/products/${product.sku}`} className="block">
        <ProductMedia name={product.name} sku={product.sku} imageUrl={product.image_url} />
        <h2 className="mt-4 text-base font-semibold text-navy">{product.name}</h2>
      </Link>
      <p className="mt-1 font-mono text-xs text-slate-500">{product.sku}</p>
      <p className="mt-1 text-xs text-slate-500">{product.pack_size}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-navy">
          {formatCents(product.starting_price_cents)}
          <span className="ml-1 text-xs font-normal text-slate-500">/ case</span>
        </p>
        <StockBadge status={product.stock_status} />
      </div>
      <div className="mt-4">
        <AddToCartButton productId={product.id} stockStatus={product.stock_status} className="w-full" />
      </div>
    </article>
  );
}
