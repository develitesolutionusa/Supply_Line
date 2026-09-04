"use client";

import { useEffect, useState } from "react";
import { OrderStatusBadge, formatDate } from "@/components/ui/StatusBadge";
import { formatCents } from "@/lib/pricing";
import type { OrderRecord, OrderStatus } from "@/types/commerce";

const STATUSES: Array<OrderStatus | "all"> = [
  "all",
  "pending",
  "paid",
  "fulfilled",
  "cancelled",
  "payment_failed",
];

export function AdminOrderTable() {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(nextStatus = status) {
    const params = nextStatus === "all" ? "" : `?status=${nextStatus}`;
    const response = await fetch(`/api/admin/orders${params}`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not load orders");
      return;
    }
    setOrders(data.orders);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function updateStatus(id: string, next: OrderStatus) {
    setError(null);
    const response = await fetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not update status");
      return;
    }
    await load();
  }

  return (
    <div>
      <label className="text-sm font-medium text-navy" htmlFor="order-status">
        Filter by status
      </label>
      <select
        id="order-status"
        className="mt-2 h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"
        value={status}
        onChange={(event) => setStatus(event.target.value as OrderStatus | "all")}
      >
        {STATUSES.map((item) => (
          <option key={item} value={item}>
            {item.replace("_", " ")}
          </option>
        ))}
      </select>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      <div className="surface-card surface-card-static mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Update</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                <td className="px-4 py-3">{formatDate(order.created_at)}</td>
                <td className="px-4 py-3">{formatCents(order.total_cents)}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">
                  <select
                    aria-label={`Update status for ${order.id}`}
                    className="h-10 rounded-lg border border-slate-200 px-2 text-xs"
                    value={order.status}
                    onChange={(event) => void updateStatus(order.id, event.target.value as OrderStatus)}
                  >
                    {STATUSES.filter((item) => item !== "all").map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
