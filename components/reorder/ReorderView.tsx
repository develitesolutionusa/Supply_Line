"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { OrderStatusBadge, formatDate } from "@/components/ui/StatusBadge";
import { emitCartUpdated } from "@/lib/cart/client";
import { formatCents } from "@/lib/pricing";
import type { OrderRecord } from "@/types/commerce";

type PreviewItem = {
  product_id: string;
  sku: string;
  name: string;
  cases: number;
  unit_price_cents_at_purchase: number;
  current_price_cents: number | null;
  price_changed: boolean;
  out_of_stock: boolean;
  current_name: string;
};

export function ReorderView() {
  const [orders, setOrders] = useState<OrderRecord[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/orders?limit=50")
      .then(async (response) => {
        if (response.status === 401) {
          window.location.href = "/sign-in?redirect_url=/reorder";
          return;
        }
        const data = await response.json();
        setOrders(data.orders ?? []);
      })
      .catch(() => setError("Could not load orders"));
  }, []);

  async function selectOrder(id: string) {
    setSelected(id);
    setError(null);
    const response = await fetch(`/api/orders/${id}/reorder`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not load reorder preview");
      return;
    }
    setItems(data.items);
    setQty(Object.fromEntries(data.items.map((item: PreviewItem) => [item.product_id, item.cases])));
  }

  async function reorderAll() {
    if (!selected) return;
    setPending(true);
    try {
      const response = await fetch(`/api/orders/${selected}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items
            .filter((item) => !item.out_of_stock)
            .map((item) => ({ product_id: item.product_id, cases: qty[item.product_id] ?? item.cases })),
        }),
      });
      if (!response.ok) throw new Error("Could not add to cart");
      emitCartUpdated();
      setToast("Available items added to your cart.");
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : "Reorder failed");
    } finally {
      setPending(false);
    }
  }

  if (!orders) return <p className="text-sm text-slate-600">Loading past orders…</p>;

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-navy">No past orders yet</h2>
        <p className="mt-2 text-sm text-slate-600">Place an order, then you can repeat it here with live prices.</p>
        <Link href="/catalog" className="mt-6 inline-flex h-11 items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white">
          Browse catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <ul className="space-y-2">
        {orders.map((order) => (
          <li key={order.id}>
            <button
              type="button"
              onClick={() => void selectOrder(order.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left ${
                selected === order.id ? "border-navy bg-white" : "border-slate-200 bg-white hover:border-sky"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-navy">{order.id}</span>
                <OrderStatusBadge status={order.status} />
              </span>
              <span className="mt-1 block text-xs text-slate-500">{formatDate(order.created_at)}</span>
              <span className="mt-1 block text-sm text-navy">{formatCents(order.total_cents)}</span>
            </button>
          </li>
        ))}
      </ul>
      <div>
        {!selected ? (
          <p className="text-sm text-slate-600">Select an order to review current stock and pricing.</p>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white">
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <li key={item.product_id} className="px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-navy">{item.current_name}</p>
                      <p className="font-mono text-xs text-slate-500">{item.sku}</p>
                      {item.out_of_stock ? (
                        <p className="mt-1 text-xs text-rose-700">Out of stock — skipped on reorder</p>
                      ) : null}
                      {item.price_changed && item.current_price_cents != null ? (
                        <p className="mt-1 text-xs text-amber-800">
                          Price changed from {formatCents(item.unit_price_cents_at_purchase)} to{" "}
                          {formatCents(item.current_price_cents)}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500">
                          {formatCents(item.current_price_cents ?? item.unit_price_cents_at_purchase)} / case
                        </p>
                      )}
                    </div>
                    <label className="text-sm">
                      <span className="sr-only">Cases for {item.sku}</span>
                      <input
                        type="number"
                        min={1}
                        disabled={item.out_of_stock}
                        value={qty[item.product_id] ?? item.cases}
                        onChange={(event) =>
                          setQty((current) => ({
                            ...current,
                            [item.product_id]: Math.max(1, Number(event.target.value) || 1),
                          }))
                        }
                        className="h-10 w-20 rounded-lg border border-slate-200 px-2 text-sm"
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
            {error ? <p className="px-4 pb-3 text-sm text-rose-700">{error}</p> : null}
            <div className="border-t border-slate-100 p-4">
              <button
                type="button"
                disabled={pending}
                className="h-11 rounded-lg bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-muted disabled:bg-slate-300"
                onClick={() => void reorderAll()}
              >
                {pending ? "Adding…" : "Reorder all available"}
              </button>
            </div>
          </div>
        )}
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
