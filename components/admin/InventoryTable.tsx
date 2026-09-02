"use client";

import { useEffect, useState } from "react";
import { StockBadge } from "@/components/catalog/StockBadge";
import type { ResolvedProduct } from "@/lib/catalog/query";

export function InventoryTable() {
  const [products, setProducts] = useState<ResolvedProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/admin/products?limit=48");
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not load inventory");
      return;
    }
    setProducts(data.products);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(id: string, quantity: number) {
    setError(null);
    const response = await fetch(`/api/admin/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity_on_hand: quantity }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Update failed");
      return;
    }
    await load();
  }

  return (
    <div>
      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">On hand</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Save</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <InventoryRow key={product.id} product={product} onSave={save} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventoryRow({
  product,
  onSave,
}: {
  product: ResolvedProduct;
  onSave: (id: string, quantity: number) => Promise<void>;
}) {
  const [qty, setQty] = useState(product.quantity_on_hand);
  useEffect(() => setQty(product.quantity_on_hand), [product.quantity_on_hand]);
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        {product.name}
        <span className="ml-2 font-mono text-xs text-slate-500">{product.sku}</span>
      </td>
      <td className="px-4 py-3">
        <label className="sr-only" htmlFor={`inv-${product.id}`}>
          On-hand quantity for {product.name}
        </label>
        <input
          id={`inv-${product.id}`}
          type="number"
          min={0}
          value={qty}
          onChange={(event) => setQty(Number(event.target.value))}
          className="h-10 w-24 rounded-lg border border-slate-200 px-2"
        />
      </td>
      <td className="px-4 py-3">
        <StockBadge status={product.stock_status} />
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          className="text-sm font-semibold text-sky-dark hover:underline"
          onClick={() => void onSave(product.id, qty)}
        >
          Save
        </button>
      </td>
    </tr>
  );
}
