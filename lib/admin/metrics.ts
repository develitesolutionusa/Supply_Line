export const ADMIN_METRICS_WINDOW_DAYS = 30;
export const ADMIN_METRICS_WINDOW_MS = ADMIN_METRICS_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export type AdminMetricsRow = {
  sales_cents: number;
  paid_orders: number;
  pending_orders: number;
  new_accounts: number;
};

export type AdminMetrics = AdminMetricsRow & {
  avg_order_value_cents: number;
  window_days: number;
  since: string;
};

export function summarizeAdminMetrics(
  row: AdminMetricsRow,
  since: string,
  windowDays = ADMIN_METRICS_WINDOW_DAYS,
): AdminMetrics {
  const sales_cents = Number(row.sales_cents) || 0;
  const paid_orders = Number(row.paid_orders) || 0;
  return {
    sales_cents,
    paid_orders,
    pending_orders: Number(row.pending_orders) || 0,
    avg_order_value_cents: paid_orders ? Math.round(sales_cents / paid_orders) : 0,
    new_accounts: Number(row.new_accounts) || 0,
    window_days: windowDays,
    since,
  };
}
