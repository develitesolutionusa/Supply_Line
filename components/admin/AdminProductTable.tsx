"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductMedia } from "@/components/catalog/ProductMedia";
import { StockBadge } from "@/components/catalog/StockBadge";
import { formatCents, startingCasePrice } from "@/lib/pricing";
import { fieldClass } from "@/lib/ui";
import type { ResolvedProduct } from "@/lib/catalog/query";

export function AdminProductTable() {
  const [products, setProducts] = useState<ResolvedProduct[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      fetch(`/api/admin/products?${params.toString()}`)
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? "Could not load products");
          setProducts(data.products);
        })
        .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Error"));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [search]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products"
          aria-label="Search products"
          className="h-11 w-full max-w-sm rounded-lg border border-slate-200 px-3 text-sm"
        />
        <Link
          href="/admin/products/new"
          className={fieldClass.BUTTON}
        >
          New product
        </Link>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      <div className="mt-4 overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Pack</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Retail</th>
              <th className="px-4 py-3">Wholesale</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const retail = startingCasePrice(product.price_tiers, "individual");
              const wholesale =
                product.price_tiers[product.price_tiers.length - 1]?.price_per_case_cents ?? retail;
              return (
              <tr key={product.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3 font-medium text-navy hover:underline">
                    <span className="w-12 shrink-0">
                      <ProductMedia
                        name={product.name}
                        sku={product.sku}
                        imageUrl={product.image_url}
                        categorySlug={product.category.slug}
                      />
                    </span>
                    {product.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                <td className="px-4 py-3">{product.category.name}</td>
                <td className="px-4 py-3">{product.pack_size}</td>
                <td className="px-4 py-3">
                  <StockBadge status={product.stock_status} />
                </td>
                <td className="px-4 py-3">{formatCents(retail)}</td>
                <td className="px-4 py-3">{formatCents(wholesale)}</td>
                <td className="px-4 py-3">{product.is_active ? "Active" : "Hidden"}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
