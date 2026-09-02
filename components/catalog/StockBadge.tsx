import type { StockStatus } from "@/types/commerce";

const LABELS: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

const STYLES: Record<StockStatus, string> = {
  in_stock: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  low_stock: "bg-amber-50 text-amber-800 ring-amber-200",
  out_of_stock: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function StockBadge({ status }: { status: StockStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STYLES[status]}`}
      aria-label={`Stock status: ${LABELS[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
