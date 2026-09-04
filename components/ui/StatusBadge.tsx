import type { OrderStatus, StockStatus } from "@/types/commerce";

const ORDER_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  fulfilled: "Delivered",
  cancelled: "Cancelled",
  payment_failed: "Payment failed",
};

const ORDER_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  paid: "bg-sky-50 text-sky-900 ring-sky-200",
  fulfilled: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-slate-100 text-slate-700 ring-slate-200",
  payment_failed: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${ORDER_STYLES[status]}`}
      aria-label={`Order status: ${ORDER_LABELS[status]}`}
    >
      {ORDER_LABELS[status]}
    </span>
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export type { StockStatus };
